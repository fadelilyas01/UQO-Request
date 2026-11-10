"""
Vues de gestion des demandes académiques et administratives pour l'application requests_app.

Règles métier :
1. Les utilisateurs réguliers ont accès uniquement à leurs propres demandes.
2. Une demande ne peut être modifiée ou supprimée que si son statut est SUBMITTED.
3. Seuls les gestionnaires (rôle MANAGER) ont le droit d'altérer le statut d'une demande.
4. Les transitions de statuts respectent strictement le graphe ALLOWED_TRANSITIONS.
5. Sceau d'intégrité SHA-256 calculé en direct pour les attestations PDF officielles (Rule 1.3).
6. Pièces jointes sécurisées avec vérification MIME et limitation à 5 Mo.
7. Notifications in-app automatiques lors des interactions clés.
"""

import os
import hashlib
from django.db import transaction
from django.http import HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.reverse import reverse

from accounts.models import User
from .models import Request, StatusHistory, Comment, Notification, RequestAttachment
from .serializers import (
    RequestListSerializer,
    RequestDetailSerializer,
    RequestCreateSerializer,
    RequestUpdateSerializer,
    StatusChangeSerializer,
    CommentSerializer,
    CommentCreateSerializer,
    NotificationSerializer,
    RequestAttachmentSerializer,
)
from .permissions import CanEditRequest, CanViewRequest, CanChangeStatus, CanAddComment
from .receipt_generator import generate_receipt_pdf
from accounts.permissions import IsManager


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_root(request, format=None):
    """Point d'entree securise d'information et d'inspection de l'API."""
    return Response({
        'status': 'online',
        'service': 'UQO-Requests API',
        'endpoints': {
            'auth_token': reverse('token_obtain_pair', request=request, format=format),
            'my_requests': reverse('requests_app:request-list', request=request, format=format),
            'manager_dashboard': reverse('requests_app:manager-requests', request=request, format=format),
            'notifications': reverse('requests_app:notification-list', request=request, format=format),
        }
    })


