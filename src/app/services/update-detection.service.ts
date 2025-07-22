import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
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
  private isInitialized = false;
  private intervalSubscription?: any;
  
  public updateAvailable$ = this.updateAvailable.asObservable();
  public newVersionInfo$ = this.newVersionInfo.asObservable();

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  // Méthode d'initialisation manuelle pour les pages spécifiques
  public async initializeOnPage(): Promise<void> {
    // Éviter les multiples initialisations
    if (this.isInitialized) {
      console.log('🔄 Service déjà initialisé, ignoré');
      return;
    }
    
    console.log('🔄 Initialisation du service de mise à jour...');
    this.isInitialized = true;
    
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
    // Nettoyer l'ancien interval s'il existe
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    
    // Vérifier toutes les 5 minutes
    this.intervalSubscription = interval(5 * 60 * 1000)
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
        await this.showUpdateToast(remoteVersion);
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
    
    console.log('🔢 Comparaison détaillée:', {
      remoteVersion,
      currentVersion,
      remoteParsed: remote,
      currentParsed: current
    });
    
    for (let i = 0; i < Math.max(remote.length, current.length); i++) {
      const r = remote[i] || 0;
      const c = current[i] || 0;
      
      console.log(`  - Segment ${i}: remote=${r}, current=${c}`);
      
      if (r > c) {
        console.log(`  ➡️ ${r} > ${c} = Nouvelle version détectée!`);
        return true;
      }
      if (r < c) {
        console.log(`  ⬅️ ${r} < ${c} = Version actuelle plus récente`);
        return false;
      }
    }
    
    console.log('  🟰 Versions identiques');
    return false;
  }

  private async showUpdateToast(newVersion: VersionInfo): Promise<void> {
    const toast = await this.toastController.create({
      message: `Nouvelle version ${newVersion.version} disponible - Cliquez pour mettre à jour`,
      duration: 0, // Toast persistant
      position: 'middle',
      cssClass: 'custom-update-toast',
      buttons: [
        {
          text: 'METTRE À JOUR',
          role: 'action',
          handler: () => {
            console.log('🔄 Application de la mise à jour...');
            this.applyUpdate();
          }
        }
      ]
    });

    await toast.present();
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

  // Méthode de test pour simuler une mise à jour (debug uniquement)
  public async simulateUpdate(): Promise<void> {
    console.log('🧪 Simulation d\'une mise à jour...');
    const mockVersion: VersionInfo = {
      version: '0.0.99',
      buildDate: new Date().toISOString(),
      buildId: 'test-build'
    };
    
    this.newVersionInfo.next(mockVersion);
    this.updateAvailable.next(true);
    await this.showUpdateToast(mockVersion);
  }
}