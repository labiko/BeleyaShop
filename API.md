# 📚 Documentation API - BeleyaShop

## Vue d'ensemble

BeleyaShop utilise une architecture de services modulaire avec Supabase comme backend principal et plusieurs APIs externes pour fonctionner de manière optimale.

## 🗄️ Base de données Supabase

### Configuration
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseKey: 'YOUR_ANON_KEY'
};
```

### Schema de la base de données

#### Table `products`
```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  image TEXT,
  category TEXT NOT NULL CHECK (category IN ('cremes', 'gels', 'parfums')),
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_in_stock ON products(in_stock);
```

#### Row Level Security (RLS)
```sql
-- Activer RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Allow public read access" ON products
  FOR SELECT USING (true);

-- Politique d'écriture publique (pour demo)
CREATE POLICY "Allow public write access" ON products
  FOR ALL USING (true);
```

## 🛍️ Services Frontend

### 1. ProductService

**Fichier** : `src/app/services/product.service.ts`

#### Méthodes principales

##### getAllProducts()
```typescript
getAllProducts(): Observable<Product[]> {
  return from(
    this.supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
  ).pipe(
    map(({ data, error }) => {
      if (error) throw error;
      return data || [];
    }),
    catchError(this.handleError)
  );
}
```

##### getProductsByCategory()
```typescript
getProductsByCategory(category: string): Observable<Product[]> {
  return from(
    this.supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('in_stock', true)
      .order('name')
  ).pipe(
    map(({ data, error }) => {
      if (error) throw error;
      return data || [];
    })
  );
}
```

##### addProduct()
```typescript
async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const { data, error } = await this.supabase
    .from('products')
    .insert(product)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

#### Gestion d'erreurs
```typescript
private handleError = (error: any): Observable<never> => {
  console.error('ProductService Error:', error);
  return throwError(() => new Error(error.message || 'Une erreur est survenue'));
};
```

### 2. CartService

**Fichier** : `src/app/services/cart.service.ts`

#### État réactif
```typescript
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();
  
  private readonly CART_STORAGE_KEY = 'beleyashop_cart';
}
```

#### Méthodes principales

##### addToCart()
```typescript
addToCart(product: Product): void {
  const currentCart = this.cartSubject.value;
  const existingItem = currentCart.find(item => item.product.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    currentCart.push({ product, quantity: 1 });
  }
  
  this.updateCart(currentCart);
}
```

##### updateQuantity()
```typescript
updateQuantity(productId: number, quantity: number): void {
  const currentCart = this.cartSubject.value;
  
  if (quantity <= 0) {
    const filteredCart = currentCart.filter(item => item.product.id !== productId);
    this.updateCart(filteredCart);
  } else {
    const item = currentCart.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
      this.updateCart(currentCart);
    }
  }
}
```

##### getCartTotal()
```typescript
getCartTotal(): number {
  return this.cartSubject.value.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
}
```

#### Persistance localStorage
```typescript
private saveToStorage(cart: CartItem[]): void {
  try {
    localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du panier:', error);
  }
}

private loadFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(this.CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erreur lors du chargement du panier:', error);
    return [];
  }
}
```

### 3. GeolocationService

**Fichier** : `src/app/services/geolocation.service.ts`

#### Interface Position
```typescript
interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}
```

#### Méthodes principales

##### getCurrentPosition()
```typescript
getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options
      }
    );
  });
}
```

##### watchPosition()
```typescript
watchPosition(
  successCallback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): number {
  return navigator.geolocation.watchPosition(
    successCallback,
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      ...options
    }
  );
}
```

##### calculateDistance()
```typescript
calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Formule de Haversine
  const R = 6371; // Rayon de la Terre en km
  const dLat = this.toRad(lat2 - lat1);
  const dLon = this.toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance en mètres
}
```

### 4. PWAService

**Fichier** : `src/app/services/pwa.service.ts`

#### Détection d'installation
```typescript
export class PwaService {
  private promptEvent: any = null;
  private isInstallableSubject = new BehaviorSubject<boolean>(false);
  
  constructor() {
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.promptEvent = event;
      this.isInstallableSubject.next(true);
    });
  }
}
```

#### Installation PWA
```typescript
async installPwa(): Promise<boolean> {
  if (!this.promptEvent) return false;
  
  try {
    this.promptEvent.prompt();
    const result = await this.promptEvent.userChoice;
    
    if (result.outcome === 'accepted') {
      this.promptEvent = null;
      this.isInstallableSubject.next(false);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur installation PWA:', error);
    return false;
  }
}
```

## 🌐 APIs externes

### 1. Google Maps API

#### Configuration
```html
<!-- src/index.html -->
<script async defer 
  src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBGDz5BJkcTLY3x_96x8xuTxa7Gxd7BN6M">
</script>
```

