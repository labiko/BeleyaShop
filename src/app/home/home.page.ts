import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VersionService } from '../services/version.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HomePage {
  private router = inject(Router);
  private versionService = inject(VersionService);

  appVersion = this.versionService.getVersion();

  goToCatalog() {
    this.router.navigate(['/tabs/catalog']);
  }

  goToCategory(category: string) {
    this.router.navigate(['/tabs/catalog'], { queryParams: { category } });
  }

}
