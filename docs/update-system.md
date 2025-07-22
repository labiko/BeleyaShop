# Système de Détection de Mise à Jour PWA

## 📋 Vue d'ensemble

Le système de détection de mise à jour permet à l'application PWA BeleyaShop de détecter automatiquement les nouvelles versions déployées sur Vercel et de proposer aux utilisateurs de mettre à jour leur application sans avoir à vider manuellement le cache du navigateur.

## 🔧 Architecture

### Services

#### `UpdateDetectionService`
- **Localisation**: `src/app/services/update-detection.service.ts`
- **Responsabilités**:
  - Vérification périodique des mises à jour (toutes les 5 minutes)
  - Comparaison des versions entre locale et distante
  - Affichage des notifications de mise à jour
  - Nettoyage du cache et rechargement de l'application

#### `VersionService` (existant)
- **Localisation**: `src/app/services/version.service.ts`
- **Responsabilités**:
  - Gestion des informations de version
  - Lecture du fichier `version.json`

### Composants

#### `UpdateIndicatorComponent`
- **Localisation**: `src/app/components/update-indicator/update-indicator.component.ts`
- **Responsabilités**:
  - Affichage visuel des mises à jour disponibles
  - Indicateur flottant en haut à droite de l'écran
  - Animation pour attirer l'attention

## 🚀 Fonctionnement

### 1. Détection Automatique
- Vérification toutes les 5 minutes de la version distante
- Comparaison avec la version locale stockée
- Déclenchement de notification si nouvelle version détectée

### 2. Notification Utilisateur
- Modal stylée avec informations de version
- Boutons "Plus tard" et "Mettre à jour"
- Possibilité de reporter la mise à jour (30 minutes)

### 3. Application de la Mise à Jour
- Suppression des Service Workers
- Vidage de tous les caches navigateur
- Rechargement complet de l'application
- Modal de chargement pendant le processus

### 4. Vérification Manuelle
- Bouton dans l'interface admin (icône cloud-download)
- Méthode `manualCheckForUpdates()` dans le service
- Toast de confirmation si aucune mise à jour disponible

## 📁 Fichiers Impliqués

```
src/
├── app/
│   ├── services/
│   │   └── update-detection.service.ts     # Service principal
│   ├── components/
│   │   └── update-indicator/
│   │       ├── update-indicator.component.ts
│   │       └── update-indicator.component.scss
│   ├── admin/admin-tabs/
│   │   ├── admin-tabs.page.ts              # Bouton manuel admin
│   │   └── admin-tabs.page.html
│   ├── app.component.ts                    # Injection service
│   ├── app.component.html                  # Composant indicateur
│   └── app.module.ts                       # Import composant
├── assets/
│   └── version.json                        # Fichier de version
└── global.scss                             # Styles modales
```

## 🎨 Styles CSS

### Classes CSS Principales
- `.update-notification-modal`: Modal de notification principale
- `.update-loading-modal`: Modal de chargement
- `.update-indicator`: Indicateur flottant
- `.update-chip`: Puce d'indication de mise à jour

### Thème Cohérent
- Couleurs BeleyaShop (#F5FF78, #10b981)
- Animations fluides et modernes
- Design responsive mobile/desktop

## 🔄 Workflow de Déploiement

### 1. Développement
```bash
# Modification du code
npm run version:bump  # Incrémente automatiquement la version
git add -A
git commit -m "..."
git push origin dev
```

### 2. Déploiement Vercel
- Vercel détecte les commits sur `dev`
- Build automatique avec `npm run build`
- Version automatiquement incrémentée
- Nouveau `version.json` généré

### 3. Détection Client
- Service détecte la nouvelle version
- Notification automatique à l'utilisateur
- Mise à jour en un clic

## 🧪 Testing

### Test Manuel
1. Déployer une nouvelle version
2. Ouvrir l'application (version précédente)
3. Attendre max 5 minutes ou cliquer sur le bouton admin
4. Vérifier que la notification apparaît
5. Tester la mise à jour

### Test en Développement
```typescript
// Dans la console navigateur
updateService.forceCheckForUpdates();
```

## 🛠️ Configuration

### Paramètres Ajustables
```typescript
// Dans update-detection.service.ts
private startPeriodicCheck(): void {
  // Modifier l'intervalle (actuellement 5 minutes)
  interval(5 * 60 * 1000)
}

// Délai avant nouvelle notification
setTimeout(() => this.showUpdateNotification(newVersion), 30 * 60 * 1000);
```

### Désactivation
Pour désactiver temporairement le service:
```typescript
// Dans app.component.ts - commenter la ligne
// private updateDetectionService = inject(UpdateDetectionService);
```

## 🐛 Dépannage

### Problèmes Courants

#### 1. Service Worker non supprimé
- Vérifier la console pour les erreurs de suppression
- S'assurer que `navigator.serviceWorker` est disponible

#### 2. Cache non vidé
- Vérifier l'API `caches` dans le navigateur
- Tester avec DevTools > Application > Storage > Clear storage

#### 3. Version non détectée
- Vérifier que `version.json` est accessible via `/assets/version.json`
- Contrôler les en-têtes de cache dans la réponse serveur

### Logs de Debug
Le service affiche des logs détaillés dans la console:
- `🔧 Version actuelle chargée`
- `🔍 Vérification des versions`
- `🎉 Nouvelle version détectée`
- `✅ Application à jour`

## 📈 Améliorations Futures

### Fonctionnalités Possibles
1. **Historique des mises à jour**: Journal des versions installées
2. **Mises à jour critiques**: Forcer la mise à jour pour les correctifs de sécurité
3. **Notifications push**: Alertes même quand l'app est fermée
4. **Rollback**: Possibilité de revenir à la version précédente
5. **Téléchargement en arrière-plan**: Pré-télécharger les mises à jour

### Métriques
- Taux d'adoption des mises à jour
- Temps moyen de détection
- Erreurs de mise à jour

## 🔒 Sécurité

### Considérations
- Validation de l'intégrité des fichiers de version
- Protection contre les attaques de downgrade
- Vérification de l'origine des mises à jour

### Bonnes Pratiques
- Toujours vérifier la signature des versions
- Utiliser HTTPS pour toutes les requêtes
- Logger les tentatives de mise à jour suspectes