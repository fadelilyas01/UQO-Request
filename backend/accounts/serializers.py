"""
Serializers pour l'application accounts.
Conversion et validation des objets utilisateurs pour les flux d'authentification et de profil.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .validators import validate_uqo_email

User = get_user_model()


class UQOTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer JWT personnalise restreignant l'authentification exclusivement
    aux adresses courriel institutionnelles se terminant par @uqo.ca et
    embarquant les claims de roles et de profil dans le jeton signe.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Injection securisee des claims de role et d'identite
        token['email'] = user.email
        token['role'] = user.role
        token['username'] = user.username
        token['full_name'] = user.get_full_name()
        token['is_manager'] = user.is_manager
        return token

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        try:
            validate_uqo_email(email)
        except Exception:
            raise serializers.ValidationError({
                'detail': 'Seules les adresses institutionnelles se terminant par @uqo.ca sont autorisées.'
            })
        attrs['email'] = email
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    """
    Representation publique d'un utilisateur.
    Exclut les donnees sensibles (mot de passe) et protege les champs immuables.
    """

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'role',
            'date_joined',
        ]
        read_only_fields = ['id', 'email', 'role', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Validation et creation de compte pour les nouveaux utilisateurs.
    Valide les contraintes de complexite et de confirmation du mot de passe
    ainsi que l'appartenance exclusive au domaine @uqo.ca.
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email',
            'username',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        """Valide que l'adresse courriel appartient exclusivement au domaine @uqo.ca."""
        clean_email = value.strip().lower()
        validate_uqo_email(clean_email)
        if User.objects.filter(email=clean_email).exists():
            raise serializers.ValidationError('Un utilisateur avec cette adresse email existe déjà.')
        return clean_email

    def validate(self, attrs):
        """Valide la concordance des deux saisies du mot de passe."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Les mots de passe ne correspondent pas.'
            })
        return attrs

    def create(self, validated_data):
        """Instancie un utilisateur avec hachage securise du mot de passe."""
        validated_data.pop('password_confirm', None)

        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=User.Role.USER,
        )
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Mise a jour partielle du profil utilisateur.
    Restreint aux champs civils modifiables.
    """

    class Meta:
        model = User
        fields = ['first_name', 'last_name']


class ChangePasswordSerializer(serializers.Serializer):
    """
    Validation de modification de mot de passe par l'utilisateur connecte.
    Verifie l'ancien mot de passe avant d'appliquer le nouveau.
    """

    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Valide la correspondance entre les deux champs du nouveau mot de passe."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Les nouveaux mots de passe ne correspondent pas.'
            })
        return attrs

    def validate_old_password(self, value):
        """Verifie la validite du mot de passe courant."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Le mot de passe actuel est incorrect.')
        return value
