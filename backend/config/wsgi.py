"""
Configuration WSGI pour le projet UQO-Requests.

WSGI (Web Server Gateway Interface) est l'interface standard entre
les serveurs web et les applications Python.

Ce fichier est utilisé pour le déploiement en production avec des
serveurs comme Gunicorn, uWSGI, ou Apache avec mod_wsgi.

L'objet 'application' est le point d'entrée pour le serveur WSGI.
"""

# Importation du module os pour gérer les variables d'environnement
import os

# Importation de la fonction pour obtenir l'application WSGI Django
from django.core.wsgi import get_wsgi_application

# Définir le module de paramètres Django à utiliser
# 'config.settings' fait référence au fichier settings.py dans le dossier config
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Créer l'application WSGI
# Cette variable est utilisée par le serveur WSGI pour communiquer avec Django
application = get_wsgi_application()
