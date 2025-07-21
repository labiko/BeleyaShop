# CLAUDE.md - Instructions pour l'assistant

## Instructions importantes

**❌ NE JAMAIS COMMITER LE PROJET SAUF DEMANDE EXPLICITE**
- Ne pas exécuter `git commit` sans demande explicite de l'utilisateur
- Ne pas pousser vers le repository sans permission
- Toujours demander confirmation avant toute opération Git

**✅ QUAND L'UTILISATEUR DEMANDE "COMMITE" OU "COMMIT":**
- TOUJOURS exécuter `git add -A` pour ajouter tous les fichiers
- TOUJOURS exécuter `git commit` avec un message descriptif complet
- TOUJOURS exécuter `git push origin dev` pour pousser vers le repository distant
- Ne JAMAIS oublier de pousser les commits vers GitHub après les avoir créés localement

## Configuration du projet

### Recherche d'images automatique
- Toutes les images doivent être cherchées automatiquement dans `C:\Users\diall\Documents\BELEYASHOP\`
- Format: quand l'utilisateur dit "image.png", chercher dans le dossier BELEYASHOP

### Structure du projet
- **Branche principale**: `master` (production)
- **Branche de développement**: `dev` (commits par défaut)
- **Repository**: https://github.com/labiko/BeleyaShop.git
- **URL de l'application**: https://beleya-shop.vercel.app/tabs/catalog

### Commandes de test
- Tests: Vérifier les commandes disponibles dans package.json
- Lint: `npm run lint` (si disponible)
- Build: `npm run build`

### Thème de l'application
- **Couleur principale**: #F5FF78 (lime yellow)
- **Couleur secondaire**: #000000 (noir)
- **Typographie**: Noir gras pour tous les textes
- **Exception**: Bouton WhatsApp garde ses couleurs originales

### Modales et Alertes
- **IMPORTANT**: Toutes les modales doivent avoir un fond blanc et du texte en noir gras
- Les styles globaux sont définis dans `src/global.scss` pour toutes les `ion-alert`
- Titre de la modale: `font-weight: 700` (noir gras)
- Message de la modale: `font-weight: 600` (noir semi-gras)
- Champs de saisie: `font-weight: 600` avec focus sur couleur principale
- Boutons: `font-weight: 700` (vert pour confirmer, gris pour annuler)

## Fonctionnalités clés

### Géolocalisation
- Recherche optimisée sur 30 secondes
- Collection de plusieurs positions GPS
- Sélection automatique de la position la plus précise
- Logging détaillé dans la console

### PWA (Progressive Web App)
- Installation possible sur mobile/desktop
- Splash screen avec logo
- Mode standalone
- Détection automatique d'installation

### E-commerce
- Catalogue de produits cosmétiques
- Panier de commandes
- Intégration WhatsApp pour les commandes
- Géolocalisation pour la livraison

## Notes de développement
- Utiliser Ionic Angular avec composants standalone
- Respecter les conventions de nommage existantes
- Maintenir la compatibilité mobile-first
- Tester sur différentes tailles d'écran