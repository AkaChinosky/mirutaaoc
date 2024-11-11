import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ViajeDetalleModalComponent } from './viaje-detalle-modal/viaje-detalle-modal.component';
import { HomePageModule } from './pages/main/home/home.module';  // Asegúrate de importar HomePageModule


// Firebase
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from 'src/environments/environment.prod';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,          // Declaración de AppComponent
    ViajeDetalleModalComponent,  // Declaración de ViajeDetalleModalComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HomePageModule,  // Agrega este módulo aquí
    AngularFireModule.initializeApp(environment.firebaseConfig),
    ReactiveFormsModule,
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],  // Componente que arranca la aplicación
})
export class AppModule { }
