"""
Configuration des URLs pour le projet UQO-Requests.

Ce fichier définit toutes les routes (endpoints) de l'API.
Chaque URL est associée à une vue qui traite les requêtes.
"""

# Importation des modules nécessaires
from django.contrib import admin  # Interface d'administration Django
from django.urls import path, include  # Fonctions pour définir les URLs

# Vues JWT pour l'authentification par token
from rest_framework_simplejwt.views import (
    TokenObtainPairView,   # Vue pour obtenir une paire de tokens (access + refresh)
    TokenRefreshView,      # Vue pour rafraîchir le token d'accès
)

# ============================================================================
# DÉFINITION DES PATTERNS D'URL
# ============================================================================
urlpatterns = [
    # -------------------------------------------------------------------------
    # Interface d'administration Django
    # -------------------------------------------------------------------------
    # Accessible à /admin/ - Interface graphique pour gérer les données
    path('admin/', admin.site.urls),
    
    # -------------------------------------------------------------------------
    # Endpoints d'authentification JWT
    # -------------------------------------------------------------------------
    # POST /api/auth/token/ - Obtenir un token d'accès et un token de rafraîchissement
    # Corps de la requête: {"email": "...", "password": "..."}
    # Réponse: {"access": "...", "refresh": "..."}
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # POST /api/auth/token/refresh/ - Rafraîchir le token d'accès
    # Corps de la requête: {"refresh": "..."}
    # Réponse: {"access": "..."}
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # -------------------------------------------------------------------------
    # URLs des applications
    # -------------------------------------------------------------------------
    # Inclure les URLs de l'application accounts (inscription, profil, etc.)
    # Ces URLs sont préfixées par /api/auth/
    path('api/auth/', include('accounts.urls')),
    
    # Inclure les URLs de l'application requests_app (gestion des demandes)
    # Ces URLs sont préfixées par /api/
    path('api/', include('requests_app.urls')),
]
