import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, LoadingController, ToastController, ActionSheetController } from '@ionic/angular';
import { Product } from '../../../models/product';
import { SupabaseService } from '../../../services/supabase.service';
import { ImageResizeService } from '../../../services/image-resize.service';

@Component({
  selector: 'app-admin-product-modal',
  templateUrl: './admin-product-modal.component.html',
  styleUrls: ['./admin-product-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminProductModalComponent implements OnInit {
  private modalController = inject(ModalController);
  private supabaseService = inject(SupabaseService);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);
  private imageResizeService = inject(ImageResizeService);
  private actionSheetController = inject(ActionSheetController);

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

  categories: any[] = [];
  selectedCategoryLabel = 'Sélectionnez une catégorie';

  isSubmitting = false;
  isUploading = false;
  uploadProgress = 0;

  async ngOnInit() {
    await this.loadCategories();
    
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
      
      // Set selected category label
      const selectedCat = this.categories.find(cat => cat.name === this.product?.category);
      this.selectedCategoryLabel = selectedCat ? selectedCat.name : 'Sélectionnez une catégorie';
    }

    // Initialize with default image if no image set
    if (!this.formData.image) {
      this.formData.image = this.getDefaultImage();
    }
  }

  async loadCategories() {
    try {
      this.categories = await this.supabaseService.getCategories();
      if (!this.categories || this.categories.length === 0) {
        this.categories = [
          { name: 'Soins du visage', description: 'Crèmes, sérums, masques pour le visage', icon: 'face-outline' },
          { name: 'Maquillage', description: 'Rouge à lèvres, fond de teint, mascara', icon: 'brush-outline' },
          { name: 'Parfums', description: 'Eaux de parfum, eaux de toilette', icon: 'flower-outline' }
        ];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      this.categories = [
        { name: 'Soins du visage', description: 'Crèmes, sérums, masques pour le visage', icon: 'face-outline' },
        { name: 'Maquillage', description: 'Rouge à lèvres, fond de teint, mascara', icon: 'brush-outline' },
        { name: 'Parfums', description: 'Eaux de parfum, eaux de toilette', icon: 'flower-outline' }
      ];
    }
  }

  async selectCategory() {
    const buttons: any[] = this.categories.map(category => ({
      text: category.name,
      icon: category.icon || 'cube-outline',
      handler: () => {
        this.formData.category = category.name;
        this.selectedCategoryLabel = category.name;
        this.onCategorySelected();
      }
    }));

    buttons.push({
      text: 'Annuler',
      icon: 'close',
      role: 'cancel',
      handler: () => {
        console.log('Annulé');
      }
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Sélectionnez une catégorie',
      cssClass: 'category-action-sheet',
      buttons: buttons
    });

    await actionSheet.present();
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
      in_stock: this.formData.in_stock && this.formData.stock_quantity > 0,
      three_day_delivery_eligible: this.formData.three_day_delivery_eligible
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
      in_stock: this.formData.in_stock && this.formData.stock_quantity > 0,
      three_day_delivery_eligible: this.formData.three_day_delivery_eligible
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
    // Utiliser une image de produit existant aléatoire
    const productImages = [
      'https://i.ibb.co/NSkPYLZ/beure.jpg',
      'https://i.ibb.co/VVgJ1Nh/creme.jpg',
      'https://i.ibb.co/m0FQNyt/fond.png',
      'https://i.ibb.co/YhcGzSC/gel2.png',
      'https://i.ibb.co/Gx8cBJm/gel3.jpg',
      'https://i.ibb.co/LJXzYym/huile.jpg',
      'https://i.ibb.co/RpCdmDV/lotion.jpg',
      'https://i.ibb.co/kSq3dXR/mascara1.jpg',
      'https://i.ibb.co/BzY0nGN/mascara2.jpg',
      'https://i.ibb.co/w4j3K2j/nivea.jpg',
      'https://i.ibb.co/KqJg4K1/parfum1.jpg',
      'https://i.ibb.co/b5bxBt2/savon.jpg',
      'https://i.ibb.co/7n4N8mD/serume.jpg'
    ];
    
    // Sélectionner une image aléatoire
    const randomIndex = Math.floor(Math.random() * productImages.length);
    return productImages[randomIndex];
  }

  onStockChange() {
    // Automatiquement mettre à jour in_stock selon le stock
    this.formData.in_stock = this.formData.stock_quantity > 0;
  }

  onCategorySelected() {
    // Si aucune image n'est définie, utiliser l'image par défaut de la catégorie
    if (!this.formData.image.trim()) {
      this.formData.image = this.getDefaultImage();
    }
  }

  cancel() {
    this.modalController.dismiss({ success: false });
  }

  private async showToast(message: string, color: string, duration: number = 3000) {
    const toast = await this.toastController.create({
      message,
      duration,
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

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du fichier
    if (!this.validateFile(file)) {
      return;
    }

    try {
      // Afficher les informations de l'image originale
      const originalInfo = await this.imageResizeService.getImageInfo(file);
      console.log('Image originale:', {
        size: `${(originalInfo.size / (1024 * 1024)).toFixed(2)} MB`,
        dimensions: `${originalInfo.width}x${originalInfo.height}px`
      });

      // Redimensionner automatiquement l'image
      const loading = await this.loadingController.create({
        message: 'Redimensionnement de l\'image...',
        spinner: 'crescent'
      });
      await loading.present();

      const resizedFile = await this.imageResizeService.resizeWithPreset(file, 'PRODUCT_IMAGE');
      
      // Informations sur l'image redimensionnée
      const resizedInfo = await this.imageResizeService.getImageInfo(resizedFile);
      console.log('Image redimensionnée:', {
        size: `${(resizedInfo.size / (1024 * 1024)).toFixed(2)} MB`,
        dimensions: `${resizedInfo.width}x${resizedInfo.height}px`
      });

      await loading.dismiss();

      // Afficher un message de succès avec les détails
      const compressionRatio = ((originalInfo.size - resizedInfo.size) / originalInfo.size * 100).toFixed(1);
      this.showToast(
        `📸 Image optimisée ! Taille réduite de ${compressionRatio}% (${(originalInfo.size / (1024 * 1024)).toFixed(1)}MB → ${(resizedInfo.size / (1024 * 1024)).toFixed(1)}MB)`,
        'success',
        4000
      );

      this.uploadImage(resizedFile);
    } catch (error) {
      console.error('Erreur lors du redimensionnement:', error);
      this.showToast('Erreur lors du redimensionnement. Upload de l\'image originale...', 'warning');
      
      // En cas d'erreur, utiliser l'image originale
      this.uploadImage(file);
    }
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