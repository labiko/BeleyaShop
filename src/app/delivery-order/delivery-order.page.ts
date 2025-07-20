import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { OrderService } from '../services/order.service';
import { Order, OrderItem } from '../models/order';

@Component({
  selector: 'app-delivery-order',
  templateUrl: './delivery-order.page.html',
  styleUrls: ['./delivery-order.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DeliveryOrderPage implements OnInit {
  order: Order | null = null;
  orderItems: OrderItem[] = [];
  isLoading = true;
  error: string = '';
  deliveryCode = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router, // Rendre public pour l'utiliser dans le template
    private orderService: OrderService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber');
    if (orderNumber) {
      this.loadOrder(orderNumber);
    } else {
      this.error = 'Numéro de commande invalide';
      this.isLoading = false;
    }
  }

  async loadOrder(orderNumber: string) {
    try {
      this.isLoading = true;
      this.error = '';

      // Récupérer la commande par numéro
      const { data: orderData, error: orderError } = await this.orderService['supabase']
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .eq('status', 'confirmed') // Seules les commandes confirmées peuvent être livrées
        .single();

      if (orderError) {
        throw new Error('Commande non trouvée ou non confirmée');
      }

      this.order = orderData;

      // Récupérer les articles de la commande
      if (this.order && this.order.id) {
        this.orderItems = await this.orderService.getOrderItems(this.order.id);
      }

    } catch (error) {
      console.error('Erreur chargement commande:', error);
      this.error = error instanceof Error ? error.message : 'Erreur lors du chargement de la commande';
    } finally {
      this.isLoading = false;
    }
  }

  async validateDelivery() {
    if (!this.deliveryCode.trim()) {
      await this.showToast('Veuillez saisir le code de livraison', 'warning');
      return;
    }

    if (this.deliveryCode !== this.order?.delivery_code) {
      await this.showToast('Code de livraison incorrect', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: '✅ Confirmer la livraison',
      message: `Marquer la commande ${this.order?.order_number} comme livrée ?

Cette action est irréversible.`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer livraison',
          cssClass: 'success',
          handler: () => {
            this.performDelivery();
          }
        }
      ]
    });

    await alert.present();
  }

  private async performDelivery() {
    const loading = await this.loadingController.create({
      message: 'Traitement en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Marquer la commande comme livrée
      if (!this.order?.id) {
        throw new Error('ID de commande non disponible');
      }

      const { error } = await this.orderService['supabase']
        .from('orders')
        .update({ 
          status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', this.order.id);

      await loading.dismiss();

      if (error) {
        throw error;
      }

      await this.showToast('Commande marquée comme livrée !', 'success');
      
      // Rediriger vers une page de succès ou recharger
      if (this.order) {
        this.order.status = 'delivered';
      }
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erreur livraison:', error);
      await this.showToast('Erreur lors de la validation', 'danger');
    }
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString()} GNF`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openGoogleMaps() {
    if (this.order?.customer_location_lat && this.order?.customer_location_lng) {
      const url = `https://maps.google.com/?q=${this.order.customer_location_lat},${this.order.customer_location_lng}`;
      window.open(url, '_blank');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }
}