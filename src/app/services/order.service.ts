import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Order, OrderItem } from '../models/order';
import { CartItem } from '../models/product';
import { OrderNumberGenerator } from '../utils/order-number.util';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  /**
   * Vérifier la disponibilité du stock pour un produit
   */
  async checkStockAvailability(productId: number, quantity: number): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('check_stock_availability', {
          product_id_param: productId,
          quantity_param: quantity
        });

      if (error) {
        console.error('Erreur vérification stock:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la vérification du stock:', error);
      return false;
    }
  }

  /**
   * Vérifier la disponibilité du stock pour tous les articles du panier
   */
  async checkCartStockAvailability(cartItems: CartItem[]): Promise<{
    available: boolean;
    unavailableItems: { product: any; requestedQuantity: number; availableStock: number }[];
  }> {
    const unavailableItems: any[] = [];
    
    for (const item of cartItems) {
      const isAvailable = await this.checkStockAvailability(item.product.id, item.quantity);
      
      if (!isAvailable) {
        // Récupérer le stock disponible
        const { data: product } = await this.supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product.id)
          .single();
        
        unavailableItems.push({
          product: item.product,
          requestedQuantity: item.quantity,
          availableStock: product?.stock_quantity || 0
        });
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems
    };
  }

  /**
   * Créer une commande en attente
   */
  async createPendingOrder(
    cartItems: CartItem[],
    totalAmount: number,
    location?: { lat: number; lng: number; accuracy: number },
    whatsappMessage?: string
  ): Promise<{ success: boolean; orderId?: number; orderNumber?: string; error?: string }> {
    try {
      // Vérifier d'abord le stock
      const stockCheck = await this.checkCartStockAvailability(cartItems);
      if (!stockCheck.available) {
        return {
          success: false,
          error: `Stock insuffisant pour: ${stockCheck.unavailableItems.map(item => 
            `${item.product.name} (demandé: ${item.requestedQuantity}, disponible: ${item.availableStock})`
          ).join(', ')}`
        };
      }

      // Créer la commande avec un numéro personnalisé
      const orderNumber = OrderNumberGenerator.generate();
      const orderData: Partial<Order> = {
        order_number: orderNumber,
        total_amount: totalAmount,
        status: 'pending',
        whatsapp_message: whatsappMessage
      };

      if (location) {
        orderData.customer_location_lat = Number(location.lat.toFixed(8));
        orderData.customer_location_lng = Number(location.lng.toFixed(8));
        orderData.customer_location_accuracy = Math.round(location.accuracy);
      }

      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Erreur création commande:', orderError);
        return { success: false, error: 'Erreur lors de la création de la commande' };
      }

      // Créer les articles de la commande
      const orderItems: Partial<OrderItem>[] = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }));

      const { error: itemsError } = await this.supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Erreur création articles:', itemsError);
        // Supprimer la commande créée en cas d'erreur
        await this.supabase.from('orders').delete().eq('id', order.id);
        return { success: false, error: 'Erreur lors de la création des articles' };
      }

      console.log('✅ Commande créée avec succès:', order.id, 'Numéro:', orderNumber);
      return { success: true, orderId: order.id, orderNumber: orderNumber };

    } catch (error) {
      console.error('Erreur lors de la création de commande:', error);
      return { success: false, error: 'Erreur inattendue lors de la création de la commande' };
    }
  }

  /**
   * Confirmer une commande (fonction admin)
   */
  async confirmOrder(orderId: number, adminName: string = 'Admin'): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('confirm_order', {
          order_id_param: orderId,
          admin_name: adminName
        });

      if (error) {
        console.error('Erreur confirmation commande:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      return false;
    }
  }

  /**
   * Récupérer les commandes en attente
   */
  async getPendingOrders(): Promise<Order[]> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération commandes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return [];
    }
  }

  /**
   * Récupérer les articles d'une commande
   */
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur récupération articles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error);
      return [];
    }
  }

  /**
   * Récupérer le numéro de commande par ID
   */
  async getOrderNumber(orderId: number): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Erreur récupération numéro commande:', error);
        return null;
      }

      return data?.order_number || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du numéro de commande:', error);
      return null;
    }
  }
}