import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistroVehiculoPage } from './registro-vehiculo.page';

const routes: Routes = [
  {
    path: '',
    component: RegistroVehiculoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroVehiculoPageRoutingModule {}
