import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainPage } from './main.page';

const routes: Routes = [
  {
    path: '',
    component: MainPage,
    children: [


      {
        path: 'conductor-home',
        loadChildren: () => import('./conductor-home/conductor-home.module').then( m => m.ConductorHomePageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: 'registro-vehiculo',
        loadChildren: () => import('./registro-vehiculo/registro-vehiculo.module').then( m => m.RegistroVehiculoPageModule)
      },
      {
        path: 'home',  // Nueva ruta para Home
        loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
      },
    ]
  },
  {
    path: 'registro-vehiculo',
    loadChildren: () => import('./registro-vehiculo/registro-vehiculo.module').then( m => m.RegistroVehiculoPageModule)
  },
  {
    path: 'conductor-home',
    loadChildren: () => import('./conductor-home/conductor-home.module').then( m => m.ConductorHomePageModule)
  },
  {
    path: 'home',  // Nueva ruta para Home
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },



];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainPageRoutingModule { }