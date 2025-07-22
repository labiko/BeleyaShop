# 🏗️ Architecture BeleyaShop

## Vue d'ensemble architectural

BeleyaShop suit une architecture moderne de type **Single Page Application (SPA)** avec des composants autonomes et une approche **Mobile-First Progressive Web App**.

```
┌─────────────────────────────────────────────────┐
│                  PWA Layer                      │
│  Service Worker │ Manifest │ Cache Strategy     │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                Presentation Layer               │
│    Components │ Pages │ Directives │ Pipes     │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                 Business Layer                  │
│   Services │ State Management │ Validators      │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                   Data Layer                    │
│  Supabase │ localStorage │ External APIs        │
└─────────────────────────────────────────────────┘
```

## 🎯 Principes architecturaux

### 1. **Separation of Concerns**
- **Composants** : Interface utilisateur uniquement
- **Services** : Logique métier et état
- **Models** : Définitions de types TypeScript
- **Utils** : Fonctions utilitaires pures

### 2. **Reactive Programming**
- **RxJS** : Flux de données réactifs
- **BehaviorSubject** : État partagé entre composants
- **Observables** : Communication asynchrone

### 3. **Mobile-First Design**
- **Ionic Components** : Interface native mobile
- **Touch-friendly** : Interactions tactiles optimisées
- **Responsive Design** : Adaptation automatique aux écrans

### 4. **Progressive Enhancement**
- **Core functionality** : Fonctionne sans PWA
- **Enhanced experience** : Ajouts progressifs (installation, offline)
- **Graceful degradation** : Fallbacks pour fonctionnalités avancées

## 📱 Couche présentation

### Structure des composants

```
app/
├── components/          # Composants réutilisables
│   ├── pwa-install/    # Installation PWA
│   └── whatsapp-fab/   # Bouton WhatsApp flottant
├── pages/              # Pages principales
│   ├── home/          # Accueil
│   ├── catalog/       # Catalogue produits  
│   ├── cart/          # Panier
│   ├── delivery/      # Processus de livraison
│   └── tabs/          # Navigation tabs
└── directives/         # Directives personnalisées
    └── image-fallback/ # Gestion des images cassées
```

### Pattern de composants autonomes

```typescript
@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,  // Composant autonome Angular 17+
  imports: [
    CommonModule,
    FormsModule, 
    IonicModule,
    WhatsappFabComponent,
    ImageFallbackDirective
  ]
})
export class CatalogPage {
  // Logique du composant
}
```

### Communication entre composants

```typescript
// Parent vers enfant : @Input()
@Input() product: Product;

// Enfant vers parent : @Output()
@Output() addToCart = new EventEmitter<Product>();

// Communication via service
constructor(private cartService: CartService) {}
```

## 🔧 Couche métier (Services)

### Architecture des services

```
services/
├── cart.service.ts         # Gestion panier (localStorage)
├── product.service.ts      # Gestion produits (Supabase)
├── geolocation.service.ts  # GPS et géolocalisation
├── pwa.service.ts          # Installation PWA
├── supabase.service.ts     # Client base de données
└── image-fallback.service.ts # Gestion images
```

### Pattern Service avec état réactif

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  // État privé
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  
  // État public observable
  public cart$ = this.cartSubject.asObservable();
  
  // Méthodes de mutation
  addToCart(product: Product): void {
    const current = this.cartSubject.value;
    // Logique de mise à jour
    this.cartSubject.next(updated);
  }
  
  // Getters dérivés
  getCartTotal(): number {
    return this.cartSubject.value.reduce(/* ... */);
  }
}
```

### Injection de dépendances

```typescript
// Injection au niveau racine
@Injectable({ providedIn: 'root' })
export class GlobalService { }

// Injection au niveau composant
@Injectable()
export class ComponentScopedService { }

