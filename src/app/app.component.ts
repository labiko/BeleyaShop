import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showSplash = true;

  constructor() {}

  ngOnInit() {
    // Afficher le splash screen pendant 3 secondes
    setTimeout(() => {
      this.showSplash = false;
    }, 3000);
  }
}
