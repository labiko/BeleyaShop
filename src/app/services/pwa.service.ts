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
    return window.matchMedia('(display-mode: standalone)').matches;
  }
}