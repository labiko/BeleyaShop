# CLAUDE.md - Instructions pour l'assistant

## Instructions importantes

**❌ NE JAMAIS COMMITER LE PROJET SAUF DEMANDE EXPLICITE**
- Ne pas exécuter `git commit` sans demande explicite de l'utilisateur
- Ne pas pousser vers le repository sans permission
- Toujours demander confirmation avant toute opération Git

**✅ QUAND L'UTILISATEUR DEMANDE "COMMITE" OU "COMMIT":**
- **BRANCHE PAR DÉFAUT** : TOUJOURS commiter sur la branche `dev` sauf indication contraire
- **IMPORTANT** : TOUJOURS exécuter `npm run version:bump` AVANT le commit pour incrémenter la version
- TOUJOURS exécuter `git add -A` pour ajouter tous les fichiers (incluant les fichiers de version modifiés)
- TOUJOURS exécuter `git commit` avec un message descriptif complet
- TOUJOURS exécuter `git push origin dev` pour pousser vers le repository distant (branche dev par défaut)
- Ne JAMAIS faire de merge automatique vers master sans demande explicite
- Ne JAMAIS oublier de pousser les commits vers GitHub après les avoir créés localement

**🚫 POLITIQUE DE MERGE STRICTE:**
- Ne JAMAIS merger automatiquement dev vers master
- Attendre une demande explicite de merge avant de fusionner les branches
- Seul l'utilisateur décide quand merger vers master

**🔢 VERSIONING AUTOMATIQUE AVANT CHAQUE COMMIT:**
```bash
# OBLIGATOIRE avant chaque commit
npm run version:bump        # Incrémente automatiquement la version

# Puis procéder au commit normal
git add -A
git commit -m "Message de commit"
git push origin dev
```

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
- **Prix des produits**: OBLIGATOIREMENT en noir gras (#000000, font-weight: 700) pour lisibilité sur fond jaune
- **Navigation tabs**: OBLIGATOIREMENT texte et icônes en noir gras (#000000, font-weight: 700) sur fond jaune lime
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

### Intégration WhatsApp - IMPORTANT
- **TOUJOURS éviter les emojis** dans les messages WhatsApp pour éviter les problèmes d'encodage (caractères �)
- Utiliser du texte simple sans accents : "Numero de commande" au lieu de "📋 Numéro de commande"  
- Remplacer "📍" par "Ma localisation", "🤖" par "Envoye depuis", etc.
- Les emojis causent des problèmes d'encodage URL avec `encodeURIComponent()`

## Système de versioning automatique

### Configuration
- **Version actuelle**: 0.0.2 (auto-incrémentée à chaque commit)
- **Script de versioning**: `scripts/version-bump.js`
- **Service de version**: `src/app/services/version.service.ts`
- **Affichage**: Version visible dans l'interface admin (header) et page d'accueil (badge)

### Commandes disponibles
```bash
npm run version:bump      # Incrémente la version patch (ex: 1.0.0 -> 1.0.1)
npm run version:patch     # Même chose que version:bump
npm run version:minor     # Incrémente la version minor (ex: 1.0.0 -> 1.1.0)
npm run version:major     # Incrémente la version major (ex: 1.0.0 -> 2.0.0)
npm run build            # Build avec auto-increment de version
npm run build:prod       # Build production avec auto-increment
```

### Fonctionnement
- ⚠️ **OBLIGATOIRE** : Exécuter `npm run version:bump` avant chaque commit
- À chaque commit, la version est automatiquement incrémentée (patch: 0.0.1 → 0.0.2)
- **Affichage de la version** :
  - Interface admin (header) : `v0.0.2`
  - Page d'accueil (badge) : `v0.0.2` sous le texte principal
  - Console navigateur (catalog) : logs de développement
- Les informations de build sont sauvées dans `src/assets/version.json`
- Le service `VersionService` gère l'affichage des informations de version

### Intégration continue
- Vercel exécute automatiquement `npm run build` qui incrémente la version
- Les variables d'environnement Vercel sont utilisées pour tracer les commits
- La date de build est automatiquement mise à jour

## Nouvelles fonctionnalités ajoutées

### Système de détection de mise à jour PWA
- **Service de mise à jour**: `UpdateDetectionService` pour la détection automatique des nouvelles versions
- **Vérification périodique**: Contrôle toutes les 5 minutes de nouvelles versions déployées sur Vercel
- **Notifications utilisateur**: Modales stylées avec informations de version et bouton de mise à jour
- **Nettoyage automatique**: Suppression des Service Workers et vidage du cache navigateur
- **Indicateur visuel**: Composant flottant `UpdateIndicatorComponent` pour signaler les mises à jour
- **Interface admin**: Bouton de vérification manuelle dans l'interface d'administration
- **Documentation**: Guide complet dans `docs/update-system.md`
- **Styles cohérents**: Modales avec thème BeleyaShop (#F5FF78, animations)

### Optimisation des images
- **Service de redimensionnement**: `ImageResizeService`
- Redimensionnement automatique lors de l'upload de produits
- Préservation de la qualité avec compression intelligente
- Presets prédéfinis (PRODUCT_IMAGE: 800x600, THUMBNAIL: 150x150, etc.)
- Affichage du taux de compression dans l'interface admin

### Interface d'administration des catégories
- **Page Categories**: `/admin/categories`
- Gestion CRUD complète (Créer, Lire, Modifier, Supprimer)
- Interface responsive avec cartes visuelles
- Catégories par défaut pré-configurées
- Icônes Ionicons pour chaque catégorie
- Recherche et filtrage des catégories

### Améliorations de l'affichage
- Images en mode `object-fit: contain` au lieu de `cover`
- Padding ajouté pour éviter le zoom excessif
- Toast messages pour toutes les actions du panier (y compris réduction de quantité)
- Messages différenciés selon le type d'action (augmentation/réduction/suppression)

## Notes de développement
- Utiliser Ionic Angular avec composants standalone
- Respecter les conventions de nommage existantes
- Maintenir la compatibilité mobile-first
- Tester sur différentes tailles d'écran
- Toujours redimensionner les images avant upload pour optimiser les performances
- Utiliser le service VersionService pour afficher les informations de version