// Utilisation dans composant
constructor(
  private cartService: CartService,
  private productService: ProductService,
  private geolocationService: GeolocationService
) {}
```

## 💾 Couche données

### Sources de données multiples

```typescript
interface DataSources {
  // Base de données distante
  supabase: SupabaseClient;
  
  // Stockage local
  localStorage: Storage;
  
  // APIs externes
  googleMaps: GoogleMapsAPI;
  whatsapp: WhatsAppAPI;
  
  // Capteurs device
  geolocation: GeolocationAPI;
}
```

### Stratégie de cache

```typescript
class CacheStrategy {
  // Cache en mémoire (session)
  private memoryCache = new Map<string, any>();
  
  // Cache persistant (localStorage)
  private persistentCache = {
    set: (key: string, value: any) => 
      localStorage.setItem(key, JSON.stringify(value)),
    get: (key: string) => 
      JSON.parse(localStorage.getItem(key) || 'null')
  };
  
  // Stratégie Cache-First
  async getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // 1. Vérifier cache mémoire
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // 2. Vérifier cache persistant
    const cached = this.persistentCache.get(key);
    if (cached && !this.isExpired(cached)) {
      this.memoryCache.set(key, cached.data);
      return cached.data;
    }
    
    // 3. Fetcher depuis la source
    const fresh = await fetcher();
    this.cacheData(key, fresh);
    return fresh;
  }
}
```

### Synchronisation de données

```typescript
class DataSyncManager {
  // Synchronisation optimiste
  async optimisticUpdate<T>(
    localUpdate: () => void,
    remoteUpdate: () => Promise<T>
  ): Promise<T> {
    // 1. Mise à jour locale immédiate
    localUpdate();
    
    try {
      // 2. Synchronisation distante
      const result = await remoteUpdate();
      return result;
    } catch (error) {
      // 3. Rollback en cas d'erreur
      this.rollback();
      throw error;
    }
  }
  
