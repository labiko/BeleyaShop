import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { CartItem } from '../models/product';
import { CartService } from '../services/cart.service';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ImageFallbackDirective]
})
export class CartPage implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  cartItems: CartItem[] = [];
  private cartSubscription: Subscription = new Subscription();

  ngOnInit() {
    this.cartSubscription = this.cartService.cart$.subscribe(cartItems => {
      this.cartItems = cartItems;
    });
    this.loadCartItems();
  }

  ngOnDestroy() {
    this.cartSubscription.unsubscribe();
  }

  loadCartItems() {
    this.cartItems = this.cartService.getCartItems();
  }

  async updateQuantity(productId: number, newQuantity: number) {
    const currentItem = this.cartItems.find(item => item.product.id === productId);
    const previousQuantity = currentItem?.quantity || 0;
    
    const result = await this.cartService.updateQuantity(productId, newQuantity);
    
    if (!result.success) {
      const toast = await this.toastController.create({
        message: result.error || 'Erreur lors de la modification',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } else {
      // Afficher un message de succès pour toute modification de quantité
      let message = '';
      let color = 'success';
      
      if (newQuantity > previousQuantity) {
        message = `✅ Quantité augmentée (${previousQuantity} → ${newQuantity})`;
      } else if (newQuantity < previousQuantity) {
        message = `📉 Quantité réduite (${previousQuantity} → ${newQuantity})`;
        color = 'warning';
      } else if (newQuantity === previousQuantity) {
        message = `ℹ️ Quantité inchangée (${newQuantity})`;
        color = 'medium';
      }
      
      if (message) {
        const toast = await this.toastController.create({
          message: message,
          duration: 2000,
          position: 'bottom',
          color: color
        });
        await toast.present();
      }
    }
  }

  removeFromCart(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString()} GNF`;
  }

  getTotalItemCount(): number {
    return this.cartService.getCartItemCount();
  }

  getTotalPrice(): number {
    return this.cartService.getCartTotal();
  }

  goToCatalog() {
    this.router.navigate(['/tabs/catalog']);
  }

  proceedToDelivery() {
    this.router.navigate(['/delivery']);
  }

  onImageError(event: any) {
    const img = event.target;
    if (!img.hasAttribute('data-error-handled')) {
      img.setAttribute('data-error-handled', 'true');
      // Image placeholder avec design adapté au panier (plus petite et carrée)
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjlmYWZiIiByeD0iOCIvPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzNmODJmNiIvPgo8cGF0aCBkPSJNNDAgMzJoMjB2NmgtMjB6IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDUgMzZoNXY5aC01eiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTUwIDM2aDV2OWgtNXoiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjM1IiB5PSI1NSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjFmNWY5IiBzdHJva2U9IiNkNGQ0ZDgiIHN0cm9rZS13aWR0aD0iMSIgcng9IjQiLz4KPHRleHQgeD0iNTAiIHk9IjY3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzM3NDE1MSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSI1MDAiPlByb2R1aXQ8L3RleHQ+CjxjaXJjbGUgY3g9IjQwIiBjeT0iODUiIHI9IjIiIGZpbGw9IiNmYTUyNTIiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSI4NSIgcj0iMiIgZmlsbD0iI2VjNDg5OSIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9Ijg1IiByPSIyIiBmaWxsPSIjMzkyNGE5Ii8+Cjwvc3ZnPg==';
      console.warn('Image failed to load in cart:', img.getAttribute('src'));
    }
  }
}