#### Initialisation dynamique
```typescript
private loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Erreur chargement Google Maps'));
    
    document.head.appendChild(script);
  });
}
```

### 2. WhatsApp Business API

#### Format des messages
```typescript
interface WhatsAppMessage {
  products: CartItem[];
  total: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  customerInfo?: string;
}
```

#### Génération du lien
```typescript
private generateWhatsAppUrl(message: WhatsAppMessage): string {
  let text = `Bonjour, je veux commander :\n\n`;
  
  // Produits
  message.products.forEach(item => {
    text += `- ${item.product.name} (x${item.quantity}) - ${this.formatPrice(item.product.price * item.quantity)}\n`;
  });
  
  text += `\nTotal : ${this.formatPrice(message.total)}\n\n`;
  
  // Géolocalisation
  if (message.location) {
    const { latitude, longitude, accuracy } = message.location;
    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    text += `📍 Ma localisation : ${mapsUrl}\n`;
    text += `Précision : ${Math.round(accuracy)}m\n\n`;
  }
  
  text += `🤖 Commande envoyée via BeleyaShop`;
  
  const phoneNumber = '33620951645';
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
}
```

## 🔄 Gestion d'état

### RxJS Patterns

#### Service pattern
```typescript
@Injectable({ providedIn: 'root' })
export class StateService {
  private state$ = new BehaviorSubject(initialState);
  
  select<T>(selector: (state: State) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }
  
  update(updater: (state: State) => State): void {
    this.state$.next(updater(this.state$.value));
  }
}
```

#### Component subscription
```typescript
export class CatalogPage implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  
  ngOnInit() {
    this.subscriptions.add(
      this.cartService.cart$.subscribe(cart => {
        this.cartItems = cart;
        this.cartTotal = this.cartService.getCartTotal();
      })
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
```

## 🛡️ Sécurité

### Validation côté client
```typescript
interface ProductValidator {
  validateProduct(product: Product): ValidationResult;
  validatePrice(price: number): boolean;
  validateCategory(category: string): boolean;
}

class ProductValidatorImpl implements ProductValidator {
  validateProduct(product: Product): ValidationResult {
    const errors: string[] = [];
    
    if (!product.name || product.name.trim().length === 0) {
      errors.push('Le nom est requis');
    }
    
    if (!this.validatePrice(product.price)) {
      errors.push('Prix invalide');
    }
    
    if (!this.validateCategory(product.category)) {
      errors.push('Catégorie invalide');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### Sanitisation des données
```typescript
private sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Supprime les balises HTML basiques
    .trim()
    .substring(0, 1000); // Limite la longueur
}
```

## 📊 Monitoring et Analytics

### Logging structuré
```typescript
interface LogEvent {
  type: 'user_action' | 'api_call' | 'error' | 'performance';
  timestamp: number;
  data: any;
  userId?: string;
}

class Logger {
  static log(event: LogEvent): void {
    console.group(`📊 ${event.type.toUpperCase()} - ${new Date(event.timestamp).toLocaleTimeString()}`);
    console.log('Data:', event.data);
    if (event.userId) console.log('User:', event.userId);
    console.groupEnd();
  }
}
```

### Métriques de performance
```typescript
class PerformanceTracker {
  static trackApiCall(endpoint: string, duration: number): void {
    Logger.log({
      type: 'performance',
      timestamp: Date.now(),
      data: { endpoint, duration }
    });
  }
  
  static trackUserAction(action: string, metadata?: any): void {
    Logger.log({
      type: 'user_action',
      timestamp: Date.now(),
      data: { action, ...metadata }
    });
  }
}
```

## 🔧 Configuration avancée

### Environment management
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  supabaseUrl: process.env['SUPABASE_URL'],
  supabaseKey: process.env['SUPABASE_ANON_KEY'],
  googleMapsApiKey: process.env['GOOGLE_MAPS_KEY'],
  whatsappNumber: '+33620951645',
  minOrderAmount: 100000, // 100,000 GNF
  deliveryTimeout: 30000,  // 30 seconds for geolocation
  cacheDuration: 300000,   // 5 minutes cache
};
```

### Feature flags
```typescript
interface FeatureFlags {
  enablePWAInstall: boolean;
  enableGeolocation: boolean;
  enablePullToRefresh: boolean;
  enableAutoRefresh: boolean;
  debugMode: boolean;
}

const featureFlags: FeatureFlags = {
  enablePWAInstall: true,
  enableGeolocation: true,
  enablePullToRefresh: true,
  enableAutoRefresh: true,
  debugMode: !environment.production
};
```

---

**Documentation API maintenue par l'équipe BeleyaShop**  
_Version : 1.0.0 - Dernière mise à jour : 2024_