import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order';

interface DeliveryPersonnel {
  id: number;
  name: string;
  phone: string;
  deliveredOrders: Order[];
  totalDeliveries: number;
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

  // Liste statique des livreurs (peut être déplacée vers un service/base de données plus tard)
  private personnelList = [
    { id: 1, name: 'Mamadou Diallo', phone: '33620951645' },
    { id: 2, name: 'Amadou Barry', phone: '33123456789' },
    { id: 3, name: 'Ibrahima Sow', phone: '33987654321' }
  ];

  constructor(private orderService: OrderService) {}

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
        // Pour cette démonstration, nous distribuons les commandes de manière équitable
        // En production, cette information devrait être stockée en base de données
        const startIndex = person.id - 1;
        const personnelOrders = deliveredOrders.filter((_, index) => index % this.personnelList.length === startIndex);
        
        return {
          ...person,
          deliveredOrders: personnelOrders,
          totalDeliveries: personnelOrders.length
        };
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
}