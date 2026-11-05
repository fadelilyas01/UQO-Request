"""
Serializers pour l'application requests_app.
Validation, serialisation et regles metier de transition de statut pour les demandes.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Request, StatusHistory, Comment

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    """Informations publiques abregees d'un utilisateur associe a une ressource."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class StatusHistorySerializer(serializers.ModelSerializer):
    """Serialisation des traces d'audit de modification de statut."""

    changed_by = UserMinimalSerializer(read_only=True)
    old_status_display = serializers.CharField(source='get_old_status_display', read_only=True)
    new_status_display = serializers.CharField(source='get_new_status_display', read_only=True)

    class Meta:
        model = StatusHistory
        fields = [
            'id',
            'old_status',
            'old_status_display',
            'new_status',
            'new_status_display',
            'changed_by',
            'changed_at',
        ]

    def get_old_status_display(self, obj):
        return dict(Request.Status.choices).get(obj.old_status, obj.old_status)

    def get_new_status_display(self, obj):
        return dict(Request.Status.choices).get(obj.new_status, obj.new_status)


class CommentSerializer(serializers.ModelSerializer):
    """Lecture des commentaires d'une demande."""

    author = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class CommentCreateSerializer(serializers.ModelSerializer):
    """Validation de la saisie d'un nouveau commentaire."""

    class Meta:
        model = Comment
        fields = ['content']

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le contenu du commentaire ne peut pas être vide.")
        return value.strip()


class RequestListSerializer(serializers.ModelSerializer):
    """Vue simplifiee pour le listage des demandes."""

    user = UserMinimalSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = [
            'id',
            'title',
            'type',
            'type_display',
            'status',
            'status_display',
            'user',
            'created_at',
            'updated_at',
            'can_edit',
        ]

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        return obj.user == request.user and obj.status == 'SUBMITTED'


class RequestDetailSerializer(serializers.ModelSerializer):
    """Vue detaillee complete d'une demande incluant historique et commentaires."""

    user = UserMinimalSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = [
            'id',
            'title',
            'type',
            'type_display',
            'description',
            'status',
            'status_display',
            'user',
            'created_at',
            'updated_at',
            'can_edit',
            'status_history',
            'comments',
        ]

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        return obj.user == request.user and obj.status == 'SUBMITTED'


class RequestCreateSerializer(serializers.ModelSerializer):
    """Validation de la creation d'une demande par un etudiant/utilisateur."""

    class Meta:
        model = Request
        fields = ['title', 'type', 'description']

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le titre ne peut pas être vide.")
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Le titre doit contenir au moins 5 caractères.")
        return value.strip()

    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("La description ne peut pas être vide.")
        if len(value.strip()) < 20:
            raise serializers.ValidationError("La description doit contenir au moins 20 caractères.")
        return value.strip()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['status'] = Request.Status.SUBMITTED
        return super().create(validated_data)


class RequestUpdateSerializer(serializers.ModelSerializer):
    """Validation de la mise a jour d'une demande au statut SUBMITTED."""

    class Meta:
        model = Request
        fields = ['title', 'type', 'description']

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le titre ne peut pas être vide.")
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Le titre doit contenir au moins 5 caractères.")
        return value.strip()

    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("La description ne peut pas être vide.")
        if len(value.strip()) < 20:
            raise serializers.ValidationError("La description doit contenir au moins 20 caractères.")
        return value.strip()


class StatusChangeSerializer(serializers.Serializer):
    """Validation metier pour le changement de statut par les gestionnaires."""

    new_status = serializers.ChoiceField(choices=Request.Status.choices)
    comment = serializers.CharField(required=False, allow_blank=True)

    def validate_new_status(self, value):
        request_obj = self.context.get('request_obj')

        if not request_obj:
            raise serializers.ValidationError("Demande non trouvée.")

        if request_obj.status == value:
            raise serializers.ValidationError(
                f"La demande est déjà au statut '{dict(Request.Status.choices).get(value)}'."
            )

        if not request_obj.can_transition_to(value):
            current_display = request_obj.get_status_display()
            target_display = dict(Request.Status.choices).get(value)
            allowed = Request.ALLOWED_TRANSITIONS.get(request_obj.status, [])
            allowed_display = [dict(Request.Status.choices).get(s) for s in allowed]

            if not allowed:
                raise serializers.ValidationError(
                    f"La demande au statut '{current_display}' ne peut plus être modifiée (statut final)."
                )
            else:
                raise serializers.ValidationError(
                    f"Transition de '{current_display}' vers '{target_display}' non autorisée. "
                    f"Transitions possibles: {', '.join(allowed_display)}."
                )

        return value