  // Synchronisation périodique
  startPeriodicSync(interval: number = 5 * 60 * 1000) {
    setInterval(() => {
      this.syncWithRemote();
    }, interval);
  }
}
```

## 🌐 Couche PWA

### Service Worker stratégie

```typescript
// sw.js - Service Worker
const CACHE_NAME = 'beleyashop-v1';
const STATIC_ASSETS = [
  '/',
  '/assets/logo.png',
  '/assets/icons/',
  '/static/css/',
  '/static/js/'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Stratégie Cache First pour assets statiques
self.addEventListener('fetch', event => {
  if (isStaticAsset(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

### Manifest de l'application

```json
{
  "name": "BeleyaShop - Cosmétiques à Conakry",
  "short_name": "BeleyaShop",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#F5FF78",
  "background_color": "#F5FF78",
  "icons": [
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

## 📊 Gestion d'état

### Flux de données unidirectionnel

```
Action ──→ Service ──→ State Update ──→ UI Render
  ↑                                        │
  └──────────── User Interaction ←─────────┘
```

### State Management Pattern

```typescript
// État centralisé par domaine
interface AppState {
  cart: CartState;
  products: ProductState;
  location: LocationState;
  ui: UIState;
}

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

// Mutations immutables
class StateManager {
  updateState<T>(
    currentState: T, 
    updater: (state: T) => Partial<T>
  ): T {
    return { ...currentState, ...updater(currentState) };
  }
}
```

### Reactive State Updates

```typescript
// Sélecteurs réactifs
const cartTotal$ = cartService.cart$.pipe(
  map(items => items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
  distinctUntilChanged()
);

const cartItemCount$ = cartService.cart$.pipe(
  map(items => items.reduce((count, item) => count + item.quantity, 0)),
  distinctUntilChanged()
);

// Combinaison d'états
const cartSummary$ = combineLatest([
  cartService.cart$,
  cartTotal$,
  cartItemCount$
]).pipe(
  map(([items, total, count]) => ({ items, total, count }))
);
```

## 🔄 Patterns de communication

### Event Bus pour communication découplée

```typescript
@Injectable({ providedIn: 'root' })
export class EventBusService {
  private eventSubject = new Subject<AppEvent>();
  public events$ = this.eventSubject.asObservable();
  
  emit(event: AppEvent): void {
    this.eventSubject.next(event);
  }
  
  on<T extends AppEvent>(
    eventType: string
  ): Observable<T> {
    return this.events$.pipe(
      filter(event => event.type === eventType),
      map(event => event as T)
    );
  }
}

// Utilisation
eventBus.emit({ type: 'CART_UPDATED', payload: cartItems });
eventBus.on<CartUpdatedEvent>('CART_UPDATED').subscribe(/* ... */);
```

### Observer Pattern pour géolocalisation

```typescript
class GeolocationObserver {
  private observers: ((position: Position) => void)[] = [];
  
  subscribe(observer: (position: Position) => void): () => void {
    this.observers.push(observer);
    
    // Retourne une fonction de désabonnement
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }
  
  notify(position: Position): void {
    this.observers.forEach(observer => observer(position));
  }
}
```

## 🎨 Theming et Design System

### CSS Custom Properties

```scss
:root {
  // Couleurs primaires
  --beley-primary: #F5FF78;
  --beley-secondary: #000000;
  
  // Espacements
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  // Typographie
  --font-weight-normal: 400;
  --font-weight-bold: 700;
  
  // Animations
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
}
```

### Component Styling Strategy

```scss
// BEM Methodology
.catalog-page {
  &__header {
    // Styles pour l'en-tête
  }
  
  &__filters {
    // Styles pour les filtres
    
    &--active {
      // Modificateur pour filtre actif
    }
  }
  
  &__product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-md);
  }
}

// Responsive Mixins
@mixin mobile-only {
  @media (max-width: 767px) {
    @content;
  }
}

@mixin desktop-only {
  @media (min-width: 768px) {
    @content;
  }
}
```

## 🔒 Sécurité et Performance

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  style-src 'self' 'unsafe-inline';
  script-src 'self' https://maps.googleapis.com;
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co;
">
```

### Lazy Loading et Code Splitting

```typescript
// Route-based code splitting
const routes: Routes = [
  {
    path: 'catalog',
    loadComponent: () => import('./catalog/catalog.page').then(m => m.CatalogPage)
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.page').then(m => m.CartPage)
  }
];

// Feature-based lazy loading
async loadAdvancedFeatures() {
  const { AdvancedAnalytics } = await import('./features/analytics');
  return new AdvancedAnalytics();
}
```

### Performance Monitoring

```typescript
class PerformanceService {
  // Core Web Vitals
  measureCLS(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          console.log('CLS score:', entry.value);
        }
      }
    }).observe({type: 'layout-shift', buffered: true});
  }
  
  measureLCP(): void {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({type: 'largest-contentful-paint', buffered: true});
  }
}
```

## 📱 Déploiement et Build

### Build Pipeline

```typescript
// angular.json - Configuration de build
{
  "build": {
    "configurations": {
      "production": {
        "budgets": [
          {
            "type": "initial",
            "maximumWarning": "2mb",
            "maximumError": "5mb"
          }
        ],
        "optimization": true,
        "outputHashing": "all",
        "sourceMap": false,
        "namedChunks": false,
        "aot": true,
        "extractLicenses": true,
        "vendorChunk": false,
        "buildOptimizer": true
      }
    }
  }
}
```

### Capacitor Native Build

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beleyashop.app',
  appName: 'BeleyaShop',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Geolocation: {
      permissions: ['coarse', 'fine']
    },
    LocalStorage: {
      group: 'BeleyaShopData'
    }
  }
};
```

---

**Architecture maintenue par l'équipe BeleyaShop**  
_Version : 2.0.0 - Architecture Angular 20 + Ionic 8_