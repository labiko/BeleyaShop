import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthAdminService, AdminUser } from '../../services/auth-admin.service';

@Component({
  selector: 'app-admin-tabs',
  templateUrl: './admin-tabs.page.html',
  styleUrls: ['./admin-tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AdminTabsPage implements OnInit, OnDestroy {
  currentUser: AdminUser | null = null;
  private userSubscription?: Subscription;

  constructor(
    private authAdminService: AuthAdminService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // S'abonner aux changements d'état d'authentification
    this.userSubscription = this.authAdminService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      // Si l'utilisateur n'est pas authentifié, rediriger vers login
      if (!user || !user.isAuthenticated) {
        this.router.navigate(['/admin/login']);
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async onLogout() {
    const alert = await this.alertController.create({
      header: '🚪 Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter de l\'administration ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Se déconnecter',
          cssClass: 'danger',
          handler: () => {
            this.performLogout();
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  private async performLogout() {
    this.authAdminService.logout();
    
    const toast = await this.toastController.create({
      message: '👋 Déconnexion réussie. À bientôt !',
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    await toast.present();

    // La redirection sera automatique grâce au subscription
  }

  // Méthode pour rafraîchir les données
  async refreshData() {
    const toast = await this.toastController.create({
      message: '🔄 Données actualisées',
      duration: 1500,
      position: 'top',
      color: 'primary'
    });
    await toast.present();
    
    // Émettre un événement pour indiquer aux composants enfants de se rafraîchir
    window.dispatchEvent(new CustomEvent('admin-refresh'));
  }
}