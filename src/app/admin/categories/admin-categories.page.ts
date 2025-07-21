import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { ProductService } from '../../services/product.service';

export interface Category {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
}

@Component({
  selector: 'app-admin-categories',
  templateUrl: './admin-categories.page.html',
  styleUrls: ['./admin-categories.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminCategoriesPage implements OnInit {
  private productService = inject(ProductService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  categories: Category[] = [];
  isLoading = false;
  searchTerm = '';
  filteredCategories: Category[] = [];

  // Categories par défaut avec icônes
  defaultCategories: Category[] = [
    { name: 'Soins du visage', description: 'Crèmes, sérums, masques pour le visage', icon: 'face-outline' },
    { name: 'Maquillage', description: 'Rouge à lèvres, fond de teint, mascara', icon: 'brush-outline' },
    { name: 'Soins capillaires', description: 'Shampoing, après-shampoing, masques', icon: 'cut-outline' },
    { name: 'Parfums', description: 'Eaux de parfum, eaux de toilette', icon: 'flower-outline' },
    { name: 'Soins du corps', description: 'Crèmes, gels douche, gommages', icon: 'body-outline' },
    { name: 'Solaires', description: 'Protection solaire, après-soleil', icon: 'sunny-outline' }
  ];

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    this.isLoading = true;
    try {
      // Pour l'instant, utilisons les catégories par défaut
      // Plus tard, on pourra les charger depuis la base de données
      this.categories = [...this.defaultCategories];
      this.filteredCategories = [...this.categories];
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      const toast = await this.toastController.create({
        message: '❌ Erreur lors du chargement des catégories',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = [...this.categories];
      return;
    }

    this.filteredCategories = this.categories.filter(category =>
      category.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  async onAddCategory() {
    const alert = await this.alertController.create({
      header: '➕ Nouvelle Catégorie',
      message: 'Ajoutez une nouvelle catégorie de produits',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nom de la catégorie',
          attributes: {
            maxlength: 50,
            required: true
          }
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optionnelle)',
          attributes: {
            maxlength: 200
          }
        },
        {
          name: 'icon',
          type: 'text',
          placeholder: 'Icône Ionicons (ex: cube-outline)',
          value: 'cube-outline'
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
            if (data.name && data.name.trim()) {
              this.addCategory({
                name: data.name.trim(),
                description: data.description?.trim() || '',
                icon: data.icon?.trim() || 'cube-outline'
              });
              return true;
            }
            return false;
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  async addCategory(category: Category) {
    try {
      // Vérifier si la catégorie existe déjà
      const exists = this.categories.find(c => 
        c.name.toLowerCase() === category.name.toLowerCase()
      );
      
      if (exists) {
        const toast = await this.toastController.create({
          message: '⚠️ Cette catégorie existe déjà',
          duration: 3000,
          color: 'warning'
        });
        await toast.present();
        return;
      }

      // Ajouter l'ID
      category.id = this.categories.length + 1;
      
      this.categories.push(category);
      this.onSearch(); // Refresh filtered list
      
      const toast = await this.toastController.create({
        message: `✅ Catégorie "${category.name}" ajoutée avec succès`,
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      const toast = await this.toastController.create({
        message: '❌ Erreur lors de l\'ajout de la catégorie',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async onEditCategory(category: Category) {
    const alert = await this.alertController.create({
      header: '✏️ Modifier Catégorie',
      message: `Modifier la catégorie "${category.name}"`,
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nom de la catégorie',
          value: category.name,
          attributes: {
            maxlength: 50,
            required: true
          }
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optionnelle)',
          value: category.description || '',
          attributes: {
            maxlength: 200
          }
        },
        {
          name: 'icon',
          type: 'text',
          placeholder: 'Icône Ionicons',
          value: category.icon || 'cube-outline'
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Modifier',
          handler: (data) => {
            if (data.name && data.name.trim()) {
              this.updateCategory(category, {
                name: data.name.trim(),
                description: data.description?.trim() || '',
                icon: data.icon?.trim() || 'cube-outline'
              });
              return true;
            }
            return false;
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  async updateCategory(originalCategory: Category, updatedData: Partial<Category>) {
    try {
      const index = this.categories.findIndex(c => c.id === originalCategory.id);
      if (index !== -1) {
        this.categories[index] = { ...originalCategory, ...updatedData };
        this.onSearch(); // Refresh filtered list
        
        const toast = await this.toastController.create({
          message: `✅ Catégorie "${updatedData.name}" modifiée avec succès`,
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la catégorie:', error);
      const toast = await this.toastController.create({
        message: '❌ Erreur lors de la modification de la catégorie',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async onDeleteCategory(category: Category) {
    const alert = await this.alertController.create({
      header: '🗑️ Supprimer Catégorie',
      message: `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?<br><br>⚠️ Cette action est irréversible.`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          cssClass: 'danger',
          handler: () => {
            this.deleteCategory(category);
          }
        }
      ],
      cssClass: 'custom-alert danger-alert'
    });

    await alert.present();
  }

  async deleteCategory(category: Category) {
    try {
      this.categories = this.categories.filter(c => c.id !== category.id);
      this.onSearch(); // Refresh filtered list
      
      const toast = await this.toastController.create({
        message: `🗑️ Catégorie "${category.name}" supprimée`,
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      const toast = await this.toastController.create({
        message: '❌ Erreur lors de la suppression de la catégorie',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  trackByCategory(index: number, category: Category): any {
    return category.id;
  }
}