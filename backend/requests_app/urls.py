"""
Patterns d'URL pour l'application requests_app.

Ce fichier définit les routes (endpoints) disponibles pour
la gestion des demandes.

Utilise un Router de Django REST Framework pour générer automatiquement
les URLs CRUD (Create, Read, Update, Delete) pour les demandes.
"""

# Importation des fonctions pour définir les URLs
from django.urls import path, include

# Importation du Router pour générer les URLs automatiquement
from rest_framework.routers import SimpleRouter

# Importation des vues de l'application
from .views import RequestViewSet, NotificationViewSet, ManagerRequestListView, api_root

# Namespace de l'application - utilisé pour référencer les URLs par nom
# Exemple: reverse('requests_app:request-list')
app_name = 'requests_app'

# ============================================================================
# CONFIGURATION DU ROUTER
# ============================================================================
# Le SimpleRouter génère les URLs sans vue racine par défaut.
# Nous utilisons notre propre vue racine (api_root).
router = SimpleRouter()
router.register(r'requests', RequestViewSet, basename='request')
router.register(r'notifications', NotificationViewSet, basename='notification')

# ============================================================================
# DÉFINITION DES PATTERNS D'URL
# ============================================================================
urlpatterns = [
    # Vue racine personnalisée pour l'API (accessible sans auth)
    path('', api_root, name='api-root'),

    # Inclure toutes les URLs générées par le Router
    # Préfixe: /api/ (configuré dans config/urls.py)
    path('', include(router.urls)),
    
    # Endpoint spécifique pour les gestionnaires
    # GET /api/manager/requests/ - Liste toutes les demandes (gestionnaires uniquement)
    # Permet des filtres supplémentaires par utilisateur
    path('manager/requests/', ManagerRequestListView.as_view(), name='manager-requests'),
]

# ============================================================================
# RÉSUMÉ DES ENDPOINTS DISPONIBLES
# ============================================================================
# 
# DEMANDES (pour tous les utilisateurs authentifiés):
# - GET    /api/requests/                  -> Liste des demandes (filtrée par rôle)
# - POST   /api/requests/                  -> Créer une nouvelle demande
# - GET    /api/requests/{id}/             -> Détail d'une demande
# - PUT    /api/requests/{id}/             -> Modifier une demande (si SUBMITTED)
# - PATCH  /api/requests/{id}/             -> Modifier partiellement (si SUBMITTED)
# - DELETE /api/requests/{id}/             -> Supprimer une demande (si SUBMITTED)
#
# ACTIONS PERSONNALISÉES:
# - POST   /api/requests/{id}/change-status/  -> Changer le statut (gestionnaires)
# - GET    /api/requests/{id}/comments/       -> Liste des commentaires
# - POST   /api/requests/{id}/comments/       -> Ajouter un commentaire
#
# GESTIONNAIRES:
# - GET    /api/manager/requests/          -> Liste toutes les demandes
