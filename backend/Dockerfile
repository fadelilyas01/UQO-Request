# =============================================================================
# Dockerfile Multi-stage pour le backend Django - UQO-Requests
# Conforme aux standards DevSecOps (Non-root, image minimale, zero compilateur en prod)
# =============================================================================

# -----------------------------------------------------------------------------
# Etape 1: Construction des dependances (Builder)
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Outils de compilation temporaires
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt && \
    pip install --no-cache-dir --prefix=/install gunicorn

# -----------------------------------------------------------------------------
# Etape 2: Image finale d'execution (Runtime durci & minimal)
# -----------------------------------------------------------------------------
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Librairie runtime PostgreSQL uniquement (sans gcc ni headers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Recuperation des paquets Python compiles depuis le builder
COPY --from=builder /install /usr/local

# Creation d'un utilisateur non-privilegie (securite conteneur)
RUN groupadd -g 10001 appuser && \
    useradd -u 10001 -g appuser -s /bin/sh -m appuser

# Copie du code source et attribution des droits
COPY . .

RUN mkdir -p /app/staticfiles && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Verification de bon fonctionnement
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/api/ || exit 1

# Demarrage avec migrations automatiques et serveur WSGI Gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60"]
