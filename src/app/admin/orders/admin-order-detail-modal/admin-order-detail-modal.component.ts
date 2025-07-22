import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Order, OrderItem } from '../../../models/order';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-admin-order-detail-modal',
  templateUrl: './admin-order-detail-modal.component.html',
  styleUrls: ['./admin-order-detail-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AdminOrderDetailModalComponent implements OnInit {
  private modalController = inject(ModalController);
  private orderService = inject(OrderService);
  private toastController = inject(ToastController);

  @Input() order!: Order;
  
  orderItems: OrderItem[] = [];
  isLoading = true;

  async ngOnInit() {
    if (this.order?.id) {
      await this.loadOrderItems();
    }
  }

  private async loadOrderItems() {
    try {
      this.orderItems = await this.orderService.getOrderItems(this.order.id!);
      this.isLoading = false;
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
      this.showToast('Erreur lors du chargement des détails', 'danger');
      this.isLoading = false;
    }
  }

  close() {
    this.modalController.dismiss({ refreshNeeded: false });
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'time';
      case 'confirmed': return 'checkmark-circle';
      case 'delivered': return 'checkmark-done-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  }

  openGoogleMaps() {
    if (this.order.customer_location_lat && this.order.customer_location_lng) {
      const url = `https://maps.google.com/?q=${this.order.customer_location_lat},${this.order.customer_location_lng}`;
      window.open(url, '_blank');
    }
  }

  openWhatsApp() {
    if (this.order.customer_phone) {
      const url = `https://wa.me/${this.order.customer_phone}`;
      window.open(url, '_blank');
    }
  }

  copyWhatsAppMessage() {
    if (this.order.whatsapp_message) {
      navigator.clipboard.writeText(this.order.whatsapp_message).then(() => {
        this.showToast('Message WhatsApp copié', 'success');
      }).catch(() => {
        this.showToast('Erreur lors de la copie', 'danger');
      });
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }
}