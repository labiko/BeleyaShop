import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthAdminService, AdminUser } from '../../services/auth-admin.service';
import { VersionService } from '../../services/version.service';
import { UpdateDetectionService, VersionInfo } from '../../services/update-detection.service';

@Component({
  selector: 'app-admin-tabs',
  templateUrl: './admin-tabs.page.html',
  styleUrls: ['./admin-tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AdminTabsPage implements OnInit, OnDestroy {
  private authAdminService = inject(AuthAdminService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private versionService = inject(VersionService);
  private updateDetectionService = inject(UpdateDetectionService);

  currentUser: AdminUser | null = null;
  private userSubscription?: Subscription;
  private updateAvailableSubscription?: Subscription;
  private newVersionSubscription?: Subscription;
  appVersion = this.versionService.getVersion();
  
  // Update detection
  updateAvailable: boolean = false;
  newVersionInfo: VersionInfo | null = null;

  ngOnInit() {
    // S'abonner aux changements d'état d'authentification
    this.userSubscription = this.authAdminService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      // Si l'utilisateur n'est pas authentifié, rediriger vers login
      if (!user || !user.isAuthenticated) {
        this.router.navigate(['/admin/login']);
      } else {
        // Initialiser le système de mise à jour seulement si authentifié
        this.initializeUpdateDetection();
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.updateAvailableSubscription) {
      this.updateAvailableSubscription.unsubscribe();
    }
    if (this.newVersionSubscription) {
      this.newVersionSubscription.unsubscribe();
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

  // Update Detection Methods
  private initializeUpdateDetection() {
    console.log('🔄 Initialisation du système de mise à jour côté admin...');
    
    // Initialiser le service de détection
    this.updateDetectionService.initializeOnPage();
    
    // S'abonner aux notifications de mise à jour
    this.updateAvailableSubscription = this.updateDetectionService.updateAvailable$.subscribe(
      (available) => {
        this.updateAvailable = available;
        console.log('🛠️ Admin - Mise à jour disponible:', available);
      }
    );

    this.newVersionSubscription = this.updateDetectionService.newVersionInfo$.subscribe(
      (versionInfo) => {
        this.newVersionInfo = versionInfo;
        console.log('📦 Admin - Nouvelle version:', versionInfo);
      }
    );
  }

  // Méthode pour vérifier manuellement les mises à jour
  async checkForUpdates() {
    const toast = await this.toastController.create({
      message: '🔍 Vérification des mises à jour...',
      duration: 1500,
      position: 'top',
      color: 'primary'
    });
    await toast.present();
    
    await this.updateDetectionService.manualCheckForUpdates();
  }
}