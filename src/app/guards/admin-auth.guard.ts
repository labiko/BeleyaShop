import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthAdminService } from '../services/auth-admin.service';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate {
  private authAdminService = inject(AuthAdminService);
  private router = inject(Router);


  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authAdminService.isAuthenticated()) {
      // Valider la session avant d'autoriser l'accès
      if (this.authAdminService.validateSession()) {
        return true;
      }
    }

    // Rediriger vers la page de login si non authentifié
    console.log('🔒 Accès admin refusé - Redirection vers login');
    return this.router.createUrlTree(['/admin/login']);
  }
}