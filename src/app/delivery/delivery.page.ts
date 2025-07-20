import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CartItem } from '../models/product';
import { CartService } from '../services/cart.service';

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
  cartItems: CartItem[] = [];
  currentLocation: LocationCoords | null = null;
  gettingLocation = false;
  locationError: string = '';
  locationProgress = 0;
  bestAccuracy: number | null = null;
  
  private cartSubscription: Subscription = new Subscription();
  private readonly VENDOR_PHONE = '33620951645';
  private progressInterval?: any;
  private watchId?: number;
  private locationTimeout?: any;
  private bestPosition: any = null;

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

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
    this.cleanupGeolocation();
    this.locationProgress = 100;
    
    if (this.bestPosition) {
      this.currentLocation = {
        latitude: this.bestPosition.coords.latitude,
        longitude: this.bestPosition.coords.longitude,
        accuracy: this.bestPosition.coords.accuracy
      };
      
      // Attendre un peu pour que l'utilisateur voie 100%, puis envoyer la commande
      setTimeout(() => {
        this.finalizeWhatsAppOrder();
      }, 1000);
    } else {
      this.gettingLocation = false;
      this.locationError = 'Impossible d\'obtenir votre position. La commande sera envoyée sans localisation.';
      // Envoyer quand même la commande sans localisation
      setTimeout(() => {
        this.finalizeWhatsAppOrder();
      }, 2000);
    }
  }

  sendWhatsAppOrder() {
    // Commencer la recherche de localisation automatiquement
    this.startLocationSearch();
  }

  private finalizeWhatsAppOrder() {
    let message = `Bonjour, je veux commander :\n\n`;
    
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
