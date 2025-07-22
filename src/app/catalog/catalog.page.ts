import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Product, CartItem } from '../models/product';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { ToastService } from '../services/toast.service';
import { WhatsappFabComponent } from '../components/whatsapp-fab/whatsapp-fab.component';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';
import { VersionService } from '../services/version.service';
import { PwaService } from '../services/pwa.service';
import { UpdateDetectionService, VersionInfo } from '../services/update-detection.service';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, WhatsappFabComponent, ImageFallbackDirective]
})
export class CatalogPage implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private versionService = inject(VersionService);
  private pwaService = inject(PwaService);
  private updateDetectionService = inject(UpdateDetectionService);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: any[] = [];
  selectedCategory: string = 'all';
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  cartItemCount: number = 0;
  
  // Géolocalisation
  isGettingLocation: boolean = false;
  locationProgress: number = 0;
  currentLocation: any = null;
  showAddressInput: boolean = false;
  customerAddress: string = '';
  
  // PWA
  showInstallButton: boolean = false;
  
  // Update detection
  updateAvailable: boolean = false;
  newVersionInfo: VersionInfo | null = null;
  
  private cartSubscription?: Subscription;
  private routeSubscription?: Subscription;
  private productsSubscription?: Subscription;
  private updateAvailableSubscription?: Subscription;
  private newVersionSubscription?: Subscription;
  private progressInterval?: any;
  private watchId?: number;
  private locationTimeout?: any;
  private autoRefreshInterval?: any;
  private readonly VENDOR_PHONE = '33620951645';

  ngOnInit() {
    // Affichage de la version dans la console pour le développement
    const versionInfo = this.versionService.getVersionInfo();
    console.log(`🚀 BeleyaShop Catalog v${versionInfo.version}`);
    console.log(`📅 Build: ${versionInfo.formattedBuildDate}`);
    
    this.loadCategories();
    this.loadProducts();
    this.checkInitialCategory();
    this.subscribeToCart();
    this.startAutoRefresh();
    this.checkPwaInstallability();
    this.initializeUpdateDetection();
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('Categories loaded:', this.categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  ngOnDestroy() {
    // Corriger les fuites mémoire
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.updateAvailableSubscription) {
      this.updateAvailableSubscription.unsubscribe();
    }
    if (this.newVersionSubscription) {
      this.newVersionSubscription.unsubscribe();
    }
    
    // Nettoyer la géolocalisation et auto-refresh
    this.cleanupGeolocation();
    this.stopAutoRefresh();
  }

  private subscribeToCart() {
    this.cartSubscription = this.cartService.cart$.subscribe(cartItems => {
      this.cartItems = cartItems;
      this.cartTotal = this.cartService.getCartTotal();
      this.cartItemCount = this.cartService.getCartItemCount();
    });
  }

  private checkInitialCategory() {
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
        this.filterProductsByCategory();
      }
    });
  }

  loadProducts() {
    this.productsSubscription = this.productService.getAllProducts().subscribe(products => {
      this.products = products;
      this.filterProductsByCategory();
    });
  }

  // Auto-refresh system
  private startAutoRefresh() {
    // Rafraîchissement automatique toutes les 5 minutes
    this.autoRefreshInterval = setInterval(() => {
      console.log('Auto-refresh: Recharging products...');
      this.loadProducts();
    }, 5 * 60 * 1000); // 5 minutes en millisecondes
  }

  private stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = undefined;
    }
  }

  // Pull-to-refresh functionality
  async handleRefresh(event: any) {
    console.log('Manual refresh triggered');
    
    try {
      await new Promise(resolve => {
        this.loadProducts();
        // Simuler un délai pour montrer le refresh
        setTimeout(resolve, 1000);
      });
      
      //await this.toastService.showSuccess('Catalogue mis à jour !', 2000);
      
    } catch (error) {
      console.error('Error during refresh:', error);
      await this.toastService.showError('Erreur lors du rafraîchissement', 2000);
    } finally {
      event.target.complete();
    }
  }

  filterByCategory(event: any) {
    this.selectedCategory = event.detail.value;
    this.filterProductsByCategory();
  }

  private filterProductsByCategory() {
    if (this.selectedCategory === 'all') {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(product => 
        product.category === this.selectedCategory
      );
    }
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString()} GNF`;
  }

  onImageError(event: any) {
    const img = event.target;
    if (!img.hasAttribute('data-error-handled')) {
      img.setAttribute('data-error-handled', 'true');
      // Image placeholder plus visible avec icône de produit cosmétique
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjlmYWZiIi8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjM4MCIgaGVpZ2h0PSIxODAiIHJ4PSI4IiBzdHJva2U9IiNlNWU3ZWIiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iODAiIHI9IjI1IiBmaWxsPSIjM2Y4MmY2Ii8+CjxwYXRoIGQ9Ik0xODUgNzVoMzB2MTBoLTMweiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE5MCA4MGgxMHYxNWgtMTB6IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjAwIDgwaDEwdjE1aC0xMHoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xODAgMTA1aDQwdjUwaC00MHoiIGZpbGw9IiNmMWY1ZjkiIHN0cm9rZT0iI2Q0ZDRkOCIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzM3NDE1MSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNTAwIj5Qcm9kdWl0PC90ZXh0Pgo8dGV4dCB4PSIyMDAiIHk9IjE0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiM2YjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+Y29zbcOpdGlxdWU8L3RleHQ+CjxjaXJjbGUgY3g9IjE3MCIgY3k9IjE3MCIgcj0iNCIgZmlsbD0iI2ZhNTI1MiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNzAiIHI9IjQiIGZpbGw9IiNlYzQ4OTkiLz4KPGNpcmNsZSBjeD0iMjMwIiBjeT0iMTcwIiByPSI0IiBmaWxsPSIjMzkyNGE5Ii8+Cjwvc3ZnPg==';
      console.warn('Image failed to load:', img.getAttribute('src'));
    }
  }

  getProductQuantityInCart(productId: number): number {
    const cartItem = this.cartItems.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  }

  async addToCart(product: Product) {
    const result = await this.cartService.addToCart(product);
    
    if (!result.success) {
      await this.toastService.showError(result.error || 'Erreur lors de l\'ajout au panier', 3000);
    }
    // Supprimer le message de succès pour éviter l'affichage à chaque ajout
  }

  async removeFromCart(product: Product) {
    const newQuantity = this.getProductQuantityInCart(product.id) - 1;
    const result = await this.cartService.updateQuantity(product.id, newQuantity);
    
    if (result.success) {
      await this.toastService.showWarning(`${product.name} retiré du panier`, 1500);
    } else {
      await this.toastService.showError(result.error || 'Erreur lors de la modification du panier', 3000);
    }
  }

  shouldShowWhatsAppButton(): boolean {
    return true; // Afficher toujours le bouton WhatsApp
  }

  async startWhatsAppOrder() {
    // Vérifier le total minimum de 100000 GNF
    if (this.cartTotal < 100000) {
      await this.toastService.showWarning(
        `Commande minimum: ${this.formatPrice(100000)}. Votre panier: ${this.formatPrice(this.cartTotal)}`,
        4000
      );
      return;
    }
    
    this.getCurrentLocation();
  }

  private getCurrentLocation() {
    // Nettoyer toute géolocalisation précédente
    this.cleanupGeolocation();
    
    this.isGettingLocation = true;
    this.locationProgress = 0;
    this.currentLocation = null;
    this.showAddressInput = false;

    if (!navigator.geolocation) {
      this.showLocationErrorToast('La géolocalisation n\'est pas supportée par ce navigateur.');
      this.isGettingLocation = false;
      return;
    }

    let bestPosition: any = null;
    const startTime = Date.now();

    // Progression moderne - plus fluide sur 30 secondes
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / 30000) * 100, 100);
      this.locationProgress = progressPercent;
    }, 100);

    // Timeout de 30 secondes
    this.locationTimeout = setTimeout(() => {
      this.cleanupGeolocation();
      
      if (bestPosition) {
        this.processBestPosition(bestPosition);
      } else {
        this.isGettingLocation = false;
        this.locationProgress = 0;
        this.showLocationErrorToast('Impossible de trouver votre position après 30 secondes.');
      }
    }, 30000);

    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0
    };

    // Utiliser watchPosition pour obtenir la meilleure position
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
          
          // Si on obtient une très bonne précision, on peut arrêter plus tôt
          if (position.coords.accuracy <= 10) {
            this.cleanupGeolocation();
            this.locationProgress = 100;
            this.processBestPosition(bestPosition);
          }
        }
      },
      (error) => {
        this.cleanupGeolocation();
        this.isGettingLocation = false;
        this.locationProgress = 0;
        
        let errorMessage = 'Erreur de géolocalisation.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la localisation refusé. Veuillez autoriser l\'accès.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Timeout de la demande de localisation.';
            break;
        }
        this.showLocationErrorToast(errorMessage);
      },
      options
    );
  }

  private cleanupGeolocation() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
    if (this.locationTimeout) {
      clearTimeout(this.locationTimeout);
      this.locationTimeout = undefined;
    }
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
    }
  }

  private processBestPosition(position: any) {
    this.currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
    
    setTimeout(() => {
      this.isGettingLocation = false;
      if (this.currentLocation.accuracy <= 50) {
        this.showAddressInput = true;
      } else {
        this.showLocationErrorToast(`Position trouvée mais pas assez précise (${Math.round(this.currentLocation.accuracy)}m). Veuillez réessayer.`);
      }
    }, 500);
  }

  async sendWhatsAppOrder() {
    if (!this.currentLocation || !this.customerAddress.trim()) {
      return;
    }

    let message = `Bonjour, je veux commander :\n\n`;
    
    // Ajouter les produits
    this.cartItems.forEach(item => {
      message += `- ${item.product.name} (x${item.quantity}) - ${this.formatPrice(item.product.price * item.quantity)}\n`;
    });
    
    message += `\nTotal : ${this.formatPrice(this.cartTotal)}\n\n`;
    
    // Ajouter l'adresse
    message += `📍 Adresse de livraison :\n${this.customerAddress}\n\n`;
    
    // Ajouter les coordonnées
    const googleMapsUrl = `https://maps.google.com/?q=${this.currentLocation.latitude},${this.currentLocation.longitude}`;
    message += `📱 Position GPS : ${googleMapsUrl}\n`;
    message += `🎯 Précision : ${Math.round(this.currentLocation.accuracy)}m\n\n`;
    
    message += `🤖 Commande envoyée via BeleyaShop`;

    // Encoder le message pour WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${this.VENDOR_PHONE}?text=${encodedMessage}`;
    
    // Ouvrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Réinitialiser
    this.cartService.clearCart();
    this.resetOrderProcess();
    
    // Afficher un message de confirmation
    this.showOrderSentToast();
  }

  resetOrderProcess() {
    this.cleanupGeolocation();
    this.currentLocation = null;
    this.showAddressInput = false;
    this.customerAddress = '';
    this.isGettingLocation = false;
    this.locationProgress = 0;
  }

  private async showLocationErrorToast(message: string) {
    await this.toastService.showError(message, 4000);
  }

  private async showOrderSentToast() {
    await this.toastService.showSuccess('Commande envoyée via WhatsApp ! Votre panier a été vidé.', 3000);
  }

  // Update Detection Methods
  private initializeUpdateDetection() {
    console.log('🔄 Initialisation du système de mise à jour côté client...');
    
    // Initialiser le service de détection
    this.updateDetectionService.initializeOnPage();
    
    // S'abonner aux notifications de mise à jour
    this.updateAvailableSubscription = this.updateDetectionService.updateAvailable$.subscribe(
      (available) => {
        this.updateAvailable = available;
        console.log('📱 Client - Mise à jour disponible:', available);
      }
    );

    this.newVersionSubscription = this.updateDetectionService.newVersionInfo$.subscribe(
      (versionInfo) => {
        this.newVersionInfo = versionInfo;
        console.log('📦 Client - Nouvelle version:', versionInfo);
      }
    );
  }

  async checkForUpdates() {
    await this.updateDetectionService.manualCheckForUpdates();
  }

  // PWA Methods
  private checkPwaInstallability() {
    this.pwaService.isInstallable$.subscribe(isInstallable => {
      this.showInstallButton = isInstallable && !this.pwaService.isStandalone();
      console.log('PWA installable:', isInstallable, 'Standalone:', this.pwaService.isStandalone());
      console.log('Show install button:', this.showInstallButton);
    });

    // Force check après un délai pour les navigateurs lents
    setTimeout(() => {
      const canInstall = this.pwaService.canInstall();
      console.log('PWA can install (delayed check):', canInstall);
      if (canInstall && !this.showInstallButton) {
        this.showInstallButton = true;
        console.log('PWA install button forced to show');
      }
    }, 3000);
  }

  async installPwa() {
    // Log pour debug
    console.log('PWA Install attempt:', {
      isPwaInstallable: this.pwaService.isPwaInstallable(),
      canInstall: this.pwaService.canInstall(),
      isStandalone: this.pwaService.isStandalone()
    });
    
    // Vérifier si c'est iOS Safari
    const isIOS = this.pwaService.isIOSDevice();
    if (isIOS) {
      const instructions = this.pwaService.getInstallInstructions();
      await this.toastService.showInfo(instructions, 5000);
      return;
    }
    
    // Si pas installable mais sur mobile, donner des instructions
    if (!this.pwaService.isPwaInstallable() && (this.pwaService.isAndroidDevice() || isIOS)) {
      const instructions = this.pwaService.getInstallInstructions();
      await this.toastService.showInfo(instructions, 5000);
      return;
    }
    
    // Si vraiment pas installable
    if (!this.pwaService.isPwaInstallable()) {
      await this.toastService.showWarning('Installation non disponible. Essayez avec Chrome ou Edge.', 4000);
      return;
    }

    const success = await this.pwaService.installPwa();
    if (success) {
      await this.toastService.showSuccess('Application installée avec succès !', 3000);
      this.showInstallButton = false;
    } else {
      await this.toastService.showError('Installation annulée ou échouée', 3000);
    }
  }

}
