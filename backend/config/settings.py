"""
Django settings - Projet UQO-Requests
Module de configuration centralise pour le backend API.
"""

import os
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlsplit, unquote
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# ============================================================================
# CHEMINS DU PROJET
# ============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================================
# SECURITE & ENVIRONNEMENT
# ============================================================================
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'django-insecure-dev-local-fallback-key'
    else:
        raise ValueError(
            "ERREUR CRITIQUE DE SECURITE: La variable SECRET_KEY est obligatoire en production !"
        )

ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()]

# ============================================================================
# APPLICATIONS INSTALLEES
# ============================================================================
INSTALLED_APPS = [
    # Theme d'administration
    'jazzmin',

    # Applications Django natives
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Dependances tierces
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # Applications metier
    'accounts',
    'requests_app',
]

# ============================================================================
# MIDDLEWARES
# ============================================================================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# ============================================================================
# TEMPLATES
# ============================================================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ============================================================================
# BASE DE DONNEES - PostgreSQL
# ============================================================================
DATABASE_URL = os.getenv('DATABASE_URL', '')

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL n'est pas configure. Une base PostgreSQL est requise pour cette application."
    )

if not (DATABASE_URL.startswith('postgres://') or DATABASE_URL.startswith('postgresql://')):
    raise ValueError(
        f"Format DATABASE_URL non supporte: {DATABASE_URL}. Utiliser postgres://USER:PASSWORD@HOST:PORT/NAME"
    )

parsed_db = urlsplit(DATABASE_URL)
db_name = parsed_db.path.lstrip('/')
if not db_name or not parsed_db.hostname:
    raise ValueError(f"URL de base de donnees invalide: {DATABASE_URL}")

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'USER': unquote(parsed_db.username or 'postgres'),
        'PASSWORD': unquote(parsed_db.password or ''),
        'HOST': parsed_db.hostname,
        'PORT': str(parsed_db.port or 5432),
        'NAME': unquote(db_name),
    }
}

# ============================================================================
# MODELE UTILISATEUR PERSONNALISE
# ============================================================================
AUTH_USER_MODEL = 'accounts.User'

# ============================================================================
# VALIDATION DES MOTS DE PASSE
# ============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================================
# INTERNATIONALISATION & FUSEAU HORAIRE
# ============================================================================
LANGUAGE_CODE = 'fr-ca'
TIME_ZONE = 'America/Toronto'
USE_I18N = True
USE_TZ = True

# ============================================================================
# FICHIERS STATIQUES
# ============================================================================
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================================
# DJANGO REST FRAMEWORK & SECURITE API
# ============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/minute',
        'user': '200/minute',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ============================================================================
# JSON WEB TOKENS (JWT)
# ============================================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('ACCESS_TOKEN_LIFETIME', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('REFRESH_TOKEN_LIFETIME', 1440))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# ============================================================================
# CORS (Cross-Origin Resource Sharing)
# ============================================================================
CORS_ALLOW_CREDENTIALS = True

cors_env = os.getenv('CORS_ALLOWED_ORIGINS')
if cors_env:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_env.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

# En-tetes de securite additionnels en production
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() == 'true'
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False').lower() == 'true'

# ============================================================================
# JAZZMIN - CONFIGURATION DU THEME D'ADMINISTRATION
# ============================================================================
JAZZMIN_SETTINGS = {
    "site_title": "UQO-Requests Admin",
    "site_header": "UQO-Requests",
    "site_brand": "UQO-Requests",
    "welcome_sign": "Administration UQO-Requests",
    "copyright": "Universite du Quebec en Outaouais",
    "show_ui_builder": False,
    "search_model": ["accounts.User", "requests_app.Request"],
    "user_avatar": None,
    "topmenu_links": [
        {"name": "Accueil", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Voir le site", "url": os.getenv('FRONTEND_URL', 'http://localhost'), "new_window": True},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "accounts.User": "fas fa-user-tie",
        "requests_app.Request": "fas fa-clipboard-list",
        "requests_app.StatusHistory": "fas fa-history",
        "requests_app.Comment": "fas fa-comments",
    },
    "default_icon_parents": "fas fa-folder",
    "default_icon_children": "fas fa-circle",
    "order_with_respect_to": ["accounts", "requests_app", "auth"],
    "related_modal_active": True,
    "custom_css": "css/admin_premium.css",
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-indigo",
    "accent": "accent-indigo",
    "navbar": "navbar-indigo navbar-dark",
    "no_navbar_border": True,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-indigo",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": True,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-indigo",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    },
    "actions_sticky_top": True,
}
