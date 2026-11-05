"""
Configuration de l'interface d'administration pour l'application accounts.

Ce module personnalise l'affichage et la gestion des utilisateurs
dans l'interface d'administration Django (/admin/).
"""

# Importation du module admin de Django
from django.contrib import admin

# Importation de la classe de base UserAdmin pour l'administration des utilisateurs
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# Importation du modèle User de notre application
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Configuration personnalisée de l'administration pour le modèle User.
    
    Cette classe étend BaseUserAdmin pour:
    - Afficher le champ 'role' dans la liste et les formulaires
    - Personnaliser les colonnes affichées dans la liste
    - Configurer les filtres et la recherche
    
    Hérite toutes les fonctionnalités de base de UserAdmin:
    - Gestion des mots de passe sécurisée
    - Groupes et permissions
    - Historique des actions
    """
    
    # Colonnes affichées dans la liste des utilisateurs
    list_display = [
        'email',        # Adresse email
        'username',     # Nom d'utilisateur
        'first_name',   # Prénom
        'last_name',    # Nom
        'role',         # Rôle (USER ou MANAGER)
        'is_active',    # Compte actif
        'date_joined',  # Date d'inscription
    ]
    
    # Filtres disponibles dans la barre latérale droite
    list_filter = [
        'role',         # Filtrer par rôle
        'is_active',    # Filtrer par statut actif
        'is_staff',     # Filtrer par accès admin
        'date_joined',  # Filtrer par date d'inscription
    ]
    
    # Champs utilisés pour la recherche
    search_fields = [
        'email',        # Recherche par email
        'username',     # Recherche par nom d'utilisateur
        'first_name',   # Recherche par prénom
        'last_name',    # Recherche par nom
    ]
    
    # Tri par défaut (- = ordre décroissant)
    ordering = ['-date_joined']  # Plus récent en premier
    
    # Configuration des fieldsets pour le formulaire de modification
    # Ajoute une section "Rôle" aux fieldsets hérités de BaseUserAdmin
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Rôle', {'fields': ('role',)}),
    )
    
    # Configuration des fieldsets pour le formulaire de création
    # Ajoute le champ 'role' lors de la création d'un utilisateur
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Rôle', {'fields': ('role',)}),
    )
