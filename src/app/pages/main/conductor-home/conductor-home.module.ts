import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConductorHomePageRoutingModule } from './conductor-home-routing.module';

import { ConductorHomePage } from './conductor-home.page';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    AngularFirestoreModule,
    ConductorHomePageRoutingModule
  ],
  declarations: [ConductorHomePage]
})
export class ConductorHomePageModule {}
