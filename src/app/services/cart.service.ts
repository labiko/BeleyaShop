import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Product } from '../models/product';
import { OrderService } from './order.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private orderService = inject(OrderService);

  private readonly STORAGE_KEY = 'beleya_cart';
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    try {
      const storedCart = localStorage.getItem(this.STORAGE_KEY);
      if (storedCart) {
        this.cartItems = JSON.parse(storedCart);
        this.cartSubject.next(this.cartItems);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      this.cartItems = [];
    }
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cartItems));
      this.cartSubject.next(this.cartItems);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  }

  async addToCart(product: Product, quantity: number = 1): Promise<{success: boolean, error?: string}> {
    const existingItem = this.cartItems.find(item => item.product.id === product.id);
    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    
    // Vérifier la disponibilité du stock
    const stockAvailable = await this.orderService.checkStockAvailability(product.id, newQuantity);
    
    if (!stockAvailable) {
      return {
        success: false,
        error: `Stock insuffisant. Quantité disponible: ${product.stock_quantity}`
      };
    }
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cartItems.push({ product, quantity });
    }
    
    this.saveCartToStorage();
    return { success: true };
  }

  removeFromCart(productId: number): void {
    this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
    this.saveCartToStorage();
  }

  async updateQuantity(productId: number, quantity: number): Promise<{success: boolean, error?: string}> {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (!item) {
      return { success: false, error: 'Produit non trouvé dans le panier' };
    }

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return { success: true };
    }

    // Vérifier la disponibilité du stock pour la nouvelle quantité
    const stockAvailable = await this.orderService.checkStockAvailability(productId, quantity);
    
    if (!stockAvailable) {
      return {
        success: false,
        error: `Stock insuffisant. Quantité disponible: ${item.product.stock_quantity}`
      };
    }

    item.quantity = quantity;
    this.saveCartToStorage();
    return { success: true };
  }

  clearCart(): void {
    this.cartItems = [];
    this.saveCartToStorage();
  }

  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  getCartItemCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  isInCart(productId: number): boolean {
    return this.cartItems.some(item => item.product.id === productId);
  }
}
