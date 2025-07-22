import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject, interval, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export interface VersionInfo {
  version: string;
  buildDate: string;
  buildId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UpdateDetectionService {
  private currentVersion: VersionInfo | null = null;
  private updateAvailable = new BehaviorSubject<boolean>(false);
  private newVersionInfo = new BehaviorSubject<VersionInfo | null>(null);
  
  public updateAvailable$ = this.updateAvailable.asObservable();
  public newVersionInfo$ = this.newVersionInfo.asObservable();

  constructor(private alertController: AlertController) {}

  // Méthode d'initialisation manuelle pour les pages spécifiques
  public async initializeOnPage(): Promise<void> {
    // Charger la version actuelle
    await this.loadCurrentVersion();
    
    // Commencer la vérification périodique
    this.startPeriodicCheck();
    
    // Vérification immédiate au démarrage
    setTimeout(() => this.checkForUpdates(), 2000);
  }

  private async loadCurrentVersion(): Promise<void> {
    try {
      const response = await fetch('/assets/version.json?t=' + Date.now());
      this.currentVersion = await response.json();
      console.log('🔧 Version actuelle chargée:', this.currentVersion);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la version actuelle:', error);
    }
  }

  private startPeriodicCheck(): void {
    // Vérifier toutes les 5 minutes
    interval(5 * 60 * 1000)
      .pipe(
        switchMap(() => this.checkForUpdates()),
        catchError((error) => {
          console.error('❌ Erreur lors de la vérification de mise à jour:', error);
          return of(null);
        })
      )
      .subscribe();
  }

  private async checkForUpdates(): Promise<boolean> {
    if (!this.currentVersion) {
      console.log('⚠️ Version actuelle non disponible, vérification ignorée');
      return false;
    }

    try {
      // Forcer le rechargement du fichier version.json depuis le serveur
      const response = await fetch('/assets/version.json?t=' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const remoteVersion: VersionInfo = await response.json();
      
      console.log('🔍 Vérification des versions:');
      console.log('  - Version actuelle:', this.currentVersion.version);
      console.log('  - Version distante:', remoteVersion.version);
      
      // Comparer les versions
      if (this.isNewerVersion(remoteVersion.version, this.currentVersion.version)) {
        console.log('🎉 Nouvelle version détectée!', remoteVersion.version);
        this.newVersionInfo.next(remoteVersion);
        this.updateAvailable.next(true);
        await this.showUpdateNotification(remoteVersion);
        return true;
      } else {
        console.log('✅ Application à jour');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de mise à jour:', error);
      return false;
    }
  }

  private isNewerVersion(remoteVersion: string, currentVersion: string): boolean {
    const remote = remoteVersion.split('.').map(num => parseInt(num, 10));
    const current = currentVersion.split('.').map(num => parseInt(num, 10));
    
    for (let i = 0; i < Math.max(remote.length, current.length); i++) {
      const r = remote[i] || 0;
      const c = current[i] || 0;
      
      if (r > c) return true;
      if (r < c) return false;
    }
    
    return false;
  }

  private async showUpdateNotification(newVersion: VersionInfo): Promise<void> {
    const alert = await this.alertController.create({
      cssClass: 'update-notification-modal',
      header: '🚀 Mise à jour disponible',
      message: `
        <div class="update-message">
          <p><strong>Une nouvelle version est disponible !</strong></p>
          <div class="version-info">
            <p>📱 Version actuelle: <strong>v${this.currentVersion?.version}</strong></p>
            <p>🆕 Nouvelle version: <strong>v${newVersion.version}</strong></p>
          </div>
          <p class="update-note">
            Cliquez sur "Mettre à jour" pour appliquer la nouvelle version.
            L'application se rechargera automatiquement.
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Plus tard',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
          handler: () => {
            console.log('🕒 Mise à jour reportée');
            // Remettre la notification dans 30 minutes
            setTimeout(() => this.showUpdateNotification(newVersion), 30 * 60 * 1000);
          }
        },
        {
          text: 'Mettre à jour',
          cssClass: 'alert-button-confirm',
          handler: () => {
            console.log('🔄 Application de la mise à jour...');
            this.applyUpdate();
          }
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  private async applyUpdate(): Promise<void> {
    try {
      console.log('🧹 Nettoyage du cache...');
      
      // Vider le cache du service worker si disponible
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('🗑️ Service Worker supprimé');
        }
      }
      
      // Vider le cache du navigateur
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            await caches.delete(cacheName);
            console.log('🗑️ Cache supprimé:', cacheName);
          })
        );
      }
      
      // Afficher un toast de chargement
      const loadingAlert = await this.alertController.create({
        cssClass: 'update-loading-modal',
        header: '🔄 Mise à jour en cours...',
        message: 'Application de la nouvelle version...',
        backdropDismiss: false
      });
      
      await loadingAlert.present();
      
      // Attendre un peu pour que l'utilisateur voie le message
      setTimeout(() => {
        // Recharger complètement la page
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'application de la mise à jour:', error);
      
      // En cas d'erreur, forcer le rechargement simple
      const errorAlert = await this.alertController.create({
        header: '⚠️ Erreur',
        message: 'Une erreur s\'est produite lors de la mise à jour. L\'application va se recharger.',
        buttons: [{
          text: 'OK',
          handler: () => window.location.reload()
        }]
      });
      
      await errorAlert.present();
    }
  }

  // Méthode publique pour vérifier manuellement les mises à jour
  public async manualCheckForUpdates(): Promise<void> {
    console.log('🔍 Vérification manuelle des mises à jour...');
    const hasUpdate = await this.checkForUpdates();
    
    if (!hasUpdate) {
      const alert = await this.alertController.create({
        header: '✅ Application à jour',
        message: 'Vous utilisez déjà la dernière version de l\'application.',
        buttons: ['OK']
      });
      
      await alert.present();
    }
  }

  // Obtenir les informations de version actuelles
  public getCurrentVersion(): VersionInfo | null {
    return this.currentVersion;
  }

  // Forcer une vérification immédiate
  public async forceCheckForUpdates(): Promise<void> {
    await this.checkForUpdates();
  }
}