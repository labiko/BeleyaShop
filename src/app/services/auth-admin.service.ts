import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AdminUser {
  username: string;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthAdminService {
  private readonly ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'Passer@123'
  };
  
  private readonly STORAGE_KEY = 'beleya_admin_auth';
  
  private currentUserSubject = new BehaviorSubject<AdminUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadAuthState();
  }

  private loadAuthState(): void {
    try {
      const storedAuth = localStorage.getItem(this.STORAGE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        if (authData && authData.isAuthenticated) {
          this.currentUserSubject.next(authData);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état d\'authentification:', error);
      this.logout();
    }
  }

  private saveAuthState(user: AdminUser): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état d\'authentification:', error);
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Simuler un délai d'authentification
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === this.ADMIN_CREDENTIALS.username && password === this.ADMIN_CREDENTIALS.password) {
      const user: AdminUser = {
        username: username,
        isAuthenticated: true
      };

      this.currentUserSubject.next(user);
      this.saveAuthState(user);

      console.log('✅ Connexion admin réussie:', username);
      return { success: true };
    } else {
      console.warn('❌ Tentative de connexion échouée:', username);
      return { 
        success: false, 
        error: 'Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.' 
      };
    }
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
    console.log('🚪 Déconnexion admin effectuée');
  }

  isAuthenticated(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser !== null && currentUser.isAuthenticated;
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUserSubject.value;
  }

  // Méthode pour vérifier si l'utilisateur est toujours authentifié
  validateSession(): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.isAuthenticated) {
      this.logout();
      return false;
    }
    return true;
  }
}