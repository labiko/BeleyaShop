import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AuthAdminService } from '../../services/auth-admin.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.page.html',
  styleUrls: ['./admin-login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminLoginPage implements OnInit {
  private authAdminService = inject(AuthAdminService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  credentials = {
    username: '',
    password: ''
  };

  showPassword = false;
  isLoading = false;

  ngOnInit() {
    // Si déjà connecté, rediriger vers l'admin
    if (this.authAdminService.isAuthenticated()) {
      this.router.navigate(['/admin/products']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    if (!this.credentials.username.trim() || !this.credentials.password.trim()) {
      await this.showToast('Veuillez remplir tous les champs', 'warning');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Connexion en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const result = await this.authAdminService.login(
        this.credentials.username,
        this.credentials.password
      );

      await loading.dismiss();
      this.isLoading = false;

      if (result.success) {
        await this.showToast('Connexion réussie ! Bienvenue Admin', 'success');
        this.router.navigate(['/admin/products']);
      } else {
        await this.showToast(result.error || 'Erreur de connexion', 'danger');
      }
    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
      console.error('Erreur lors de la connexion:', error);
      await this.showToast('Erreur technique lors de la connexion', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  // Méthode de développement pour remplir automatiquement les champs
  fillCredentials() {
    this.credentials.username = 'admin';
    this.credentials.password = 'Passer@123';
  }
}