import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order';

interface DeliveryPersonnel {
  id: number;
  name: string;
  phone: string;
  deliveredOrders: Order[];
  totalDeliveries: number;
  paidOrders: OrderPayment[];
  totalPaid: number;
}

interface OrderPayment {
  order: Order;
  paidAmount: number;
  paidAt: string;
  paidBy: string;
}

@Component({
  selector: 'app-admin-delivery-personnel',
  templateUrl: './admin-delivery-personnel.page.html',
  styleUrls: ['./admin-delivery-personnel.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminDeliveryPersonnelPage implements OnInit {
  deliveryPersonnels: DeliveryPersonnel[] = [];
  isLoading = false;
  expandedPersonnelId: number | null = null;
  selectedTab: 'deliveries' | 'payments' = 'deliveries';
  
  // Stockage local des paiements (en production, cela devrait être en base de données)
  private payments: Map<string, OrderPayment> = new Map();

  // Liste statique des livreurs (peut être déplacée vers un service/base de données plus tard)
  private personnelList = [
    { id: 1, name: 'Mamadou Diallo', phone: '33620951645' },
    { id: 2, name: 'Amadou Barry', phone: '33123456789' },
    { id: 3, name: 'Ibrahima Sow', phone: '33987654321' }
  ];

  constructor(
    private orderService: OrderService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadDeliveryPersonnels();
    
    // Écouter l'événement de rafraîchissement
    window.addEventListener('admin-refresh', () => {
      this.loadDeliveryPersonnels();
    });
  }

  async loadDeliveryPersonnels() {
    this.isLoading = true;
    
    try {
      // Récupérer toutes les commandes livrées
      const allOrders = await this.orderService.getAllOrders();
      const deliveredOrders = allOrders.filter(order => order.status === 'delivered' && order.delivered_at);

      // Créer la structure des livreurs avec leurs commandes
      this.deliveryPersonnels = this.personnelList.map(person => {
        // Distribution plus équitable et réaliste des commandes
        let personnelOrders: Order[] = [];
        
        if (deliveredOrders.length > 0) {
          // Distribution simple et prévisible
          const totalOrders = deliveredOrders.length;
          
          if (person.id === 1) { // Mamadou Diallo - le plus actif
            // Prend 60% des commandes (au minimum 2 si il y en a plus de 1)
            const startIndex = 0;
            const endIndex = Math.max(Math.ceil(totalOrders * 0.6), Math.min(2, totalOrders));
            personnelOrders = deliveredOrders.slice(startIndex, endIndex);
          } else if (person.id === 2) { // Amadou Barry
            // Prend 25% des commandes
            const startIndex = Math.ceil(totalOrders * 0.6);
            const endIndex = Math.ceil(totalOrders * 0.85);
            personnelOrders = deliveredOrders.slice(startIndex, endIndex);
          } else if (person.id === 3) { // Ibrahima Sow
            // Prend le reste (15%)
            const startIndex = Math.ceil(totalOrders * 0.85);
            personnelOrders = deliveredOrders.slice(startIndex);
          }
        }
        
        // Récupérer les paiements pour ce livreur
        const personnelPaidOrders = Array.from(this.payments.values())
          .filter(payment => this.getPersonnelIdForOrder(payment.order) === person.id);
        
        const totalPaid = personnelPaidOrders.reduce((sum, payment) => sum + payment.paidAmount, 0);
        
        return {
          ...person,
          deliveredOrders: personnelOrders,
          totalDeliveries: personnelOrders.length,
          paidOrders: personnelPaidOrders,
          totalPaid: totalPaid
        };
      });

      // Debug: Afficher la distribution des commandes
      console.log('=== Distribution des commandes livrées ===');
      console.log(`Total commandes livrées: ${deliveredOrders.length}`);
      this.deliveryPersonnels.forEach(personnel => {
        console.log(`${personnel.name}: ${personnel.totalDeliveries} commandes`);
        personnel.deliveredOrders.forEach((order, index) => {
          console.log(`  - ${order.order_number || 'Commande #' + order.id} (Code: ${order.delivery_code})`);
        });
      });

    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
    } finally {
      this.isLoading = false;
    }
  }

  togglePersonnelExpansion(personnelId: number) {
    this.expandedPersonnelId = this.expandedPersonnelId === personnelId ? null : personnelId;
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

  formatPhone(phone: string): string {
    // Formatter le numéro de téléphone pour l'affichage
    if (phone.length === 11 && phone.startsWith('33')) {
      return `+${phone.slice(0, 2)} ${phone.slice(2, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 7)} ${phone.slice(7, 9)} ${phone.slice(9)}`;
    }
    return phone;
  }

  openGoogleMaps(lat: number, lng: number) {
    const url = `https://maps.google.com/?q=${lat},${lng}&mode=driving`;
    window.open(url, '_blank');
  }

  async refreshData(event: any) {
    await this.loadDeliveryPersonnels();
    event.target.complete();
  }

  getTotalDeliveries(): number {
    return this.deliveryPersonnels.reduce((total, personnel) => total + personnel.totalDeliveries, 0);
  }

  getTotalPaid(): number {
    return this.deliveryPersonnels.reduce((total, personnel) => total + personnel.totalPaid, 0);
  }

  getPersonnelIdForOrder(order: Order): number {
    // D'abord, chercher dans les listes actuelles
    for (const personnel of this.deliveryPersonnels) {
      if (personnel.deliveredOrders.some(o => o.id === order.id)) {
        return personnel.id;
      }
    }
    
    // Si pas trouvé, utiliser la même logique de distribution que dans loadDeliveryPersonnels
    // Simuler l'index de cette commande dans la liste triée
    const allDeliveredOrders = this.deliveryPersonnels.flatMap(p => p.deliveredOrders);
    const sortedOrders = [...allDeliveredOrders].sort((a, b) => (a.id || 0) - (b.id || 0));
    const orderIndex = sortedOrders.findIndex(o => o.id === order.id);
    
    if (orderIndex !== -1) {
      const totalOrders = sortedOrders.length;
      const mamadouEnd = Math.max(Math.ceil(totalOrders * 0.6), Math.min(2, totalOrders));
      const amadouEnd = Math.ceil(totalOrders * 0.85);
      
      if (orderIndex < mamadouEnd) return 1; // Mamadou Diallo
      if (orderIndex < amadouEnd) return 2;  // Amadou Barry
      return 3; // Ibrahima Sow
    }
    
    // Fallback par défaut
    return 1; // Mamadou Diallo par défaut
  }

  selectTab(tab: 'deliveries' | 'payments') {
    this.selectedTab = tab;
  }

  onTabChange(event: any) {
    const value = event.detail.value;
    if (value === 'deliveries' || value === 'payments') {
      this.selectTab(value);
    }
  }

  isOrderPaid(order: Order): boolean {
    const paymentKey = `${order.id}_${this.getPersonnelIdForOrder(order)}`;
    return this.payments.has(paymentKey);
  }

  async payOrder(order: Order, personnelId: number) {
    const alert = await this.alertController.create({
      header: '💰 Payer le livreur',
      message: `Saisir le montant à payer pour la commande ${order.order_number || '#' + order.id}`,
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Montant en GNF',
          min: 0,
          max: order.total_amount,
          value: Math.floor(order.total_amount * 0.1) // 10% par défaut
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Valider le paiement',
          handler: (data) => {
            const amount = parseFloat(data.amount);
            if (amount && amount > 0) {
              this.confirmPayment(order, personnelId, amount);
              return true;
            } else {
              this.showToast('Veuillez saisir un montant valide', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmPayment(order: Order, personnelId: number, amount: number) {
    const paymentKey = `${order.id}_${personnelId}`;
    const payment: OrderPayment = {
      order: order,
      paidAmount: amount,
      paidAt: new Date().toISOString(),
      paidBy: 'Admin' // En production, récupérer le nom de l'admin connecté
    };

    this.payments.set(paymentKey, payment);
    
    // Recharger les données pour mettre à jour l'affichage
    await this.loadDeliveryPersonnels();
    
    await this.showToast(`Paiement de ${this.formatPrice(amount)} enregistré`, 'success');
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