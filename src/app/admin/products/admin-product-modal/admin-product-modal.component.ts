import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, LoadingController, ToastController } from '@ionic/angular';
import { Product } from '../../../models/product';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-admin-product-modal',
  templateUrl: './admin-product-modal.component.html',
  styleUrls: ['./admin-product-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminProductModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() product: Product | null = null;

  formData = {
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    category: 'cremes' as 'cremes' | 'gels' | 'parfums',
    image: '',
    in_stock: true,
    three_day_delivery_eligible: false
  };

  categories = [
    { value: 'cremes', label: 'Crèmes', icon: 'medical' },
    { value: 'gels', label: 'Gels douche', icon: 'water' },
    { value: 'parfums', label: 'Parfums', icon: 'flower' }
  ];

  isSubmitting = false;
  isUploading = false;
  uploadProgress = 0;

  constructor(
    private modalController: ModalController,
    private supabaseService: SupabaseService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    if (this.mode === 'edit' && this.product) {
      this.formData = {
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        stock_quantity: this.product.stock_quantity,
        category: this.product.category,
        image: this.product.image,
        in_stock: this.product.inStock,
        three_day_delivery_eligible: this.product.three_day_delivery_eligible || false
      };
    }
  }

  get modalTitle(): string {
    return this.mode === 'add' ? 'Ajouter un produit' : 'Modifier le produit';
  }

  get submitButtonText(): string {
    return this.mode === 'add' ? 'Ajouter' : 'Modifier';
  }

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingController.create({
      message: this.mode === 'add' ? 'Ajout en cours...' : 'Modification en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      if (this.mode === 'add') {
        await this.addProduct();
      } else {
        await this.updateProduct();
      }

      await loading.dismiss();
      this.modalController.dismiss({ success: true });
    } catch (error) {
      await loading.dismiss();
      console.error('Erreur lors de la soumission:', error);
      this.showToast('Erreur lors de l\'opération', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  private async addProduct() {
    const productData = {
      name: this.formData.name.trim(),
      description: this.formData.description.trim(),
      price: Number(this.formData.price),
      stock_quantity: Number(this.formData.stock_quantity),
      category: this.formData.category,
      image: this.formData.image.trim() || this.getDefaultImage(),
      in_stock: this.formData.in_stock && this.formData.stock_quantity > 0
    };

    await this.supabaseService.createProduct(productData);
  }

  private async updateProduct() {
    if (!this.product) return;

    const updates = {
      name: this.formData.name.trim(),
      description: this.formData.description.trim(),
      price: Number(this.formData.price),
      stock_quantity: Number(this.formData.stock_quantity),
      category: this.formData.category,
      image: this.formData.image.trim() || this.getDefaultImage(),
      in_stock: this.formData.in_stock && this.formData.stock_quantity > 0
    };

    await this.supabaseService.updateProduct(this.product.id, updates);
  }

  private validateForm(): boolean {
    if (!this.formData.name.trim()) {
      this.showToast('Le nom du produit est requis', 'warning');
      return false;
    }

    if (!this.formData.description.trim()) {
      this.showToast('La description est requise', 'warning');
      return false;
    }

    if (this.formData.price <= 0) {
      this.showToast('Le prix doit être supérieur à 0', 'warning');
      return false;
    }

    if (this.formData.stock_quantity < 0) {
      this.showToast('Le stock ne peut pas être négatif', 'warning');
      return false;
    }

    return true;
  }

  private getDefaultImage(): string {
    // Image par défaut selon la catégorie
    switch (this.formData.category) {
      case 'cremes':
        return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop&crop=center';
      case 'gels':
        return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center';
      case 'parfums':
        return 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&crop=center';
      default:
        return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop&crop=center';
    }
  }

  onStockChange() {
    // Automatiquement mettre à jour in_stock selon le stock
    this.formData.in_stock = this.formData.stock_quantity > 0;
  }

  onCategoryChange() {
    // Si aucune image n'est définie, utiliser l'image par défaut de la catégorie
    if (!this.formData.image.trim()) {
      this.formData.image = this.getDefaultImage();
    }
  }

  cancel() {
    this.modalController.dismiss({ success: false });
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

  // Méthodes pour l'upload d'image
  triggerFileInput() {
    if (this.isSubmitting || this.isUploading) return;
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du fichier
    if (!this.validateFile(file)) {
      return;
    }

    this.uploadImage(file);
  }

  private validateFile(file: File): boolean {
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      this.showToast('Veuillez sélectionner un fichier image', 'warning');
      return false;
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showToast('L\'image ne doit pas dépasser 5MB', 'warning');
      return false;
    }

    return true;
  }

  private async uploadImage(file: File) {
    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      // Simuler un upload progressif (remplacer par un vrai service d'upload)
      const reader = new FileReader();
      reader.onloadstart = () => this.uploadProgress = 10;
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          this.uploadProgress = 50 + (e.loaded / e.total) * 50;
        }
      };
      reader.onload = () => {
        this.uploadProgress = 100;
        this.formData.image = reader.result as string;
        setTimeout(() => {
          this.isUploading = false;
          this.uploadProgress = 0;
        }, 300);
      };
      reader.onerror = () => {
        this.isUploading = false;
        this.uploadProgress = 0;
        this.showToast('Erreur lors du chargement de l\'image', 'danger');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur upload:', error);
      this.isUploading = false;
      this.uploadProgress = 0;
      this.showToast('Erreur lors de l\'upload', 'danger');
    }
  }

  removeImage() {
    this.formData.image = '';
  }

  // Méthode pour prévisualiser l'image
  previewImage(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}