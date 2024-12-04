import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NoAuthGuard } from './guards/no-auth.guard';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then( m => m.AuthPageModule), canActivate:[NoAuthGuard]
  },
  {
    path: 'role-selection', // Nueva ruta para la página de selección de rol
    loadChildren: () => import('./pages/auth/role-selection/role-selection.module').then(m => m.RoleSelectionPageModule),
    canActivate: [AuthGuard] // Solo usuarios autenticados pueden acceder
  },
  {
    path: 'conductor-home',
    loadChildren: () => import('./pages/main/conductor-home/conductor-home.module').then( m => m.ConductorHomePageModule), canActivate:[AuthGuard]
  },
  {
    path: 'main',
    loadChildren: () => import('./pages/main/main.module').then( m => m.MainPageModule), canActivate:[AuthGuard]
  },
  {
    path: 'home',  // Nueva ruta para Home
    loadChildren: () => import('./pages/main/home/home.module').then(m => m.HomePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
