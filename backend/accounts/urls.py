"""
Patterns d'URL pour l'application accounts.

Ce fichier définit les routes (endpoints) disponibles pour
l'authentification et la gestion des profils utilisateurs.

Toutes les URLs sont préfixées par /api/auth/ (configuré dans config/urls.py).
"""

# Importation de la fonction path pour définir les URLs
from django.urls import path

# Importation des vues de l'application
from .views import RegisterView, ProfileView, ChangePasswordView

# Namespace de l'application - utilisé pour référencer les URLs par nom
# Exemple: reverse('accounts:register')
app_name = 'accounts'

# Définition des patterns d'URL
urlpatterns = [
    # POST /api/auth/register/ - Inscription d'un nouvel utilisateur
    # Corps: {"email", "username", "password", "password_confirm", "first_name", "last_name"}
    path('register/', RegisterView.as_view(), name='register'),
    
    # GET /api/auth/profile/ - Consulter le profil de l'utilisateur connecté
    # PUT/PATCH /api/auth/profile/ - Modifier le profil (first_name, last_name)
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # POST /api/auth/change-password/ - Changer le mot de passe
    # Corps: {"old_password", "new_password", "new_password_confirm"}
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
