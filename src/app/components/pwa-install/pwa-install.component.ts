import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-pwa-install',
  templateUrl: './pwa-install.component.html',
  styleUrls: ['./pwa-install.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PwaInstallComponent implements OnInit, OnDestroy {
  private pwaService = inject(PwaService);
  private toastController = inject(ToastController);

  showInstallButton = false;
  showIOSInstructions = false;
  isInstalling = false;
  installInstructions = '';
  private installSubscription?: Subscription;

  ngOnInit() {
    this.installSubscription = this.pwaService.isInstallable$.subscribe(isInstallable => {
      this.showInstallButton = isInstallable && !this.pwaService.isStandalone();
      
      // Show iOS instructions if on iOS Safari and app is not installed
      if (this.pwaService.isIOSDevice() && !this.pwaService.isStandalone()) {
        this.showIOSInstructions = true;
        this.installInstructions = this.pwaService.getInstallInstructions();
      }
    });
  }

  ngOnDestroy() {
    if (this.installSubscription) {
      this.installSubscription.unsubscribe();
    }
  }

  async installApp() {
    if (this.isInstalling) return;

    this.isInstalling = true;

    try {
      const installed = await this.pwaService.installPwa();
      
      if (installed) {
        const toast = await this.toastController.create({
          message: '🎉 BeleyaShop installé avec succès !',
          duration: 3000,
          position: 'top',
          color: 'success'
        });
        await toast.present();
        this.showInstallButton = false;
      } else {
        const toast = await this.toastController.create({
          message: 'Installation annulée',
          duration: 2000,
          position: 'top',
          color: 'warning'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      const toast = await this.toastController.create({
        message: 'Erreur lors de l\'installation',
        duration: 2000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isInstalling = false;
    }
  }
}