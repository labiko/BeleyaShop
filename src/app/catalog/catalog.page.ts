import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Product, CartItem } from '../models/product';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { WhatsappFabComponent } from '../components/whatsapp-fab/whatsapp-fab.component';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, WhatsappFabComponent, ImageFallbackDirective]
})
export class CatalogPage implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
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
  
  private cartSubscription?: Subscription;
  private routeSubscription?: Subscription;
  private productsSubscription?: Subscription;
  private progressInterval?: any;
  private watchId?: number;
  private locationTimeout?: any;
  private autoRefreshInterval?: any;
  private readonly VENDOR_PHONE = '33620951645';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadProducts();
    this.checkInitialCategory();
    this.subscribeToCart();
    this.startAutoRefresh();
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
      
      const toast = await this.toastController.create({
        message: 'Catalogue mis à jour !',
        duration: 2000,
        position: 'top',
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error during refresh:', error);
      const toast = await this.toastController.create({
        message: 'Erreur lors du rafraîchissement',
        duration: 2000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
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
    
    if (result.success) {
      const toast = await this.toastController.create({
        message: `${product.name} ajouté au panier`,
        duration: 2000,
        position: 'bottom',
        color: 'success',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    } else {
      const toast = await this.toastController.create({
        message: result.error || 'Erreur lors de l\'ajout au panier',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    }
  }

  async removeFromCart(product: Product) {
    const newQuantity = this.getProductQuantityInCart(product.id) - 1;
    const result = await this.cartService.updateQuantity(product.id, newQuantity);
    
    if (result.success) {
      const toast = await this.toastController.create({
        message: `${product.name} retiré du panier`,
        duration: 1500,
        position: 'bottom',
        color: 'warning',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    } else {
      const toast = await this.toastController.create({
        message: result.error || 'Erreur lors de la modification du panier',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    }
  }

  shouldShowWhatsAppButton(): boolean {
    return true; // Afficher toujours le bouton WhatsApp
  }

  async startWhatsAppOrder() {
    // Vérifier le total minimum de 100000 GNF
    if (this.cartTotal < 100000) {
      const toast = await this.toastController.create({
        message: `Commande minimum: ${this.formatPrice(100000)}. Votre panier: ${this.formatPrice(this.cartTotal)}`,
        duration: 4000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
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
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  private async showOrderSentToast() {
    const toast = await this.toastController.create({
      message: `Commande envoyée via WhatsApp ! Votre panier a été vidé.`,
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

}
