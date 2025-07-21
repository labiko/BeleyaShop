import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
  private productService = inject(ProductService);
  private supabaseService = inject(SupabaseService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);
  private loadingController = inject(LoadingController);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: any[] = [];
  isLoading = false;
  searchTerm = '';
  selectedCategory = 'all';
  
  private productsSubscription?: Subscription;

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
    
    // Écouter l'événement de rafraîchissement
    window.addEventListener('admin-refresh', () => {
      this.loadProducts();
    });
  }

  async loadCategories() {
    try {
      this.categories = await this.supabaseService.getCategories();
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      // En cas d'erreur, utiliser les catégories par défaut
      this.categories = [
        { name: 'Soins du visage', icon: 'face-outline' },
        { name: 'Maquillage', icon: 'brush-outline' },
        { name: 'Parfums', icon: 'flower-outline' }
      ];
    }
  }

  ngOnDestroy() {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }

  async loadProducts() {
    this.isLoading = true;
    
    try {
      this.productsSubscription = this.productService.getAllProductsForAdmin().subscribe({
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
      message: `Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?\n\nCette action est irréversible.`,
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

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category?.icon || 'cube-outline';
  }

  getCategoryColor(categoryName: string): string {
    // Assigner des couleurs basées sur l'index de la catégorie
    const index = this.categories.findIndex(cat => cat.name === categoryName);
    const colors = ['success', 'primary', 'secondary', 'tertiary', 'warning', 'danger'];
    return colors[index % colors.length] || 'medium';
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