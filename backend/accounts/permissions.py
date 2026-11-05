"""
Permissions personnalisées pour le contrôle d'accès basé sur les rôles.

Ce module définit des classes de permission réutilisables pour
contrôler l'accès aux différentes fonctionnalités de l'API
selon le rôle de l'utilisateur (USER ou MANAGER).

Chaque classe de permission retourne True si l'accès est autorisé,
False sinon. Le message d'erreur est personnalisé pour chaque permission.
"""

# Importation de la classe de base pour les permissions
from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    """
    Permission qui n'autorise l'accès qu'aux gestionnaires (MANAGER).
    
    Utilisation:
        Cette permission est utilisée pour protéger les endpoints
        réservés aux gestionnaires, comme la modification du statut
        des demandes.
    
    Exemple d'utilisation dans une vue:
        permission_classes = [IsAuthenticated, IsManager]
    """
    # Message d'erreur affiché si la permission est refusée
    message = "Seuls les gestionnaires peuvent effectuer cette action."
    
    def has_permission(self, request, view):
        """
        Vérifie si l'utilisateur a la permission d'accéder à la vue.
        
        Args:
            request: L'objet requête HTTP
            view: La vue à laquelle on tente d'accéder
        
        Returns:
            bool: True si l'utilisateur est un gestionnaire authentifié
        """
        return (
            request.user and              # L'utilisateur existe
            request.user.is_authenticated and  # L'utilisateur est authentifié
            request.user.role == 'MANAGER'     # L'utilisateur est un gestionnaire
        )


class IsRegularUser(BasePermission):
    """
    Permission qui n'autorise l'accès qu'aux utilisateurs réguliers (USER).
    
    Utilisation:
        Cette permission peut être utilisée pour les fonctionnalités
        réservées aux utilisateurs réguliers, comme la création de demandes.
    
    Note:
        Les gestionnaires ne peuvent pas créer de demandes car ils sont
        censés les traiter, pas les soumettre.
    """
    message = "Cette action est réservée aux utilisateurs réguliers."
    
    def has_permission(self, request, view):
        """
        Vérifie si l'utilisateur est un utilisateur régulier authentifié.
        
        Args:
            request: L'objet requête HTTP
            view: La vue à laquelle on tente d'accéder
        
        Returns:
            bool: True si l'utilisateur est un utilisateur régulier
        """
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'USER'
        )


class IsOwner(BasePermission):
    """
    Permission qui n'autorise l'accès qu'au propriétaire d'un objet.
    
    Cette permission vérifie au niveau de l'objet si l'utilisateur
    connecté est le propriétaire de la ressource demandée.
    
    Prérequis:
        L'objet doit avoir un attribut 'user' qui référence le propriétaire.
    
    Utilisation:
        Idéale pour protéger les ressources personnelles comme les demandes.
    """
    message = "Vous n'êtes pas le propriétaire de cette ressource."
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifie si l'utilisateur est le propriétaire de l'objet.
        
        Args:
            request: L'objet requête HTTP
            view: La vue à laquelle on accède
            obj: L'objet sur lequel on vérifie la permission
        
        Returns:
            bool: True si l'utilisateur est le propriétaire
        """
        # Vérifier si l'objet a un attribut 'user'
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsOwnerOrManager(BasePermission):
    """
    Permission qui autorise l'accès au propriétaire OU à un gestionnaire.
    
    Cette permission est utile pour les ressources qui doivent être:
    - Accessibles par leur propriétaire (pour consultation/modification)
    - Accessibles par les gestionnaires (pour supervision/traitement)
    
    Exemple d'utilisation:
        Un utilisateur peut voir ses propres demandes, et un gestionnaire
        peut voir toutes les demandes.
    """
    message = "Vous devez être le propriétaire ou un gestionnaire pour accéder à cette ressource."
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifie si l'utilisateur est propriétaire ou gestionnaire.
        
        Args:
            request: L'objet requête HTTP
            view: La vue à laquelle on accède
            obj: L'objet sur lequel on vérifie la permission
        
        Returns:
            bool: True si l'utilisateur est propriétaire ou gestionnaire
        """
        # Les gestionnaires peuvent accéder à tout
        if request.user.role == 'MANAGER':
            return True
        
        # Sinon, vérifier la propriété de l'objet
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
