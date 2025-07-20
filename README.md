# BeleyaShop - PWA E-commerce 

Une application web progressive (PWA) pour la vente de produits cosmétiques à Conakry, Guinée.

## 🚀 Fonctionnalités

### ✅ Fonctionnalités implémentées
- **📱 PWA complète** - Installable sur mobile comme une app native
- **🛍️ Catalogue produits** - Navigation par catégories (crèmes, gels, parfums)
- **🛒 Panier intelligent** - Persistance localStorage, gestion quantités
- **💬 Commande WhatsApp** - Intégration directe avec message pré-rempli
- **📍 Géolocalisation hybride** - GPS + Google Maps + point de repère
- **🎨 Design mobile-first** - Interface optimisée smartphone
- **🔄 Temps réel** - Compteurs et notifications en direct

### 🛠 Technologies utilisées
- **Frontend :** Ionic 8 + Angular 20
- **Maps :** Google Maps API
- **Storage :** localStorage
- **Communication :** WhatsApp Web API
- **PWA :** Service Worker + Web Manifest

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