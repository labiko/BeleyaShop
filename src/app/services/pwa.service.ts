import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private promptEvent: any = null;
  private isInstallableSubject = new BehaviorSubject<boolean>(false);
  public isInstallable$ = this.isInstallableSubject.asObservable();

  constructor() {
    this.initializePwaPrompt();
  }

  private initializePwaPrompt() {
    window.addEventListener('beforeinstallprompt', (event: any) => {
      console.log('📱 PWA install prompt available');
      event.preventDefault();
      this.promptEvent = event;
      this.isInstallableSubject.next(true);
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.promptEvent = null;
      this.isInstallableSubject.next(false);
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 App is running in standalone mode');
      this.isInstallableSubject.next(false);
    }
  }

  async installPwa(): Promise<boolean> {
    if (!this.promptEvent) {
      console.warn('⚠️ PWA install prompt not available');
      return false;
    }

    try {
      console.log('🚀 Showing PWA install prompt');
      this.promptEvent.prompt();
      
      const result = await this.promptEvent.userChoice;
      console.log('👤 User choice:', result.outcome);
      
      if (result.outcome === 'accepted') {
        console.log('✅ User accepted PWA installation');
        this.promptEvent = null;
        this.isInstallableSubject.next(false);
        return true;
      } else {
        console.log('❌ User declined PWA installation');
        return false;
      }
    } catch (error) {
      console.error('❌ Error during PWA installation:', error);
      return false;
    }
  }

  isPwaInstallable(): boolean {
    return this.promptEvent !== null;
  }

  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone || 
           document.referrer.includes('android-app://');
  }

  isInstalled(): boolean {
    return this.isStandalone();
  }

  canInstall(): boolean {
    const standalone = this.isStandalone();
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPrompt = this.promptEvent !== null;
    const hasSupport = this.hasBeforeInstallPromptSupport();
    
    console.log('PWA canInstall check:', {
      standalone,
      hasServiceWorker,
      hasPrompt,
      hasSupport,
      userAgent: navigator.userAgent
    });
    
    // Plus permissif pour mobiles
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    
    return !standalone && 
           hasServiceWorker && 
           (hasPrompt || (isMobile && isChrome) || hasSupport);
  }

  private hasBeforeInstallPromptSupport(): boolean {
    return 'onbeforeinstallprompt' in window;
  }

  getInstallInstructions(): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      return 'Appuyez sur l\'icône de partage puis "Sur l\'écran d\'accueil"';
    } else if (isAndroid) {
      return 'Appuyez sur le menu (⋮) puis "Ajouter à l\'écran d\'accueil"';
    } else {
      return 'Utilisez le menu du navigateur pour installer cette application';
    }
  }

  isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isAndroidDevice(): boolean {
    return /Android/.test(navigator.userAgent);
  }
}