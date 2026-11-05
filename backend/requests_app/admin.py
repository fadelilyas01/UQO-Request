"""
Configuration de l'interface d'administration pour l'application requests_app.

Ce module personnalise l'affichage et la gestion des demandes, de l'historique
des statuts et des commentaires dans l'interface d'administration Django (/admin/).

Fonctionnalités:
- Affichage inline de l'historique et des commentaires dans la vue demande
- Filtres et recherche personnalisés
- Champs en lecture seule pour l'audit
"""

# Importation du module admin de Django
from django.contrib import admin

# Importation des modèles de l'application
from .models import Request, StatusHistory, Comment


class StatusHistoryInline(admin.TabularInline):
    """
    Affichage inline de l'historique des statuts dans la page d'une demande.
    
    Permet de voir tous les changements de statut directement dans la page
    de modification d'une demande, sans naviguer vers une autre page.
    
    Configuration:
    - Format tabulaire (une ligne par entrée d'historique)
    - Tous les champs sont en lecture seule (historique non modifiable)
    - Pas de formulaire d'ajout (extra=0)
    """
    model = StatusHistory           # Modèle lié
    extra = 0                       # Pas de formulaire vide supplémentaire
    # Tous les champs sont en lecture seule pour préserver l'intégrité de l'audit
    readonly_fields = ['old_status', 'new_status', 'changed_by', 'changed_at']
    can_delete = False              # Impossible de supprimer l'historique


class CommentInline(admin.TabularInline):
    """
    Affichage inline des commentaires dans la page d'une demande.
    
    Permet de voir et ajouter des commentaires directement dans la page
    de modification d'une demande.
    
    Configuration:
    - Format tabulaire (une ligne par commentaire)
    - L'auteur et la date sont en lecture seule (définis automatiquement)
    """
    model = Comment                 # Modèle lié
    extra = 0                       # Pas de formulaire vide supplémentaire
    readonly_fields = ['author', 'created_at']  # Champs auto-définis


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    """
    Configuration de l'administration pour le modèle Request (Demande).
    
    Cette classe configure:
    - Les colonnes affichées dans la liste
    - Les filtres disponibles
    - Les champs de recherche
    - L'organisation des champs dans le formulaire
    - Les vues inline pour l'historique et les commentaires
    """
    
    # Colonnes affichées dans la liste des demandes
    list_display = [
        'id',           # Identifiant unique
        'title',        # Titre de la demande
        'type',         # Type (académique, administrative, etc.)
        'status',       # Statut actuel
        'user',         # Demandeur
        'created_at',   # Date de création
        'updated_at',   # Dernière modification
    ]
    
    # Filtres disponibles dans la barre latérale droite
    list_filter = [
        'status',       # Filtrer par statut
        'type',         # Filtrer par type
        'created_at',   # Filtrer par date de création
    ]
    
    # Champs utilisés pour la recherche
    # Utilise une syntaxe de lookup (user__email = champ email de l'utilisateur lié)
    search_fields = [
        'title',                    # Recherche dans le titre
        'description',              # Recherche dans la description
        'user__email',              # Recherche par email du demandeur
        'user__first_name',         # Recherche par prénom du demandeur
        'user__last_name',          # Recherche par nom du demandeur
    ]
    
    # Champs en lecture seule (non modifiables)
    readonly_fields = ['created_at', 'updated_at']
    
    # Tri par défaut (- = ordre décroissant)
    ordering = ['-created_at']      # Plus récent en premier
    
    # Inclure les vues inline pour l'historique et les commentaires
    inlines = [StatusHistoryInline, CommentInline]
    
    # Organisation des champs dans le formulaire de modification
    fieldsets = (
        # Section 1: Informations générales
        ('Informations générales', {
            'fields': ('title', 'type', 'description')
        }),
        # Section 2: Statut et demandeur
        ('Statut', {
            'fields': ('status', 'user')
        }),
        # Section 3: Dates (repliée par défaut)
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)  # Section repliable
        }),
    )


@admin.register(StatusHistory)
class StatusHistoryAdmin(admin.ModelAdmin):
    """
    Configuration de l'administration pour le modèle StatusHistory.
    
    L'historique des statuts est principalement en lecture seule
    car il représente un journal d'audit des changements.
    """
    
    # Colonnes affichées dans la liste
    list_display = [
        'request',      # Demande concernée
        'old_status',   # Ancien statut
        'new_status',   # Nouveau statut
        'changed_by',   # Qui a fait le changement
        'changed_at',   # Quand
    ]
    
    # Filtres disponibles
    list_filter = [
        'old_status',   # Filtrer par ancien statut
        'new_status',   # Filtrer par nouveau statut
        'changed_at',   # Filtrer par date
    ]
    
    # Recherche par titre de la demande
    search_fields = ['request__title']
    
    # Tous les champs sont en lecture seule (journal d'audit)
    readonly_fields = ['request', 'old_status', 'new_status', 'changed_by', 'changed_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """
    Configuration de l'administration pour le modèle Comment.
    
    Permet de gérer et rechercher les commentaires sur les demandes.
    """
    
    # Colonnes affichées dans la liste
    list_display = [
        'request',          # Demande commentée
        'author',           # Auteur du commentaire
        'content_preview',  # Aperçu du contenu (méthode personnalisée)
        'created_at',       # Date de création
    ]
    
    # Filtres disponibles
    list_filter = ['created_at']  # Filtrer par date
    
    # Champs de recherche
    search_fields = [
        'content',          # Recherche dans le contenu
        'request__title',   # Recherche par titre de la demande
        'author__email',    # Recherche par email de l'auteur
    ]
    
    # Champs en lecture seule
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        """
        Retourne un aperçu du contenu du commentaire.
        
        Tronque le contenu à 50 caractères pour un affichage
        plus compact dans la liste.
        
        Args:
            obj: L'instance Comment
        
        Returns:
            str: Les 50 premiers caractères suivis de '...' si tronqué
        """
        if len(obj.content) > 50:
            return obj.content[:50] + '...'
        return obj.content
    
    # Nom de la colonne dans l'interface admin
    content_preview.short_description = 'Contenu'
