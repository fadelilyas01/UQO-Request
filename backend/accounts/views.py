"""
Vues d'authentification et de gestion de compte pour l'application accounts.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    UQOTokenObtainPairSerializer,
)

User = get_user_model()


class UQOTokenObtainPairView(TokenObtainPairView):
    """
    Vue d'authentification JWT personnalisee restreinte au domaine @uqo.ca.
    """

    permission_classes = [AllowAny]
    serializer_class = UQOTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """
    Point de terminaison pour l'inscription d'un nouvel utilisateur.
    Accessible publiquement (AllowAny).
    """

    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        """Valide la charge utile et persiste le nouvel utilisateur."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'message': 'Inscription réussie. Vous pouvez maintenant vous connecter.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Consultation et mise a jour du profil de l'utilisateur connecte.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Selectionne le serializer approprie selon l'operation (lecture ou ecriture)."""
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        """Restreint l'acces exclusivement au profil de l'utilisateur authentifie."""
        return self.request.user


class ChangePasswordView(APIView):
    """
    Point de terminaison pour le renouvellement du mot de passe utilisateur.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Valide l'ancien mot de passe puis applique le nouveau mot de passe."""
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response({
            'message': 'Mot de passe modifié avec succès.'
        }, status=status.HTTP_200_OK)
