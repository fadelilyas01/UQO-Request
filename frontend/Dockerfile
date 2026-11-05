# =============================================================================
# Dockerfile Multi-stage pour le frontend React - UQO-Requests
# Compilation Vite reproductible et service Nginx optimise
# =============================================================================

# -----------------------------------------------------------------------------
# Etape 1: Compilation de l'application (Node.js)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copie des fichiers de dependances verrouillees pour reproductibilite exacte
COPY package.json package-lock.json ./

RUN npm ci

# Copie des sources du frontend
COPY . .

# Argument pour cibler l'URL API (valeur par defaut proxyfiee)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Generation des fichiers statiques optimises dans dist/
RUN npm run build

# -----------------------------------------------------------------------------
# Etape 2: Serveur de diffusion Nginx (Production)
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Configuration personnalisee Nginx (proxy API, compression gzip, headers de securite)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fichiers statiques generes par Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Sonde de sante
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
