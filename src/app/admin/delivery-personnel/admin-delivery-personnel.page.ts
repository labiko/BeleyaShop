import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { OrderService } from '../../services/order.service';
import { InvoiceService, InvoiceData } from '../../services/invoice.service';
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
  private readonly PAYMENTS_STORAGE_KEY = 'delivery_payments';
  
  // Stockage local des livreurs
  private personnelList: Array<{id: number, name: string, phone: string}> = [];
  private readonly PERSONNEL_STORAGE_KEY = 'delivery_personnel';

  // Liste par défaut des livreurs (sera fusionnée avec ceux en localStorage)
  private defaultPersonnelList = [
    { id: 1, name: 'Mamadou Diallo', phone: '620951645' },
    { id: 2, name: 'Amadou Barry', phone: '123456789' },
    { id: 3, name: 'Ibrahima Sow', phone: '987654321' }
  ];

  constructor(
    private orderService: OrderService,
    private alertController: AlertController,
    private toastController: ToastController,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit() {
    this.loadPaymentsFromStorage();
    this.loadPersonnelFromStorage();
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
          .filter(payment => {
            // Vérifier d'abord si la commande est dans les commandes de ce livreur
            const orderInPersonnelList = personnelOrders.some(o => o.id === payment.order.id);
            // Ou utiliser la fonction getPersonnelIdForOrder en fallback
            const calculatedPersonnelId = this.getPersonnelIdForOrder(payment.order);
            return orderInPersonnelList || calculatedPersonnelId === person.id;
          });
        
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
        console.log(`${personnel.name}: ${personnel.totalDeliveries} commandes, ${personnel.paidOrders.length} paiements`);
        personnel.deliveredOrders.forEach((order, index) => {
          const isPaid = this.isOrderPaid(order);
          console.log(`  - ${order.order_number || 'Commande #' + order.id} (Code: ${order.delivery_code}) ${isPaid ? '[PAYÉ]' : '[NON PAYÉ]'}`);
        });
        personnel.paidOrders.forEach((payment, index) => {
          console.log(`  💰 Paiement: ${payment.order.order_number || '#' + payment.order.id} - ${payment.paidAmount} GNF`);
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
    if (phone.length === 9) {
      return `+33 ${phone.slice(0, 1)} ${phone.slice(1, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 7)} ${phone.slice(7)}`;
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
    // Vérifier si cette commande a un paiement associé peu importe le livreur
    const hasPayment = Array.from(this.payments.values()).some(payment => payment.order.id === order.id);
    
    // Debug pour vérifier
    if (hasPayment) {
      console.log(`Commande ${order.order_number || '#' + order.id} est marquée comme payée`);
    }
    
    return hasPayment;
  }

  getUnpaidOrdersCount(personnel: DeliveryPersonnel): number {
    return personnel.deliveredOrders.filter(order => !this.isOrderPaid(order)).length;
  }

  async payOrder(order: Order, personnelId: number) {
    const alert = await this.alertController.create({
      header: '💰 Payer le livreur',
      message: `Saisir le montant à payer pour la commande ${order.order_number || '#' + order.id}`,
      cssClass: 'payment-modal',
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
    
    // Sauvegarder dans localStorage
    this.savePaymentsToStorage();
    
    // Debug: Afficher les informations de paiement
    console.log('=== Paiement enregistré ===');
    console.log(`Commande: ${order.order_number || '#' + order.id}`);
    console.log(`Livreur ID: ${personnelId}`);
    console.log(`Montant: ${amount} GNF`);
    console.log(`Clé paiement: ${paymentKey}`);
    console.log('Tous les paiements:', Array.from(this.payments.entries()));
    
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

  // Méthodes de persistance localStorage
  private loadPaymentsFromStorage() {
    try {
      const storedPayments = localStorage.getItem(this.PAYMENTS_STORAGE_KEY);
      if (storedPayments) {
        const paymentsArray = JSON.parse(storedPayments);
        this.payments = new Map(paymentsArray);
        console.log('Paiements chargés depuis localStorage:', this.payments.size, 'paiements');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paiements depuis localStorage:', error);
      this.payments = new Map();
    }
  }

  private savePaymentsToStorage() {
    try {
      const paymentsArray = Array.from(this.payments.entries());
      localStorage.setItem(this.PAYMENTS_STORAGE_KEY, JSON.stringify(paymentsArray));
      console.log('Paiements sauvegardés dans localStorage:', this.payments.size, 'paiements');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paiements dans localStorage:', error);
    }
  }

  async shareInvoice(payment: OrderPayment, personnelName: string) {
    try {
      const invoiceData: InvoiceData = {
        order: payment.order,
        paidAmount: payment.paidAmount,
        paidAt: payment.paidAt,
        paidBy: payment.paidBy,
        deliveryPersonName: personnelName
      };

      // Trouver le livreur pour récupérer son numéro de téléphone
      const personnel = this.deliveryPersonnels.find(p => p.name === personnelName);
      
      if (personnel?.phone) {
        await this.invoiceService.shareInvoiceToWhatsApp(invoiceData, personnel.phone);
        await this.showToast('Facture envoyée sur WhatsApp', 'success');
      } else {
        await this.invoiceService.shareInvoice(invoiceData);
        await this.showToast('Facture partagée avec succès', 'success');
      }
    } catch (error) {
      console.error('Erreur lors du partage de la facture:', error);
      await this.showToast('Erreur lors du partage de la facture', 'danger');
    }
  }

  async addNewDeliveryPerson() {
    const alert = await this.alertController.create({
      header: '👨‍💼 Ajouter un nouveau livreur',
      cssClass: 'custom-alert',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nom complet du livreur',
          attributes: {
            maxlength: 50
          }
        },
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Numéro de téléphone (9 chiffres)',
          attributes: {
            maxlength: 9,
            pattern: '[0-9]*'
          }
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Ajouter',
          handler: (data) => {
            if (data.name && data.phone) {
              const name = data.name.trim();
              const phone = data.phone.trim();
              
              if (name.length > 0 && phone.length === 9) {
                this.createNewDeliveryPerson(name, phone);
                return true;
              } else {
                if (name.length === 0) {
                  this.showToast('Le nom complet est obligatoire', 'warning');
                } else if (phone.length !== 9) {
                  this.showToast('Le numéro de téléphone doit contenir exactement 9 chiffres', 'warning');
                }
                return false;
              }
            } else {
              this.showToast('Veuillez remplir tous les champs', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async createNewDeliveryPerson(name: string, phone: string) {
    try {
      // Générer un nouvel ID
      const newId = Math.max(...this.personnelList.map(p => p.id)) + 1;
      
      // Vérifier si le numéro de téléphone n'existe pas déjà
      const existingPersonnel = this.personnelList.find(p => p.phone === phone);
      if (existingPersonnel) {
        await this.showToast('Ce numéro de téléphone est déjà utilisé par un autre livreur', 'warning');
        return;
      }

      // Ajouter le nouveau livreur à la liste
      const newPersonnel = {
        id: newId,
        name: name,
        phone: phone
      };
      
      this.personnelList.push(newPersonnel);
      
      // Sauvegarder en localStorage
      this.savePersonnelToStorage();
      
      // Recharger les données pour afficher le nouveau livreur
      await this.loadDeliveryPersonnels();
      
      await this.showToast(`Livreur ${name} ajouté avec succès`, 'success');
      
      console.log('Nouveau livreur ajouté:', newPersonnel);
    } catch (error) {
      console.error('Erreur lors de la création du livreur:', error);
      await this.showToast('Erreur lors de la création du livreur', 'danger');
    }
  }

  async deleteDeliveryPerson(personnel: DeliveryPersonnel) {
    // Vérifier si le livreur fait partie de la liste par défaut
    const isDefaultPersonnel = this.defaultPersonnelList.some(p => p.id === personnel.id);
    
    if (isDefaultPersonnel) {
      await this.showToast('Les livreurs par défaut ne peuvent pas être supprimés', 'warning');
      return;
    }

    // Vérifier si le livreur a des commandes non payées
    const unpaidOrders = personnel.deliveredOrders.filter(order => !this.isOrderPaid(order));
    if (unpaidOrders.length > 0) {
      await this.showToast(`Ce livreur a ${unpaidOrders.length} commande(s) non payée(s). Veuillez d'abord régler ces commandes.`, 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le livreur ${personnel.name} ?`,
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Supprimer',
          cssClass: 'alert-button-confirm',
          handler: async () => {
            try {
              // Supprimer le livreur de la liste
              this.personnelList = this.personnelList.filter(p => p.id !== personnel.id);
              
              // Sauvegarder en localStorage
              this.savePersonnelToStorage();
              
              // Recharger les données
              await this.loadDeliveryPersonnels();
              
              await this.showToast(`Livreur ${personnel.name} supprimé avec succès`, 'success');
              
              console.log('Livreur supprimé:', personnel);
            } catch (error) {
              console.error('Erreur lors de la suppression du livreur:', error);
              await this.showToast('Erreur lors de la suppression du livreur', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Méthodes de persistance localStorage pour les livreurs
  private loadPersonnelFromStorage() {
    try {
      const storedPersonnel = localStorage.getItem(this.PERSONNEL_STORAGE_KEY);
      if (storedPersonnel) {
        const parsedPersonnel = JSON.parse(storedPersonnel);
        
        // Fusionner avec la liste par défaut, en évitant les doublons
        const mergedPersonnel = [...this.defaultPersonnelList];
        
        parsedPersonnel.forEach((stored: any) => {
          // Vérifier si ce livreur n'existe pas déjà (par ID ou téléphone)
          const existsById = mergedPersonnel.some(p => p.id === stored.id);
          const existsByPhone = mergedPersonnel.some(p => p.phone === stored.phone);
          
          if (!existsById && !existsByPhone) {
            mergedPersonnel.push(stored);
          } else if (existsById) {
            // Mettre à jour les informations si l'ID existe déjà
            const index = mergedPersonnel.findIndex(p => p.id === stored.id);
            if (index !== -1) {
              mergedPersonnel[index] = stored;
            }
          }
        });
        
        this.personnelList = mergedPersonnel;
        console.log('Livreurs chargés depuis localStorage:', this.personnelList.length, 'livreurs');
      } else {
        // Première utilisation, utiliser la liste par défaut
        this.personnelList = [...this.defaultPersonnelList];
        this.savePersonnelToStorage();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs depuis localStorage:', error);
      this.personnelList = [...this.defaultPersonnelList];
    }
  }

  private savePersonnelToStorage() {
    try {
      localStorage.setItem(this.PERSONNEL_STORAGE_KEY, JSON.stringify(this.personnelList));
      console.log('Livreurs sauvegardés dans localStorage:', this.personnelList.length, 'livreurs');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des livreurs dans localStorage:', error);
    }
  }
}