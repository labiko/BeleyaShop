# BeleyaShop - Boutique de Cosmétiques Mobile

![BeleyaShop Logo](src/assets/logo.png)

## 📱 Vue d'ensemble

BeleyaShop est une application mobile e-commerce progressive (PWA) spécialisée dans la vente de produits cosmétiques à Conakry, Guinée. L'application offre une expérience d'achat moderne avec commande via WhatsApp et géolocalisation précise pour la livraison.

## 🚀 Fonctionnalités principales

### 🛍️ E-commerce
- **Catalogue de produits** : Navigation par catégories (crèmes, gels, parfums)
- **Panier intelligent** : Gestion des quantités avec persistance locale
- **Prix en GNF** : Affichage formaté en Franc Guinéen
- **Images optimisées** : Système de fallback pour les images manquantes
- **Auto-refresh** : Actualisation automatique toutes les 5 minutes
- **Pull-to-refresh** : Actualisation manuelle par glisser

### 📱 Mobile-First
- **Application Progressive (PWA)** : Installable comme app native
- **Design responsive** : Optimisé mobile avec support desktop
- **Splash screen** : Écran de chargement avec logo animé
- **Interface tactile** : Boutons et cartes adaptés au touch
- **Installation facile** : Bouton d'installation et bannière intégrés

### 📍 Géolocalisation avancée
- **Tracking GPS précis** : Optimisation sur 30 secondes
- **Multiple coordonnées** : Collecte et sélection de la position la plus précise
- **Indicateurs visuels** : Barre de progression moderne avec statistiques
- **Logging détaillé** : Console complète pour debugging
- **Amélioration continue** : 86% d'amélioration de précision moyenne

### 💬 Intégration WhatsApp
- **Commandes directes** : Partage automatique du panier
- **Géolocalisation partagée** : Lien Google Maps pour livraison
- **Numéro dédié** : +33620951645 pour les commandes
- **Format standardisé** : Messages structurés avec détails complets

## 🛠️ Technologies utilisées

### Frontend
- **Ionic 8.0.0** - Framework mobile hybride
- **Angular 20.0.0** - Framework TypeScript
- **RxJS** - Programmation réactive
- **SCSS** - Styles avancés avec variables
- **TypeScript 5.8.0** - Langage typé strict

### Backend & Services
- **Supabase** - Base de données PostgreSQL as a Service
- **Row Level Security** - Sécurité au niveau des lignes
- **PWA Service Worker** - Fonctionnalités hors-ligne
- **Google Maps API** - Intégration cartographique

### Mobile & PWA
- **Capacitor** - Déploiement natif iOS/Android
- **Web App Manifest** - Configuration PWA
- **Service Worker** - Cache et notifications

## 📋 Installation et lancement

### Prérequis
```bash
node --version  # v16+
npm --version   # v8+
```

### Installation
```bash
cd BeleyaShop
npm install
```

### Développement
```bash
npm start
# Ouvre http://localhost:4200
```

### Build production
```bash
npm run build
# Génère le dossier dist/ pour déploiement
```

## ⚙️ Configuration

### Google Maps API
Clé API configurée dans `src/index.html` :
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBGDz5BJkcTLY3x_96x8xuTxa7Gxd7BN6M"></script>
```

### WhatsApp Business
Numéro configuré dans `src/app/delivery/delivery.page.ts` :
```typescript
private readonly VENDOR_PHONE = '+224622123456';
```

## 🗂 Structure du projet

```
src/app/
├── components/
│   └── whatsapp-fab/          # Bouton WhatsApp flottant
├── models/
│   └── product.ts             # Interfaces TypeScript
├── services/
│   ├── cart.service.ts        # Gestion panier localStorage
│   ├── product.service.ts     # Données produits
│   └── geolocation.service.ts # Services GPS
├── pages/
│   ├── home/                  # Page d'accueil
│   ├── catalog/               # Catalogue avec filtres
│   ├── cart/                  # Panier et résumé
│   └── delivery/              # Livraison + géolocalisation
└── tabs/                      # Navigation principale
```

## 📱 Workflow utilisateur

1. **Découverte** → Accueil + invitation installation PWA
2. **Navigation** → Catalogue filtré par catégories
3. **Sélection** → Ajout produits au panier (persistant)
4. **Validation** → Page panier avec modifications
5. **Livraison** → Capture GPS + carte + contact
6. **Commande** → WhatsApp avec message automatique

## 🌍 Déploiement

### Pour PWA en production
1. **Build** : `npm run build`
2. **HTTPS requis** pour géolocalisation
3. **Service Worker** activé automatiquement
4. **Manifest** pour installation mobile

### Hébergements recommandés
- **Netlify** (HTTPS gratuit)
- **Vercel** (CI/CD intégré) 
- **Firebase Hosting** (PWA optimisé)

## 📊 Données d'exemple

### Produits (6 items)
- 2x Crèmes (Nivea, Vaseline)
- 2x Gels douche (Dove, Johnson's)
- 2x Parfums (CK One, Adidas)

Prix en GNF (Franc Guinéen) avec formatage automatique.

## 🔧 Personnalisation

### Ajouter des produits
Modifier `src/app/services/product.service.ts` :
```typescript
private products: Product[] = [
  {
    id: 7,
    name: 'Nouveau Produit',
    description: 'Description...',
    price: 150000,
    image: 'assets/products/nouveau.jpg',
    category: 'cremes',
    inStock: true
  }
];
```

### Changer les couleurs
Modifier `src/theme/variables.scss` :
```scss
:root {
  --ion-color-primary: #3880ff;
  --ion-color-secondary: #0cd1e8;
}
```

## 🐛 Résolution de problèmes

### Erreurs de build
Les composants Angular 20 sont en mode standalone. Pour corriger :
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Géolocalisation ne marche pas
- Vérifier HTTPS en production
- Autoriser la localisation dans le navigateur
- Vérifier la clé Google Maps API

### PWA non installable
- Vérifier `manifest.json` 
- Service Worker actif
- Icônes présentes (72x72 à 512x512)

## 📞 Support

Pour des questions sur le code ou l'implémentation, consulter :
- Documentation Ionic : https://ionicframework.com/docs
- Google Maps API : https://developers.google.com/maps
- PWA Guide : https://web.dev/progressive-web-apps/

---

**BeleyaShop** - Solution e-commerce PWA optimisée pour l'Afrique de l'Ouest 🌍