import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ModalController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { SupabaseService } from '../../services/supabase.service';
import { AdminProductModalComponent } from './admin-product-modal/admin-product-modal.component';

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.page.html',
  styleUrls: ['./admin-products.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminProductsPage implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = false;
  searchTerm = '';
  selectedCategory = 'all';
  
  private productsSubscription?: Subscription;

  constructor(
    private productService: ProductService,
    private supabaseService: SupabaseService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadProducts();
    
    // Écouter l'événement de rafraîchissement
    window.addEventListener('admin-refresh', () => {
      this.loadProducts();
    });
  }

  ngOnDestroy() {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }

  async loadProducts() {
    this.isLoading = true;
    
    try {
      this.productsSubscription = this.productService.getAllProducts().subscribe({
        next: (products) => {
          this.products = products;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.showToast('Erreur lors du chargement des produits', 'danger');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      this.showToast('Erreur lors du chargement des produits', 'danger');
      this.isLoading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.products];

    // Filtre par catégorie
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    }

    this.filteredProducts = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onCategoryChange() {
    this.applyFilters();
  }

  async addProduct() {
    const modal = await this.modalController.create({
      component: AdminProductModalComponent,
      componentProps: {
        mode: 'add',
        product: null
      },
      cssClass: 'product-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success) {
        this.loadProducts();
        this.showToast('Produit ajouté avec succès', 'success');
      }
    });

    return await modal.present();
  }

  async editProduct(product: Product) {
    const modal = await this.modalController.create({
      component: AdminProductModalComponent,
      componentProps: {
        mode: 'edit',
        product: { ...product }
      },
      cssClass: 'product-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success) {
        this.loadProducts();
        this.showToast('Produit modifié avec succès', 'success');
      }
    });

    return await modal.present();
  }

  async deleteProduct(product: Product) {
    const alert = await this.alertController.create({
      header: '🗑️ Supprimer le produit',
      message: `Êtes-vous sûr de vouloir supprimer le produit "<strong>${product.name}</strong>" ?<br><br>Cette action est <strong>irréversible</strong>.`,
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
            this.performDelete(product);
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  private async performDelete(product: Product) {
    const loading = await this.loadingController.create({
      message: 'Suppression en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.supabaseService.deleteProduct(product.id);
      await loading.dismiss();
      this.loadProducts();
      this.showToast(`Produit "${product.name}" supprimé`, 'success');
    } catch (error) {
      await loading.dismiss();
      console.error('Erreur lors de la suppression:', error);
      this.showToast('Erreur lors de la suppression du produit', 'danger');
    }
  }

  async refreshProducts(event: any) {
    await this.loadProducts();
    event.target.complete();
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString()} GNF`;
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'cremes': return 'medical';
      case 'gels': return 'water';
      case 'parfums': return 'flower';
      default: return 'cube';
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'cremes': return 'success';
      case 'gels': return 'primary';
      case 'parfums': return 'secondary';
      default: return 'medium';
    }
  }

  getStockStatus(product: Product): { color: string; text: string; icon: string } {
    if (product.stock_quantity <= 0) {
      return { color: 'danger', text: 'Rupture', icon: 'alert-circle' };
    } else if (product.stock_quantity <= 10) {
      return { color: 'warning', text: 'Stock faible', icon: 'warning' };
    } else {
      return { color: 'success', text: 'En stock', icon: 'checkmark-circle' };
    }
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  onImageError(event: any) {
    const img = event.target;
    if (!img.hasAttribute('data-error-handled')) {
      img.setAttribute('data-error-handled', 'true');
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmOWZhZmIiLz48L3N2Zz4=';
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