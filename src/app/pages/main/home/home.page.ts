import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import * as mapboxgl from 'mapbox-gl';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  
    firebaseSvc = inject(FirebaseService);
    utilsSvc = inject(UtilsService);
    form: FormGroup;
    userName: string;
    viajes = [];
    viajesUnidos = [];
    viajesIniciados = [];
    filteredViajes = [];
    sortBy = 'precio';
    historialSegment = 'unirse';
    joinedTripId: string | null = null;
    viajeEnCurso: any = null;
    map!: mapboxgl.Map;
    start: [number, number] = [-73.062702, -36.794781];
    destination: [number, number] | null = null;
  
    // Chat variables
    chatMessages: Array<{ sender: string, text: string }> = [];
    newMessage: string = '';
    isJoined = false;
  
    constructor(private fb: FormBuilder, private alertController: AlertController) {}
  
    ngOnInit() {
      this.initForm();
      this.loadUserName();
      this.loadViajes();
      this.checkViajeEnCurso();
      
    }
  
    ngAfterViewInit() {
      this.initializeMap();
    }
  
    initializeMap() {
      (mapboxgl as any).accessToken = 'pk.eyJ1IjoiY2hpbm9za3kiLCJhIjoiY20zODU2c3dxMHA1cDJxb2xsbHE1bWdmYSJ9.D5UEJP-_CSnt4ABadGs8mw'; // Reemplaza con tu token
      this.map = new mapboxgl.Map({
        container: 'map', // ID del contenedor en tu HTML
        style: 'mapbox://styles/mapbox/streets-v11', // Estilo del mapa
        center: this.start, // Coordenadas iniciales
        zoom: 12, // Nivel de zoom inicial
      });
    
      // Marcador inicial
      new mapboxgl.Marker()
        .setLngLat(this.start)
        .addTo(this.map);
    }
  
    initForm() {
      this.form = this.fb.group({
        vehiculo: ['', [
          Validators.required,
          Validators.maxLength(10),
          Validators.pattern('^[a-zA-Z]+$')
        ]],
        patente: ['', [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern('^[a-zA-Z0-9]+$')
        ]],
        espacio: ['', [
          Validators.required,
          Validators.maxLength(1),
          Validators.pattern('^[1-4]$')
        ]],
        price: ['', [
          Validators.required,
          Validators.min(0),
          Validators.pattern('^[0-9]+$')
        ]],
        destinoNombre: ['', [
          Validators.required,
          Validators.maxLength(10),
          Validators.pattern('^[^0-9]*$')
        ]],
      });
    }
  
    loadUserName() {
      const user = this.utilsSvc.getFromLocalStorage('user');
      this.userName = user?.name || 'Usuario';
    }
  
    loadViajes() {
      this.firebaseSvc.obtenerViajes().subscribe((viajes) => {
        this.viajes = viajes;
        this.viajesUnidos = viajes.filter(viaje => viaje.pasajeros?.includes(this.userName));
        this.viajesIniciados = viajes.filter(viaje => viaje.user === this.userName);
        this.applyFilter();
      });
    }
  
    checkViajeEnCurso() {
      this.firebaseSvc.obtenerViajeEnCurso(this.userName).subscribe((viaje) => {
        this.viajeEnCurso = viaje;
      });
    }
  
    applyFilter() {
      this.filteredViajes = [...this.viajes];
      switch (this.sortBy) {
        case 'precio':
          this.filteredViajes.sort((a, b) => a.price - b.price);
          break;
        case 'espacio':
          this.filteredViajes.sort((a, b) => b.espacio - a.espacio);
          break;
        case 'disponibles':
          this.filteredViajes = this.filteredViajes.filter(v => v.espacio > 0);
          break;
      }
    }
  
    async joinViaje(viaje: any) {
      if (this.joinedTripId) {
        this.utilsSvc.presentToast({ message: 'Ya estás unido a otro viaje.', duration: 2000 });
        return;
      }
  
      if (viaje.espacio <= 0) {
        this.utilsSvc.presentToast({ message: 'Espacio no disponible para unirse al viaje.', duration: 2000 });
        return;
      }
  
      const alert = await this.alertController.create({
        header: 'Detalles del viaje',
        message: `
          Vehículo: ${viaje.vehiculo} 
          Patente: ${viaje.patente}
          Precio: $${viaje.price} 
          Espacios disponibles: ${viaje.espacio} 
          Destino: ${viaje.destinoNombre} 
        `,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Unirse al viaje',
            handler: () => {
              this.procesarUnion(viaje);
            },
          },
        ],
        cssClass: 'custom-alert',
      });
      await alert.present();
    }
  
    procesarUnion(viaje: any) {
      this.firebaseSvc.actualizarViaje({
        ...viaje,
        espacio: viaje.espacio - 1,
        pasajeros: [...(viaje.pasajeros || []), this.userName],
      }).then(() => {
        this.firebaseSvc.guardarHistorial({
          ...viaje,
          destino: viaje.destino, 
          destinoNombre: viaje.destinoNombre 
        }, 'pasajero').then(() => {
          this.utilsSvc.presentToast({ message: `Te has unido al viaje en ${viaje.vehiculo}`, duration: 2000 });
          this.joinedTripId = viaje.id;
          this.loadViajes();
        });
      });
    }


  }
  
