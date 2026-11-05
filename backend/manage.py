#!/usr/bin/env python
"""
Utilitaire en ligne de commande de Django pour les tâches administratives.
Ce fichier est le point d'entrée principal pour exécuter des commandes Django
comme 'runserver', 'migrate', 'makemigrations', etc.
"""

# Importation des modules nécessaires
import os  # Module pour interagir avec le système d'exploitation
import sys  # Module pour accéder aux paramètres et fonctions du système


def main():
    """
    Fonction principale qui exécute les tâches administratives.
    
    Cette fonction:
    1. Configure la variable d'environnement pour les paramètres Django
    2. Importe et exécute les commandes de gestion Django
    """
    # Définir le module de paramètres Django par défaut
    # 'config.settings' fait référence au fichier settings.py dans le dossier config
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    try:
        # Importer la fonction pour exécuter les commandes Django
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # Si Django n'est pas installé, lever une erreur explicative
        raise ImportError(
            "Impossible d'importer Django. Êtes-vous sûr qu'il est installé et "
            "disponible dans votre variable d'environnement PYTHONPATH ? "
            "Avez-vous oublié d'activer l'environnement virtuel ?"
        ) from exc
    
    # Exécuter la commande passée en argument (ex: runserver, migrate, etc.)
    execute_from_command_line(sys.argv)


# Point d'entrée du script - s'exécute uniquement si le fichier est lancé directement
if __name__ == '__main__':
    main()
