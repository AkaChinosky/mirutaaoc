import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistroVehiculoPageRoutingModule } from './registro-vehiculo-routing.module';

import { RegistroVehiculoPage } from './registro-vehiculo.page';
import { HomePageRoutingModule } from '../home/home-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    ReactiveFormsModule,
    RegistroVehiculoPageRoutingModule
  ],
  declarations: [RegistroVehiculoPage]
})
export class RegistroVehiculoPageModule {}
