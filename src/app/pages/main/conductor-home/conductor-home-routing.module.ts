import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConductorHomePage } from './conductor-home.page';

const routes: Routes = [
  {
    path: '',
    component: ConductorHomePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConductorHomePageRoutingModule {}
