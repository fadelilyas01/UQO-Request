# UQO-Requests — Backend API (Django REST Framework)

Service d'API RESTful pour la gestion des comptes utilisateurs, du contrôle d'accès RBAC et des demandes académiques et administratives.

---

## Stack Technique

- Langage : Python 3.11
- Framework Web : Django 4.2 LTS
- API Toolkit : Django REST Framework (DRF) 3.16
- Authentification : `djangorestframework-simplejwt` (Access & Refresh tokens)
- Base de données : PostgreSQL 15 via `psycopg2-binary`
- Fichiers Statiques : WhiteNoise 6.11
- Administration : Django Jazzmin

---

## Structure des Applications

```
backend/
├── accounts/               # Authentification, modele User custom et profils
│   ├── models.py           # User (role USER / MANAGER, auth email)
│   ├── permissions.py      # IsManager, IsRegularUser
│   ├── serializers.py      # Validation des flux utilisateurs
│   ├── urls.py             # Routes /api/auth/
│   └── views.py            # Endpoints register, profile, change-password
├── requests_app/           # Gestion metier des requetes
│   ├── models.py           # Request, StatusHistory, Comment
│   ├── permissions.py      # CanEditRequest, CanViewRequest, CanChangeStatus
│   ├── serializers.py      # Graphe de transitions et serialisation
│   ├── urls.py             # Routes /api/requests/ et /api/manager/requests/
│   └── views.py            # ModelViewSet et ListAPIView
├── config/                 # Parametrage du projet Django
│   ├── settings.py         # Configuration securisee, throttling, CORS, DB
│   ├── urls.py             # Routage central
│   └── wsgi.py             # Point d'entree WSGI de production
├── Dockerfile              # Build multi-stage durci et non-root (appuser:10001)
└── requirements.txt        # Dependances Python figees
```

---

## Sécurité & Bonnes Pratiques

- Rate-Limiting (Anti-Brute Force) : Throttling anonyme (60 req/min) et utilisateur authentifié (200 req/min).
- Zéro Secret en Dur : `SECRET_KEY`, `DATABASE_URL` et `CORS_ALLOWED_ORIGINS` sont injectés exclusivement via l'environnement.
- Fail-Secure : Si `DEBUG=False` et que `SECRET_KEY` est absente, l'application refuse de démarrer.
- Isolation Docker : Conteneur sans privilèges root et image de production sans compilateur C (`gcc`).
