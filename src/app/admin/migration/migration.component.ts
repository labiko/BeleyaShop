import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { OrderNumberMigration } from '../../utils/migrate-order-numbers';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-migration',
  template: `
    <ion-header>
      <ion-toolbar class="admin-toolbar">
        <ion-title>Migration des Numéros de Commande</ion-title>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/admin/orders"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="migration-content">
      <div class="migration-container">
        
        <!-- Carte d'information -->
        <ion-card class="info-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="information-circle"></ion-icon>
              À propos de cette migration
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Cette migration va mettre à jour tous les numéros de commande existants pour respecter le nouveau format :</p>
            <div class="format-example">
              <strong>Format :</strong> GN905EGXXXXX
              <ul>
                <li><strong>GN</strong> : Code pays (Guinée)</li>
                <li><strong>905</strong> : Code région (Conakry)</li>
                <li><strong>EG</strong> : Code entreprise (E-commerce Guinée)</li>
                <li><strong>XXXXX</strong> : Numéro séquentiel unique</li>
              </ul>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Statut actuel -->
        <ion-card class="status-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="analytics"></ion-icon>
              Statut Actuel
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="status-grid" *ngIf="status">
              <div class="status-item">
                <span class="label">Total commandes :</span>
                <span class="value">{{ status.total }}</span>
              </div>
              <div class="status-item">
                <span class="label">Déjà migrées :</span>
                <span class="value success">{{ status.migrated }}</span>
              </div>
              <div class="status-item">
                <span class="label">À migrer :</span>
                <span class="value warning">{{ status.pending }}</span>
              </div>
            </div>
            
            <ion-button 
              expand="block" 
              (click)="checkStatus()"
              class="check-btn">
              <ion-icon name="refresh" slot="start"></ion-icon>
              Actualiser le statut
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Actions de migration -->
        <ion-card class="action-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="settings"></ion-icon>
              Actions de Migration
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button 
              expand="block" 
              color="primary"
              (click)="runMigration()"
              [disabled]="status?.pending === 0"
              class="migrate-btn">
              <ion-icon name="sync" slot="start"></ion-icon>
              Lancer la migration
            </ion-button>
            
            <ion-note *ngIf="status?.pending === 0" color="success">
              <ion-icon name="checkmark-circle"></ion-icon>
              Toutes les commandes sont déjà migrées !
            </ion-note>
          </ion-card-content>
        </ion-card>

        <!-- Résultats de migration -->
        <ion-card class="results-card" *ngIf="migrationResult">
          <ion-card-header>
            <ion-card-title [color]="migrationResult.success ? 'success' : 'danger'">
              <ion-icon [name]="migrationResult.success ? 'checkmark-circle' : 'alert-circle'"></ion-icon>
              Résultat de la Migration
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="result-info">
              <p><strong>Commandes migrées :</strong> {{ migrationResult.migratedCount }}</p>
              <p *ngIf="migrationResult.errors.length > 0" class="error-info">
                <strong>Erreurs rencontrées :</strong> {{ migrationResult.errors.length }}
              </p>
            </div>
            
            <div class="error-details" *ngIf="migrationResult.errors.length > 0">
              <h4>Détails des erreurs :</h4>
              <ion-list>
                <ion-item *ngFor="let error of migrationResult.errors">
                  <ion-label>
                    <p>Commande ID: {{ error.orderId }}</p>
                    <p class="error-message">{{ error.error.message || 'Erreur inconnue' }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </div>
          </ion-card-content>
        </ion-card>

      </div>
    </ion-content>
  `,
  styles: [`
    .migration-content {
      --background: #f8fafc;
    }

    .migration-container {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }

    ion-card {
      margin-bottom: 16px;
      border-radius: 12px;
      border: 2px solid rgba(0, 0, 0, 0.05);
    }

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #000000;

      ion-icon {
        font-size: 24px;
        color: #3b82f6;
      }
    }

    .format-example {
      background: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
      margin-top: 12px;
      font-family: monospace;
      font-size: 14px;

      ul {
        margin: 12px 0 0 20px;
        list-style: none;

        li {
          margin: 4px 0;
          font-family: sans-serif;
          font-size: 13px;
        }
      }
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 20px;

      .status-item {
        background: #f8fafc;
        padding: 12px;
        border-radius: 8px;
        text-align: center;

        .label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #000000;

          &.success {
            color: #10b981;
          }

          &.warning {
            color: #f59e0b;
          }
        }
      }
    }

    .check-btn, .migrate-btn {
      --background: #3b82f6;
      --border-radius: 8px;
      font-weight: 600;
    }

    .results-card {
      ion-card-title {
        &[color="success"] ion-icon {
          color: #10b981;
        }

        &[color="danger"] ion-icon {
          color: #ef4444;
        }
      }
    }

    .result-info {
      font-size: 14px;
      margin-bottom: 16px;

      p {
        margin: 8px 0;
      }

      .error-info {
        color: #ef4444;
      }
    }

    .error-details {
      background: #fef2f2;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #991b1b;
      }

      ion-list {
        background: transparent;
      }

      ion-item {
        --background: transparent;
        --padding-start: 0;
        font-size: 12px;

        .error-message {
          color: #991b1b;
          font-size: 11px;
        }
      }
    }

    ion-note {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      font-size: 14px;

      ion-icon {
        font-size: 18px;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MigrationComponent {
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private toastService = inject(ToastService);

  status: { total: number; migrated: number; pending: number } | null = null;
  migrationResult: { success: boolean; migratedCount: number; errors: any[] } | null = null;

  constructor() {
    this.checkStatus();
  }

  async checkStatus() {
    const loading = await this.loadingController.create({
      message: 'Vérification du statut...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.status = await OrderNumberMigration.checkMigrationStatus();
      await loading.dismiss();
      await this.toastService.showSuccess('Statut actualisé', 2000);
    } catch (error) {
      await loading.dismiss();
      await this.toastService.showError('Erreur lors de la vérification', 3000);
    }
  }

  async runMigration() {
    const alert = await this.alertController.create({
      header: '🔄 Confirmer la migration',
      message: `Êtes-vous sûr de vouloir migrer ${this.status?.pending} commande(s) ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Migrer',
          handler: () => {
            this.performMigration();
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  private async performMigration() {
    const loading = await this.loadingController.create({
      message: 'Migration en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.migrationResult = await OrderNumberMigration.migrateOrderNumbers();
      await loading.dismiss();
      
      if (this.migrationResult.success) {
        await this.toastService.showSuccess(
          `Migration réussie ! ${this.migrationResult.migratedCount} commandes migrées.`,
          4000
        );
      } else {
        await this.toastService.showWarning(
          `Migration partielle : ${this.migrationResult.migratedCount} migrées, ${this.migrationResult.errors.length} erreurs.`,
          4000
        );
      }
      
      // Actualiser le statut
      await this.checkStatus();
    } catch (error) {
      await loading.dismiss();
      await this.toastService.showError('Erreur lors de la migration', 4000);
      console.error('Erreur migration:', error);
    }
  }
}