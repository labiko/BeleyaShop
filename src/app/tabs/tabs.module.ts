import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './tabs-routing.module';
import { WhatsappFabComponent } from '../components/whatsapp-fab/whatsapp-fab.component';

import { TabsPage } from './tabs.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    WhatsappFabComponent
  ],
  declarations: [TabsPage]
})
export class TabsPageModule {}
