# =============================================================================
# Script Makefile pour simplifier les commandes Docker - UQO-Requests
# =============================================================================
# Ce Makefile fournit des raccourcis pour les commandes Docker courantes.
#
# Utilisation:
#   make help         - Afficher l'aide
#   make dev          - Démarrer en mode développement
#   make prod         - Démarrer en mode production
#   make stop         - Arrêter tous les conteneurs
#   make clean        - Nettoyer les conteneurs et volumes
#
# @author UQO
# @version 1.0.0
# =============================================================================

# Variables
COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
COMPOSE_PROD = docker-compose -f docker-compose.yml

# Couleurs pour l'affichage
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m

# =============================================================================
# AIDE
# =============================================================================
.PHONY: help
help:
	@echo "$(GREEN)UQO-Requests - Commandes Docker$(NC)"
	@echo ""
	@echo "$(YELLOW)Développement:$(NC)"
	@echo "  make dev          - Démarrer en mode développement (hot reload)"
	@echo "  make dev-build    - Reconstruire et démarrer en développement"
	@echo "  make dev-logs     - Voir les logs en développement"
	@echo ""
	@echo "$(YELLOW)Production:$(NC)"
	@echo "  make prod         - Démarrer en mode production"
	@echo "  make prod-build   - Reconstruire et démarrer en production"
	@echo "  make prod-logs    - Voir les logs en production"
	@echo ""
	@echo "$(YELLOW)Base de données:$(NC)"
	@echo "  make migrate      - Appliquer les migrations Django"
	@echo "  make makemigrations - Créer de nouvelles migrations"
	@echo "  make createsuperuser - Créer un super utilisateur"
	@echo "  make shell        - Ouvrir un shell Django"
	@echo ""
	@echo "$(YELLOW)Maintenance:$(NC)"
	@echo "  make stop         - Arrêter tous les conteneurs"
	@echo "  make clean        - Arrêter et supprimer les conteneurs/volumes"
	@echo "  make ps           - Voir l'état des conteneurs"

# =============================================================================
# DÉVELOPPEMENT
# =============================================================================
.PHONY: dev
dev:
	@echo "$(GREEN)Démarrage en mode développement...$(NC)"
	$(COMPOSE_DEV) up

.PHONY: dev-build
dev-build:
	@echo "$(GREEN)Reconstruction et démarrage en développement...$(NC)"
	$(COMPOSE_DEV) up --build

.PHONY: dev-logs
dev-logs:
	$(COMPOSE_DEV) logs -f

.PHONY: dev-down
dev-down:
	$(COMPOSE_DEV) down

# =============================================================================
# PRODUCTION
# =============================================================================
.PHONY: prod
prod:
	@echo "$(GREEN)Démarrage en mode production...$(NC)"
	$(COMPOSE_PROD) up -d

.PHONY: prod-build
prod-build:
	@echo "$(GREEN)Reconstruction et démarrage en production...$(NC)"
	$(COMPOSE_PROD) up --build -d

.PHONY: prod-logs
prod-logs:
	$(COMPOSE_PROD) logs -f

.PHONY: prod-down
prod-down:
	$(COMPOSE_PROD) down

# =============================================================================
# COMMANDES DJANGO
# =============================================================================
.PHONY: migrate
migrate:
	@echo "$(GREEN)Application des migrations...$(NC)"
	$(COMPOSE_DEV) exec backend python manage.py migrate

.PHONY: makemigrations
makemigrations:
	@echo "$(GREEN)Création des migrations...$(NC)"
	$(COMPOSE_DEV) exec backend python manage.py makemigrations

.PHONY: createsuperuser
createsuperuser:
	@echo "$(GREEN)Création d'un super utilisateur...$(NC)"
	$(COMPOSE_DEV) exec backend python manage.py createsuperuser

.PHONY: shell
shell:
	$(COMPOSE_DEV) exec backend python manage.py shell

.PHONY: bash
bash:
	$(COMPOSE_DEV) exec backend sh

# =============================================================================
# MAINTENANCE
# =============================================================================
.PHONY: stop
stop:
	@echo "$(YELLOW)Arrêt de tous les conteneurs...$(NC)"
	$(COMPOSE_DEV) down
	$(COMPOSE_PROD) down

.PHONY: clean
clean:
	@echo "$(YELLOW)Nettoyage complet (conteneurs + volumes)...$(NC)"
	$(COMPOSE_DEV) down -v --remove-orphans
	$(COMPOSE_PROD) down -v --remove-orphans

.PHONY: ps
ps:
	docker ps -a --filter "name=uqo"

.PHONY: prune
prune:
	@echo "$(YELLOW)Suppression des ressources Docker inutilisées...$(NC)"
	docker system prune -f
