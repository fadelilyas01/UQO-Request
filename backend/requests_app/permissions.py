"""
Permissions personnalisées pour la gestion des demandes.

Ce module définit les règles d'accès au niveau de l'API qui
implémentent les règles métier critiques du système.

RÈGLES MÉTIER IMPORTANTES:
1. Les utilisateurs ne peuvent modifier que leurs propres demandes
2. Les demandes ne peuvent être modifiées que si leur statut est SUBMITTED
3. Une fois le statut changé à IN_PROGRESS ou au-delà, la modification est INTERDITE
4. Seuls les gestionnaires peuvent changer le statut des demandes
5. Les transitions de statut doivent suivre les chemins autorisés
"""

# Importation de la classe de base pour les permissions
from rest_framework.permissions import BasePermission


class CanEditRequest(BasePermission):
    """
    Permission pour modifier une demande.
    
    RÈGLES MÉTIER CRITIQUES:
    1. Seul le propriétaire peut modifier sa demande
    2. La demande ne peut être modifiée QUE si son statut est SUBMITTED
    3. Une fois le statut change vers IN_PROGRESS ou au-delà, la modification est INTERDITE
    
    Cette permission retourne une erreur 403 Forbidden si violée.
    
    Méthodes HTTP concernées: PUT, PATCH, DELETE
    """
    # Message par défaut si la permission est refusée
    message = "Cette demande ne peut plus être modifiée car elle n'est plus au statut 'Soumise'."
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifie si l'utilisateur peut modifier/supprimer cette demande.
        
        Args:
            request: L'objet requête HTTP
            view: La vue à laquelle on accède
            obj: La demande (Request) à modifier
        
        Returns:
            bool: True si la modification est autorisée
        """
        # Ne vérifier que pour les méthodes de modification
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            # Règle 1: L'utilisateur doit être le propriétaire
            if obj.user != request.user:
                self.message = "Vous n'êtes pas autorisé à modifier cette demande."
                return False
            
            # Règle 2: La demande doit être au statut SUBMITTED
            if obj.status != 'SUBMITTED':
                self.message = (
                    f"Cette demande ne peut plus être modifiée car elle est au statut "
                    f"'{obj.get_status_display()}'. Seules les demandes au statut 'Soumise' "
                    f"peuvent être modifiées."
                )
                return False
        
        return True


class CanViewRequest(BasePermission):
    """
    Permission pour consulter une demande.
    
    Règles d'accès:
    - Les utilisateurs réguliers ne peuvent voir que leurs propres demandes
    - Les gestionnaires peuvent voir toutes les demandes
    
    Cette permission est essentielle pour la confidentialité des données.
    """
    message = "Vous n'êtes pas autorisé à consulter cette demande."
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifie si l'utilisateur peut consulter cette demande.
        
        Args:
            request: L'objet requête HTTP
            view: La vue à laquelle on accède
            obj: La demande (Request) à consulter
        
        Returns:
            bool: True si la consultation est autorisée
        """
        # Les gestionnaires peuvent voir toutes les demandes
        if request.user.role == 'MANAGER':
            return True
        
        # Les utilisateurs réguliers ne peuvent voir que leurs propres demandes
        return obj.user == request.user


class CanChangeStatus(BasePermission):
    """
    Permission pour changer le statut d'une demande.
    
    RÈGLE MÉTIER CRITIQUE:
    SEULS les GESTIONNAIRES peuvent modifier le statut d'une demande.
    
    Les utilisateurs réguliers ne peuvent en aucun cas changer le statut,
    même de leurs propres demandes. Cela garantit l'intégrité du processus
    de traitement des demandes.
    """
    message = "Seuls les gestionnaires peuvent modifier le statut d'une demande."
    
    def has_permission(self, request, view):
        """
        Vérifie si l'utilisateur peut accéder à l'endpoint de changement de statut.
        
        Cette méthode est appelée AVANT d'accéder à un objet spécifique.
        Elle vérifie simplement si l'utilisateur est un gestionnaire.
        
        Args:
            request: L'objet requête HTTP
            view: La vue à laquelle on accède
        
        Returns:
            bool: True si l'utilisateur est un gestionnaire authentifié
        """
        return (
            request.user and                   # L'utilisateur existe
            request.user.is_authenticated and  # L'utilisateur est authentifié
            request.user.role == 'MANAGER'     # L'utilisateur est un gestionnaire
        )


class CanAddComment(BasePermission):
    """
    Permission pour ajouter un commentaire à une demande.
    
    Règles d'accès:
    - Le propriétaire de la demande peut commenter sa propre demande
    - Les gestionnaires peuvent commenter n'importe quelle demande
    
    Cela permet la communication bidirectionnelle entre:
    - L'utilisateur qui a soumis la demande
    - Les gestionnaires qui la traitent
    """
    message = "Vous n'êtes pas autorisé à commenter cette demande."
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifie si l'utilisateur peut commenter cette demande.
        
        Args:
            request: L'objet requête HTTP
            view: La vue à laquelle on accède
            obj: La demande (Request) à commenter
        
        Returns:
            bool: True si l'ajout de commentaire est autorisé
        """
        # Les gestionnaires peuvent commenter n'importe quelle demande
        if request.user.role == 'MANAGER':
            return True
        
        # Le propriétaire peut commenter sa propre demande
        return obj.user == request.user
