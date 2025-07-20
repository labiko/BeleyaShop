import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/product';

@Component({
  selector: 'app-whatsapp-fab',
  templateUrl: './whatsapp-fab.component.html',
  styleUrls: ['./whatsapp-fab.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class WhatsappFabComponent implements OnInit, OnDestroy {
  cartItemCount: number = 0;
  cartItems: CartItem[] = [];
  gettingLocation = false;
  locationProgress = 0;
  bestAccuracy: number | null = null;
  currentLocation: any = null;
  positionCount = 0;
  allPositions: any[] = [];
  
  // Propriétés pour le cercle de progression
  readonly circumference = 2 * Math.PI * 52; // rayon = 52
  Math = Math;
  
  private cartSubscription: Subscription = new Subscription();
  private readonly VENDOR_PHONE = '33620951645';
  private progressInterval?: any;
  private watchId?: number;
  private locationTimeout?: any;
  private bestPosition: any = null;

  constructor(
    private cartService: CartService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.cartSubscription = this.cartService.cart$.subscribe(cartItems => {
      this.cartItemCount = this.cartService.getCartItemCount();
      this.cartItems = cartItems;
    });
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

  async goToCart() {
    if (this.cartItemCount === 0) {
      const toast = await this.toastController.create({
        message: 'Votre panier est vide. Ajoutez des produits pour commander.',
        duration: 3000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }
    
    // Afficher la confirmation avant de lancer la géolocalisation
    this.showLocationConfirmation();
  }

  async showLocationConfirmation() {
    const alert = await this.alertController.create({
      header: '📍 Partage de position',
      message: 'Pour traiter votre commande :\n\n• Nous allons localiser votre position\n• Votre position sera partagée avec le vendeur\n• Cela permet une livraison plus précise\n\nLa recherche prendra environ 30 secondes pour obtenir la meilleure précision.',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Confirmer',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.startLocationSearch();
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString()} GNF`;
  }

  get strokeDashoffset(): number {
    const progress = this.locationProgress / 100;
    return this.circumference - progress * this.circumference;
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
    this.positionCount = 0;
    this.allPositions = [];

    if (!navigator.geolocation) {
      // Envoyer sans géolocalisation
      setTimeout(() => {
        this.finalizeWhatsAppOrder();
      }, 1000);
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
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const altitude = position.coords.altitude;
        const speed = position.coords.speed;
        const heading = position.coords.heading;
        const timestamp = new Date(position.timestamp).toLocaleTimeString();
        
        this.positionCount++;
        
        // Console détaillé pour chaque position
        console.group(`🌍 Position ${this.positionCount} reçue à ${timestamp}`);
        console.log(`📍 Latitude: ${lat.toFixed(8)}`);
        console.log(`📍 Longitude: ${lng.toFixed(8)}`);
        console.log(`🎯 Précision: ${Math.round(accuracy)}m`);
        if (altitude !== null) console.log(`⛰️ Altitude: ${Math.round(altitude)}m`);
        if (speed !== null) console.log(`🚗 Vitesse: ${Math.round(speed * 3.6)}km/h`);
        if (heading !== null) console.log(`🧭 Direction: ${Math.round(heading)}°`);
        
        // Stocker toutes les positions reçues
        this.allPositions.push({
          position: position,
          timestamp: Date.now(),
          accuracy: accuracy
        });
        
        // Garder la position la plus précise et mettre à jour l'affichage en temps réel
        const wasBest = !this.bestPosition || accuracy < this.bestPosition.coords.accuracy;
        if (wasBest) {
          this.bestPosition = position;
          this.bestAccuracy = Math.round(accuracy);
          console.log(`✅ Nouvelle meilleure position! (${Math.round(accuracy)}m)`);
        } else {
          console.log(`❌ Position moins précise que la meilleure (${Math.round(this.bestPosition.coords.accuracy)}m)`);
        }
        
        console.log(`📊 Total positions collectées: ${this.positionCount}`);
        console.groupEnd();
      },
      (error) => {
        console.error('❌ Erreur de géolocalisation:', error);
        console.error('Code d\'erreur:', error.code);
        console.error('Message:', error.message);
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
    
    console.group(`🏁 Recherche de géolocalisation terminée`);
    console.log(`📊 Total positions collectées: ${this.positionCount}`);
    
    if (this.allPositions.length > 0) {
      // Trier par précision (accuracy croissante) pour trouver la meilleure
      const sortedPositions = this.allPositions.sort((a, b) => a.accuracy - b.accuracy);
      const bestPos = sortedPositions[0];
      const worstPos = sortedPositions[sortedPositions.length - 1];
      
      console.log(`🏆 Meilleure position sélectionnée:`);
      console.log(`   📍 Lat: ${bestPos.position.coords.latitude.toFixed(8)}`);
      console.log(`   📍 Lng: ${bestPos.position.coords.longitude.toFixed(8)}`);
      console.log(`   🎯 Précision: ${Math.round(bestPos.accuracy)}m`);
      
      console.log(`📈 Statistiques de précision:`);
      console.log(`   🟢 Meilleure: ${Math.round(bestPos.accuracy)}m`);
      console.log(`   🔴 Pire: ${Math.round(worstPos.accuracy)}m`);
      console.log(`   📊 Amélioration: ${Math.round(((worstPos.accuracy - bestPos.accuracy) / worstPos.accuracy) * 100)}%`);
      
      console.log(`📋 Toutes les précisions: ${this.allPositions.map(p => Math.round(p.accuracy) + 'm').join(', ')}`);
      
      this.currentLocation = {
        latitude: bestPos.position.coords.latitude,
        longitude: bestPos.position.coords.longitude,
        accuracy: bestPos.position.coords.accuracy
      };
      
      this.bestAccuracy = Math.round(bestPos.accuracy);
    } else {
      console.warn(`⚠️ Aucune position collectée!`);
    }
    
    console.groupEnd();
    
    // Attendre un peu pour que l'utilisateur voie 100%, puis envoyer la commande
    setTimeout(() => {
      this.finalizeWhatsAppOrder();
    }, 1000);
  }

  private finalizeWhatsAppOrder() {
    let message = `Bonjour, je veux commander :\n\n`;
    
    // Ajouter les produits depuis le localStorage
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
    
    // Rediriger vers le catalogue
    setTimeout(() => {
      this.router.navigate(['/tabs/catalog']);
    }, 1000);
  }
}
