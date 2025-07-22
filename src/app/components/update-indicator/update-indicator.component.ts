import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UpdateDetectionService, VersionInfo } from '../../services/update-detection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-update-indicator',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="update-indicator" *ngIf="updateAvailable">
      <ion-chip 
        color="success" 
        class="update-chip"
        (click)="onUpdateClick()">
        <ion-icon name="cloud-download" class="update-icon"></ion-icon>
        <ion-label>Mise à jour v{{ newVersion?.version }}</ion-label>
      </ion-chip>
    </div>
  `,
  styleUrls: ['./update-indicator.component.scss']
})
export class UpdateIndicatorComponent implements OnInit, OnDestroy {
  private updateService = inject(UpdateDetectionService);

  updateAvailable = false;
  newVersion: VersionInfo | null = null;

  private updateAvailableSubscription?: Subscription;
  private newVersionSubscription?: Subscription;

  ngOnInit() {
    // S'abonner aux notifications de mise à jour
    this.updateAvailableSubscription = this.updateService.updateAvailable$.subscribe(
      (available) => {
        this.updateAvailable = available;
        console.log('📡 Update disponible:', available);
      }
    );

    this.newVersionSubscription = this.updateService.newVersionInfo$.subscribe(
      (versionInfo) => {
        this.newVersion = versionInfo;
        console.log('📦 Nouvelle version:', versionInfo);
      }
    );
  }

  ngOnDestroy() {
    if (this.updateAvailableSubscription) {
      this.updateAvailableSubscription.unsubscribe();
    }
    if (this.newVersionSubscription) {
      this.newVersionSubscription.unsubscribe();
    }
  }

  onUpdateClick() {
    // Forcer une nouvelle vérification qui déclenchera la modal
    this.updateService.forceCheckForUpdates();
  }
}