"""
Patterns d'URL pour l'application accounts.
Authentification JWT, gestion de session et profils utilisateurs.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView
from .views import RegisterView, ProfileView, ChangePasswordView

app_name = 'accounts'

urlpatterns = [
    # POST /api/auth/register/ - Inscription d'un nouvel utilisateur (@uqo.ca uniquement)
    path('register/', RegisterView.as_view(), name='register'),
    
    # GET /api/auth/profile/ - Consulter le profil de l'utilisateur connecte
    # PUT/PATCH /api/auth/profile/ - Modifier le profil (first_name, last_name)
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # POST /api/auth/change-password/ - Changer le mot de passe (regles de complexite strictes)
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # POST /api/auth/logout/ - Invalidation et blacklistage definitif du refresh token
    path('logout/', TokenBlacklistView.as_view(), name='logout'),
]
