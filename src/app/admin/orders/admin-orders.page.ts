import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, LoadingController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { Order, OrderItem } from '../../models/order';
import { AdminOrderDetailModalComponent } from './admin-order-detail-modal/admin-order-detail-modal.component';

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.page.html',
  styleUrls: ['./admin-orders.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminOrdersPage implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  selectedStatus = 'all';
  searchTerm = '';

  // Statistiques
  stats = {
    pending: 0,
    confirmed: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  };

  private refreshSubscription?: Subscription;

  constructor(
    private orderService: OrderService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
    
    // Écouter l'événement de rafraîchissement
    window.addEventListener('admin-refresh', () => {
      this.loadOrders();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  async loadOrders() {
    this.isLoading = true;
    
    try {
      // Charger toutes les commandes en utilisant le service
      this.orders = await this.orderService.getAllOrders();
      this.calculateStats();
      this.applyFilters();
      this.isLoading = false;
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      this.showToast('Erreur lors du chargement des commandes', 'danger');
      this.isLoading = false;
    }
  }

  private calculateStats() {
    this.stats = {
      pending: 0,
      confirmed: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    this.orders.forEach(order => {
      switch (order.status) {
        case 'pending':
          this.stats.pending++;
          break;
        case 'confirmed':
          this.stats.confirmed++;
          this.stats.totalRevenue += order.total_amount;
          break;
        case 'delivered':
          this.stats.delivered++;
          break;
        case 'cancelled':
          this.stats.cancelled++;
          break;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.orders];

    // Filtre par statut
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.id?.toString().includes(term) ||
        order.customer_phone?.toLowerCase().includes(term) ||
        order.whatsapp_message?.toLowerCase().includes(term)
      );
    }

    this.filteredOrders = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusChange() {
    this.applyFilters();
  }

  async viewOrderDetails(order: Order) {
    const modal = await this.modalController.create({
      component: AdminOrderDetailModalComponent,
      componentProps: {
        order: order
      },
      cssClass: 'order-detail-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.refreshNeeded) {
        this.loadOrders();
      }
    });

    return await modal.present();
  }

  async confirmOrder(order: Order) {
    const alert = await this.alertController.create({
      header: '✅ Confirmer la commande',
      message: `Confirmer la commande ${order.order_number || '#' + order.id} ?

Cette action va :
• Marquer la commande comme confirmée
• Réduire automatiquement le stock des produits
• Envoyer une notification au client`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Confirmer',
          cssClass: 'success',
          handler: () => {
            this.performConfirmOrder(order);
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  private async performConfirmOrder(order: Order) {
    const loading = await this.loadingController.create({
      message: 'Confirmation en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const success = await this.orderService.confirmOrder(order.id!, 'Admin');
      await loading.dismiss();

      if (success) {
        this.showToast('Commande confirmée avec succès', 'success');
        this.loadOrders();
      } else {
        this.showToast('Erreur lors de la confirmation', 'danger');
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Erreur lors de la confirmation:', error);
      this.showToast('Erreur lors de la confirmation de la commande', 'danger');
    }
  }

  async updateOrderStatus(order: Order, newStatus: 'confirmed' | 'delivered' | 'cancelled') {
    const statusTexts = {
      confirmed: 'confirmée',
      delivered: 'livrée',
      cancelled: 'annulée'
    };

    const alert = await this.alertController.create({
      header: '🔄 Changer le statut',
      message: `Marquer la commande ${order.order_number || '#' + order.id} comme ${statusTexts[newStatus]} ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: () => {
            this.performStatusUpdate(order, newStatus);
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  private async performStatusUpdate(order: Order, newStatus: string) {
    const loading = await this.loadingController.create({
      message: 'Mise à jour en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Utiliser le service pour mettre à jour le statut
      const success = await this.orderService.updateOrderStatus(order.id!, newStatus as any);

      await loading.dismiss();

      if (!success) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      this.showToast('Statut mis à jour avec succès', 'success');
      this.loadOrders();
    } catch (error) {
      await loading.dismiss();
      console.error('Erreur lors de la mise à jour:', error);
      this.showToast('Erreur lors de la mise à jour du statut', 'danger');
    }
  }

  async deleteOrder(order: Order) {
    const alert = await this.alertController.create({
      header: '🗑️ Supprimer la commande',
      message: `Êtes-vous sûr de vouloir supprimer la commande ${order.order_number || '#' + order.id} ?

Cette action est irréversible.`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Supprimer',
          cssClass: 'danger',
          handler: () => {
            this.performDeleteOrder(order);
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  private async performDeleteOrder(order: Order) {
    const loading = await this.loadingController.create({
      message: 'Suppression en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Utiliser le service pour supprimer
      const success = await this.orderService.deleteOrder(order.id!);

      await loading.dismiss();

      if (!success) {
        throw new Error('Erreur lors de la suppression de la commande');
      }

      this.showToast('Commande supprimée avec succès', 'success');
      this.loadOrders();
    } catch (error) {
      await loading.dismiss();
      console.error('Erreur lors de la suppression:', error);
      this.showToast('Erreur lors de la suppression de la commande', 'danger');
    }
  }

  async refreshOrders(event: any) {
    await this.loadOrders();
    event.target.complete();
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

  openGoogleMaps(lat: number, lng: number) {
    const url = `https://maps.google.com/?q=${lat},${lng}&mode=driving`;
    window.open(url, '_blank');
  }

  async shareOrderWithDelivery(order: Order) {
    // Liste des livreurs disponibles
    const deliveryPersons = [
      { id: 1, name: 'Mamadou Diallo', phone: '33620951645' },
      { id: 2, name: 'Amadou Barry', phone: '33123456789' },
      { id: 3, name: 'Ibrahima Sow', phone: '33987654321' }
    ];

    const alert = await this.alertController.create({
      header: '🚚 Partager avec livreur',
      message: 'Sélectionnez le livreur pour cette commande:',
      inputs: deliveryPersons.map(person => ({
        name: 'deliveryPerson',
        type: 'radio',
        label: `${person.name} (${person.phone})`,
        value: person,
        checked: false
      })),
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Partager',
          handler: (selectedPerson) => {
            if (selectedPerson) {
              this.sendOrderToDelivery(order, selectedPerson);
            }
          }
        }
      ],
      cssClass: 'delivery-selection-alert'
    });

    await alert.present();
  }

  private sendOrderToDelivery(order: Order, deliveryPerson: any) {
    // URL de consultation de la commande pour le livreur
    const orderUrl = `${window.location.origin}/delivery/order/${order.order_number}`;
    
    let message = `🚚 Nouvelle livraison à effectuer\n\n`;
    message += `📋 Commande: ${order.order_number}\n`;
    message += `💰 Montant: ${this.formatPrice(order.total_amount)}\n\n`;
    
    if (order.customer_location_lat && order.customer_location_lng) {
      const googleMapsUrl = `https://maps.google.com/?q=${order.customer_location_lat},${order.customer_location_lng}&mode=driving`;
      message += `📍 Localisation client: ${googleMapsUrl}\n\n`;
    }
    
    message += `📱 Lien de gestion:\n${orderUrl}\n\n`;
    message += `⚠️ Instructions:\n`;
    message += `• Demandez le code de validation au client\n`;
    message += `• Cliquez sur le lien pour marquer comme livré\n\n`;
    message += `🤖 Envoyé depuis BeleyaShop Admin`;

    // Encoder le message pour WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${deliveryPerson.phone}?text=${encodedMessage}`;
    
    // Ouvrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    this.showToast(`Commande partagée avec ${deliveryPerson.name}`, 'success');
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

  goToMigration() {
    this.router.navigate(['/admin/migration']);
  }
}