class RequestViewSet(viewsets.ModelViewSet):
    """
    Gestion du cycle de vie des demandes (creation, consultation, mise a jour, suppression).
    Actions personnalisees pour la transition de statut, les commentaires,
    les pieces jointes et le telechargement de l'attestation PDF scellee.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtre les demandes selon le role RBAC de l'utilisateur.
        - MANAGER : acces a l'ensemble des demandes.
        - USER : restriction aux demandes dont l'utilisateur est le createur.
        """
        user = self.request.user

        if user.role == 'MANAGER':
            queryset = Request.objects.all()
        else:
            queryset = Request.objects.filter(user=user)

        status_filter = self.request.query_params.get('status')
        type_filter = self.request.query_params.get('type')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if type_filter:
            queryset = queryset.filter(type=type_filter)

        return queryset.select_related('user').prefetch_related(
            'status_history', 'comments', 'attachments'
        )

    def get_serializer_class(self):
        """Attribue le serializer dedie selon l'action CRUD executee."""
        if self.action == 'list':
            return RequestListSerializer
        elif self.action == 'create':
            return RequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RequestUpdateSerializer
        elif self.action == 'change_status':
            return StatusChangeSerializer
        return RequestDetailSerializer

    def get_permissions(self):
        """Applique les regles de securite selon l'action requise."""
        if self.action == 'create':
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanEditRequest()]
        elif self.action == 'change_status':
            return [IsAuthenticated(), CanChangeStatus()]
        elif self.action in ['retrieve', 'list', 'download_receipt', 'attachments', 'download_attachment']:
            return [IsAuthenticated(), CanViewRequest()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Cree une demande pour un utilisateur regulier avec garantie transactionnelle."""
        if request.user.role == 'MANAGER':
            return Response(
                {'error': 'Les gestionnaires ne sont pas autorisés à créer des demandes directes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            instance = serializer.save()

            # Notification automatique aux gestionnaires de la nouvelle demande
            managers = User.objects.filter(role='MANAGER')
            for m in managers:
                Notification.objects.create(
                    user=m,
                    request=instance,
                    title=f"Nouvelle requête #{instance.id}",
                    message=f"Nouvelle demande '{instance.title}' soumise par {request.user.get_full_name() or request.user.email}.",
                    notification_type=Notification.NotificationType.NEW_REQUEST
                )

        return Response(
            RequestDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Met a jour une demande au statut SUBMITTED avec garantie transactionnelle."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            serializer.save()

        return Response(
            RequestDetailSerializer(instance, context={'request': request}).data
        )

    def destroy(self, request, *args, **kwargs):
        """Supprime une demande au statut SUBMITTED de maniere atomique."""
        instance = self.get_object()
        with transaction.atomic():
            instance.delete()

        return Response(
            {'message': 'Demande supprimée avec succès.'},
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        """
        Transition de statut executee par un gestionnaire.
        Consigne automatiquement l'operation dans StatusHistory de maniere atomique
        et alerte l'etudiant via une notification in-app.
        """
        request_obj = self.get_object()

        serializer = StatusChangeSerializer(
            data=request.data,
            context={'request': request, 'request_obj': request_obj}
        )
        serializer.is_valid(raise_exception=True)

        old_status = request_obj.status
        new_status = serializer.validated_data['new_status']
        comment_text = serializer.validated_data.get('comment', '').strip()

        with transaction.atomic():
            request_obj.status = new_status
            request_obj.save()

            StatusHistory.objects.create(
                request=request_obj,
                changed_by=request.user,
                old_status=old_status,
                new_status=new_status
            )

            if comment_text:
                Comment.objects.create(
                    request=request_obj,
                    author=request.user,
                    content=comment_text
                )

            # Notification automatique pour le demandeur
            status_display = dict(Request.Status.choices).get(new_status, new_status)
            Notification.objects.create(
                user=request_obj.user,
                request=request_obj,
                title=f"Statut mis à jour (#{request_obj.id})",
                message=f"Votre demande #{request_obj.id} est désormais '{status_display}'.",
                notification_type=Notification.NotificationType.STATUS_CHANGE
            )

        return Response({
            'message': f"Statut changé de '{dict(Request.Status.choices).get(old_status)}' "
                      f"vers '{dict(Request.Status.choices).get(new_status)}'.",
            'request': RequestDetailSerializer(request_obj, context={'request': request}).data
        })

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        """Gestion des commentaires d'une demande avec notification instantanee."""
        request_obj = self.get_object()

        if not CanViewRequest().has_object_permission(request, self, request_obj):
            return Response(
                {'error': "Vous n'êtes pas autorisé à consulter cette demande."},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            comments = request_obj.comments.select_related('author')
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            if not CanAddComment().has_object_permission(request, self, request_obj):
                return Response(
                    {'error': "Vous n'êtes pas autorisé à commenter cette demande."},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = CommentCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                comment = Comment.objects.create(
                    request=request_obj,
                    author=request.user,
                    content=serializer.validated_data['content']
                )

                # Notifier la partie adverse
                if request.user.role == 'MANAGER':
                    Notification.objects.create(
                        user=request_obj.user,
                        request=request_obj,
                        title=f"Nouveau message officiel (#{request_obj.id})",
                        message=f"Le personnel administratif a répondu à votre dossier #{request_obj.id}.",
                        notification_type=Notification.NotificationType.COMMENT
                    )
                else:
                    managers = User.objects.filter(role='MANAGER')
                    for m in managers:
                        Notification.objects.create(
                            user=m,
                            request=request_obj,
                            title=f"Réponse étudiante (#{request_obj.id})",
                            message=f"L'étudiant {request.user.get_full_name() or request.user.email} a répondu sur le dossier #{request_obj.id}.",
                            notification_type=Notification.NotificationType.COMMENT
                        )

            return Response(
                CommentSerializer(comment).data,
                status=status.HTTP_201_CREATED
            )

    @action(detail=True, methods=['get'], url_path='download-receipt')
    def download_receipt(self, request, pk=None):
        """
        Genere et diffuse l'attestation officielle de depot en PDF scellee par SHA-256.
        Standard Zero-Fausse-Empreinte (Rule 1.3).
        """
        request_obj = self.get_object()

        if not CanViewRequest().has_object_permission(request, self, request_obj):
            return Response(
                {'error': "Accès non autorisé à l'attestation de ce dossier."},
                status=status.HTTP_403_FORBIDDEN
            )

        pdf_bytes, sha256_hash = generate_receipt_pdf(request_obj)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"attestation_depot_uqo_{request_obj.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['X-Integrity-SHA256'] = sha256_hash
        return response

    @action(detail=True, methods=['get', 'post'], url_path='attachments')
    def attachments(self, request, pk=None):
        """
        Gestion securisee des pieces jointes justificatives.
        Validation MIME stricte, limitation 5 Mo et calcul d'empreinte SHA-256 (Rule 1.3).
        """
        request_obj = self.get_object()

        if not CanViewRequest().has_object_permission(request, self, request_obj):
            return Response(
                {'error': "Accès non autorisé à ce dossier."},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            attachments = request_obj.attachments.select_related('uploaded_by')
            return Response(
                RequestAttachmentSerializer(attachments, many=True, context={'request': request}).data
            )

        elif request.method == 'POST':
            file_obj = request.FILES.get('file')
            if not file_obj:
                return Response(
                    {'error': "Veuillez sélectionner un fichier à téléverser."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 5 * 1024 * 1024)
            if file_obj.size > max_size:
                return Response(
                    {'error': "La taille du fichier dépasse la limite autorisée de 5 Mo."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            content_type = getattr(file_obj, 'content_type', '')
            allowed_types = getattr(settings, 'ALLOWED_ATTACHMENT_TYPES', [
                'application/pdf', 'image/png', 'image/jpeg', 'image/webp'
            ])
            if content_type not in allowed_types:
                return Response(
                    {'error': "Format non supporté. Seuls les fichiers PDF et images (PNG, JPG, WEBP) sont autorisés."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Calcul d'intégrité SHA-256 en flux continu
            hasher = hashlib.sha256()
            for chunk in file_obj.chunks():
                hasher.update(chunk)
            file_hash = hasher.hexdigest().upper()

            # Assainissement anti-path-traversal
            raw_filename = os.path.basename(file_obj.name)
            safe_filename = raw_filename.replace('..', '').strip() or 'justificatif.pdf'

            with transaction.atomic():
                attachment = RequestAttachment.objects.create(
                    request=request_obj,
                    file=file_obj,
                    file_name=safe_filename,
                    file_size=file_obj.size,
                    content_type=content_type,
                    file_hash=file_hash,
                    uploaded_by=request.user
                )

            return Response(
                RequestAttachmentSerializer(attachment, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

    @action(detail=True, methods=['get'], url_path=r'attachments/(?P<attachment_id>\d+)/download')
    def download_attachment(self, request, pk=None, attachment_id=None):
        """Telechargement securise avec controle d'acces strict sur la piece jointe."""
        request_obj = self.get_object()

        if not CanViewRequest().has_object_permission(request, self, request_obj):
            return Response(
                {'error': "Accès non autorisé."},
                status=status.HTTP_403_FORBIDDEN
            )

        attachment = get_object_or_404(RequestAttachment, id=attachment_id, request=request_obj)

        try:
            return FileResponse(
                attachment.file.open('rb'),
                content_type=attachment.content_type,
                as_attachment=True,
                filename=attachment.file_name
            )
        except Exception:
            return Response(
                {'error': "Le document demandé est indisponible sur le système de fichiers."},
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationViewSet(viewsets.ModelViewSet):
    """
    Gestion des notifications in-app pour l'utilisateur connecte.
    Permet de consulter le fil, le nombre non lu, et de marquer comme lu.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked_as_read'})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all_marked_as_read'})


class ManagerRequestListView(generics.ListAPIView):
    """
    Vue dediee aux gestionnaires pour la supervision transversale des demandes.
    Permet des filtres multi-criteres (statut, type, demandeur).
    """

    serializer_class = RequestListSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        queryset = Request.objects.all().select_related('user')

        status_filter = self.request.query_params.get('status')
        type_filter = self.request.query_params.get('type')
        user_filter = self.request.query_params.get('user')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        if user_filter:
            queryset = queryset.filter(user_id=user_filter)

        return queryset
