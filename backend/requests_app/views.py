"""
Vues de gestion des demandes académiques et administratives pour l'application requests_app.

Règles métier :
1. Les utilisateurs réguliers ont accès uniquement à leurs propres demandes.
2. Une demande ne peut être modifiée ou supprimée que si son statut est SUBMITTED.
3. Seuls les gestionnaires (rôle MANAGER) ont le droit d'altérer le statut d'une demande.
4. Les transitions de statuts respectent strictement le graphe ALLOWED_TRANSITIONS.
"""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.reverse import reverse

from .models import Request, StatusHistory, Comment
from .serializers import (
    RequestListSerializer,
    RequestDetailSerializer,
    RequestCreateSerializer,
    RequestUpdateSerializer,
    StatusChangeSerializer,
    CommentSerializer,
    CommentCreateSerializer,
)
from .permissions import CanEditRequest, CanViewRequest, CanChangeStatus, CanAddComment
from accounts.permissions import IsManager


@api_view(['GET'])
def api_root(request, format=None):
    """Point d'entree d'information et d'inspection de l'API."""
    return Response({
        'status': 'online',
        'service': 'UQO-Requests API',
        'endpoints': {
            'auth_token': reverse('token_obtain_pair', request=request, format=format),
            'my_requests': reverse('requests_app:request-list', request=request, format=format),
            'manager_dashboard': reverse('requests_app:manager-requests', request=request, format=format),
        }
    })


class RequestViewSet(viewsets.ModelViewSet):
    """
    Gestion du cycle de vie des demandes (creation, consultation, mise a jour, suppression).
    Actions personnalisees pour la transition de statut et les commentaires.
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
            'status_history', 'comments'
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
        elif self.action in ['retrieve', 'list']:
            return [IsAuthenticated(), CanViewRequest()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Cree une demande pour un utilisateur regulier."""
        if request.user.role == 'MANAGER':
            return Response(
                {'error': 'Les gestionnaires ne sont pas autorisés à créer des demandes directes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        return Response(
            RequestDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Met a jour une demande au statut SUBMITTED."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            RequestDetailSerializer(instance, context={'request': request}).data
        )

    def destroy(self, request, *args, **kwargs):
        """Supprime une demande au statut SUBMITTED."""
        instance = self.get_object()
        instance.delete()

        return Response(
            {'message': 'Demande supprimée avec succès.'},
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        """
        Transition de statut executee par un gestionnaire.
        Consigne automatiquement l'operation dans StatusHistory.
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

        return Response({
            'message': f"Statut changé de '{dict(Request.Status.choices).get(old_status)}' "
                      f"vers '{dict(Request.Status.choices).get(new_status)}'.",
            'request': RequestDetailSerializer(request_obj, context={'request': request}).data
        })

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        """Gestion des commentaires d'une demande."""
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

            comment = Comment.objects.create(
                request=request_obj,
                author=request.user,
                content=serializer.validated_data['content']
            )

            return Response(
                CommentSerializer(comment).data,
                status=status.HTTP_201_CREATED
            )


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
