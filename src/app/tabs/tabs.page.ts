import { Component, HostBinding, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {
  @HostBinding('class.hide-tabs-mobile') hideTabsMobile = false;
  private router = inject(Router);

  constructor() {}

  ngOnInit() {
    // Vérifier la route initiale
    this.checkRoute(this.router.url);

    // Écouter les changements de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkRoute(event.url);
    });
  }

  private checkRoute(url: string) {
    // Cacher les tabs sur mobile uniquement pour la page catalog
    this.hideTabsMobile = url.includes('/tabs/catalog');
  }
}
