# UQO-Requests — Frontend SPA (React + Vite)

Interface utilisateur pour les étudiants et gestionnaires de l'UQO.

---

## Stack Technique

- Framework : React 18.2
- Build Tool : Vite 5.0
- Routage : React Router DOM 6.20
- Client HTTP : Axios avec intercepteurs JWT
- Serveur de Production : Nginx Alpine avec compression Gzip et en-têtes HTTP de sécurité

---

## Structure du Code Source

```
frontend/
├── public/                 # Assets statiques publics
├── src/
│   ├── api/
│   │   └── client.js       # Instance Axios, intercepteurs JWT et catalogue d'API
│   ├── components/
│   │   ├── Navbar.jsx      # Navigation adaptative (visiteur, etudiant, gestionnaire)
│   │   ├── ProtectedRoute.jsx # Garde de routage RBAC
│   │   ├── RequestCard.jsx # Carte de demande
│   │   └── StatusBadge.jsx # Badge de statut dynamique
│   ├── context/
│   │   ├── AuthContext.jsx # Gestion de session et cycle d'authentification
│   │   └── ThemeContext.jsx# Gestion du theme clair / sombre
│   ├── hooks/
│   │   └── useRequests.js  # Hook de gestion d'etat et statistiques des demandes
│   ├── pages/
│   │   ├── Home.jsx        # Page d'accueil
│   │   ├── Login.jsx       # Connexion
│   │   ├── Register.jsx    # Inscription
│   │   ├── Dashboard.jsx   # Tableau de bord etudiant
│   │   ├── CreateRequest.jsx # Creation de requete
│   │   ├── EditRequest.jsx # Modification de requete (statut SUBMITTED)
│   │   ├── RequestDetail.jsx # Consultation detaillee, historique et commentaires
│   │   └── ManagerDashboard.jsx # Supervision globale et transitions d'etats
│   ├── App.jsx             # Routage applicatif et lazy-loading
│   ├── main.jsx            # Point de montage DOM
│   └── index.css           # Tokens de design, variables CSS et styles globaux
├── Dockerfile              # Build multi-stage reproductible (npm ci + Nginx)
├── Dockerfile.dev          # Image de developpement avec Vite HMR
├── nginx.conf              # Reverse proxy et en-tetes HTTP securises
└── package.json            # Dependances NPM auditees
```

---

## Commandes de Développement

```bash
# Installation des dependances
npm ci

# Lancement du serveur de developpement (Hot Reload)
npm run dev

# Compilation de production
npm run build

# Previsualisation du bundle de production
npm run preview
```
