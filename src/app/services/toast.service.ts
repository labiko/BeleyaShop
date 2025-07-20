import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export interface ToastOptions {
  message: string;
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
  color?: 'success' | 'danger' | 'warning' | 'primary';
  icon?: string;
  centered?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) { }

  async show(options: ToastOptions) {
    const {
      message,
      duration = 3000,
      position = 'middle',
      color = 'primary',
      icon,
      centered = true
    } = options;

    // Déterminer l'icône automatiquement si non fournie
    const toastIcon = icon || this.getDefaultIcon(color);

    const toast = await this.toastController.create({
      message: message, // Utiliser directement le message texte sans HTML
      duration,
      position,
      color,
      icon: toastIcon, // Utiliser l'option icon d'Ionic
      cssClass: [
        'toast-modern',
        `toast-${color}`,
        ...(centered ? ['toast-center'] : [])
      ],
      buttons: [
        {
          icon: 'close',
          role: 'cancel',
          side: 'end'
        }
      ]
    });

    await toast.present();
    return toast;
  }

  async showSuccess(message: string, duration = 3000) {
    return this.show({
      message,
      duration,
      color: 'success',
      icon: 'checkmark-circle'
    });
  }

  async showError(message: string, duration = 4000) {
    return this.show({
      message,
      duration,
      color: 'danger',
      icon: 'alert-circle'
    });
  }

  async showWarning(message: string, duration = 3500) {
    return this.show({
      message,
      duration,
      color: 'warning',
      icon: 'warning'
    });
  }

  async showInfo(message: string, duration = 3000) {
    return this.show({
      message,
      duration,
      color: 'primary',
      icon: 'information-circle'
    });
  }

  private getDefaultIcon(color: string): string {
    switch (color) {
      case 'success':
        return 'checkmark-circle';
      case 'danger':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'primary':
      default:
        return 'information-circle';
    }
  }
}