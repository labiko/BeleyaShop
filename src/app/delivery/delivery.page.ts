import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CartItem } from '../models/product';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';

declare var google: any;

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.page.html',
  styleUrls: ['./delivery.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DeliveryPage implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private router = inject(Router);
  private orderService = inject(OrderService);

  cartItems: CartItem[] = [];
  currentLocation: LocationCoords | null = null;
  gettingLocation = false;
  locationError: string = '';
  locationProgress = 0;
  bestAccuracy: number | null = null;
  createdOrderId: number | null = null;
  createdOrderNumber: string | null = null;
  
  private cartSubscription: Subscription = new Subscription();
  private readonly VENDOR_PHONE = '33620951645';
  private progressInterval?: any;
  private watchId?: number;
  private locationTimeout?: any;
  private bestPosition: any = null;

  ngOnInit() {
    this.cartSubscription = this.cartService.cart$.subscribe(cartItems => {
      this.cartItems = cartItems;
    });
    this.loadCartItems();
  }

  ngOnDestroy() {
    this.cartSubscription.unsubscribe();
    this.cleanupGeolocation();
  }

  private cleanupGeolocation() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
    }
    if (this.locationTimeout) {
      clearTimeout(this.locationTimeout);
      this.locationTimeout = undefined;
    }
  }

  loadCartItems() {
    this.cartItems = this.cartService.getCartItems();
    if (this.cartItems.length === 0) {
      this.router.navigate(['/tabs/cart']);
    }
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString()} GNF`;
  }

  getTotalPrice(): number {
    return this.cartService.getCartTotal();
  }

  getProgressMessage(): string {
    if (this.locationProgress < 20) {
      return 'Initialisation du GPS...';
    } else if (this.locationProgress < 40) {
      return 'Recherche des satellites...';
    } else if (this.locationProgress < 60) {
      return 'Amélioration de la précision...';
    } else if (this.locationProgress < 80) {
      return 'Optimisation en cours...';
    } else if (this.locationProgress < 100) {
      return 'Finalisation...';
    } else {
      return 'Position obtenue !';
    }
  }

  private startLocationSearch() {
    console.log('📍 Début startLocationSearch()');
    this.cleanupGeolocation();
    
    this.gettingLocation = true;
    this.locationProgress = 0;
    this.bestPosition = null;
    this.bestAccuracy = null;
    this.locationError = '';

    if (!navigator.geolocation) {
      this.locationError = 'La géolocalisation n\'est pas supportée par ce navigateur.';
      this.gettingLocation = false;
      return;
    }

    const startTime = Date.now();

    // Barre de progression sur 30 secondes
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      this.locationProgress = Math.min((elapsed / 30000) * 100, 100);
    }, 100);

    // Options pour obtenir la meilleure précision
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    // Surveiller la position en continu pour obtenir la meilleure précision
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        
        // Garder la position la plus précise
        if (!this.bestPosition || accuracy < this.bestPosition.coords.accuracy) {
          this.bestPosition = position;
          this.bestAccuracy = Math.round(accuracy);
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
      },
      options
    );

    // Arrêter après 30 secondes et utiliser la meilleure position
    this.locationTimeout = setTimeout(() => {
      this.finishLocationSearch();
    }, 30000);
  }

  private finishLocationSearch() {
    console.log('🏁 Début finishLocationSearch()');
    this.cleanupGeolocation();
    this.locationProgress = 100;
    
    if (this.bestPosition) {
      this.currentLocation = {
        latitude: this.bestPosition.coords.latitude,
        longitude: this.bestPosition.coords.longitude,
        accuracy: this.bestPosition.coords.accuracy
      };
      console.log('📍 Position trouvée:', this.currentLocation);
    } else {
      this.locationError = 'Impossible d\'obtenir votre position. La commande sera créée sans localisation.';
      console.log('⚠️ Aucune position trouvée');
    }
    
    // Créer la commande en base d'abord
    console.log('⏰ Création commande dans 1 seconde...');
    setTimeout(() => {
      this.createOrderAndSendWhatsApp();
    }, 1000);
  }

  sendWhatsAppOrder() {
    console.log('🚀 Début sendWhatsAppOrder()');
    // Commencer la recherche de localisation automatiquement
    this.startLocationSearch();
  }

  private async createOrderAndSendWhatsApp() {
    console.log('🔧 Début createOrderAndSendWhatsApp()');
    try {
      // Créer la commande en base
      const location = this.currentLocation ? {
        lat: this.currentLocation.latitude,
        lng: this.currentLocation.longitude,
        accuracy: this.currentLocation.accuracy
      } : undefined;

      console.log('📦 Création commande avec location:', location);

      const result = await this.orderService.createPendingOrder(
        this.cartItems,
        this.getTotalPrice(),
        location
      );

      console.log('📋 Résultat création commande:', result);

      if (!result.success) {
        this.locationError = result.error || 'Erreur lors de la création de la commande';
        this.gettingLocation = false;
        console.error('❌ Échec création commande:', result.error);
        return;
      }

      this.createdOrderId = result.orderId || null;
      this.createdOrderNumber = result.orderNumber || null;
      console.log('✅ Commande créée - ID:', this.createdOrderId, 'Numéro:', this.createdOrderNumber);

      // Maintenant envoyer sur WhatsApp
      console.log('📱 Appel finalizeWhatsAppOrder()');
      this.finalizeWhatsAppOrder();

    } catch (error) {
      console.error('❌ Erreur création commande:', error);
      this.locationError = 'Erreur lors de la création de la commande';
      this.gettingLocation = false;
    }
  }

  private finalizeWhatsAppOrder() {
    console.log('🔧 Finalisation WhatsApp avec numéro:', this.createdOrderNumber);
    
    let message = `Bonjour, je veux commander :\n\n`;
    
    // Ajouter le numéro de commande
    if (this.createdOrderNumber) {
      message += `📋 Numéro de commande : ${this.createdOrderNumber}\n\n`;
      console.log('✅ Numéro de commande ajouté au message WhatsApp');
    } else {
      console.warn('⚠️ Aucun numéro de commande disponible pour WhatsApp');
    }
    
    // Ajouter les produits
    this.cartItems.forEach(item => {
      message += `- ${item.product.name} (x${item.quantity}) - ${this.formatPrice(item.product.price * item.quantity)}\n`;
    });
    
    message += `\nTotal : ${this.formatPrice(this.getTotalPrice())}\n\n`;
    
    // Ajouter la localisation si disponible
    if (this.currentLocation) {
      const googleMapsUrl = `https://maps.google.com/?q=${this.currentLocation.latitude},${this.currentLocation.longitude}`;
      message += `📍 Ma localisation : ${googleMapsUrl}\n`;
      message += `Précision : ${Math.round(this.currentLocation.accuracy)}m\n\n`;
    } else {
      message += `📍 Localisation : Non disponible\n\n`;
    }
    
    message += `🤖 Commande envoyée via BeleyaShop`;

    // Encoder le message pour WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${this.VENDOR_PHONE}?text=${encodedMessage}`;
    
    console.log('📝 Message WhatsApp final:');
    console.log(message);
    console.log('🔗 URL WhatsApp:', whatsappUrl);
    
    // Ouvrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Vider le panier après envoi
    this.cartService.clearCart();
    
    // Finaliser l'interface
    this.gettingLocation = false;
    
    // Rediriger vers l'accueil
    setTimeout(() => {
      this.router.navigate(['/tabs/home']);
    }, 1000);
  }

  goBack() {
    this.router.navigate(['/tabs/cart']);
  }
}
