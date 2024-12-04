import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import * as mapboxgl from 'mapbox-gl';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-conductor-home',
  templateUrl: './conductor-home.page.html',
  styleUrls: ['./conductor-home.page.scss'],
})
export class ConductorHomePage implements OnInit, AfterViewInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  firestore
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
  vehiculoRegistrado: boolean = false;
  vehiculo: any = null;
  iniciarViajeForm: FormGroup;
  currentChatId: string | null = null; // Chat actual
  chatMessages: any[] = []; // Mensajes cargados
  messageText: string = ''; // Texto del mensaje

  constructor(private fb: FormBuilder, private alertController: AlertController) { }


  ngOnInit() {
    this.initForm();
    this.loadUserName();
    this.checkViajeEnCurso();
    this.loadViajes();
    this.loadVehiculo();
    this.initIniciarViajeForm();
  }
  ngAfterViewInit() {
    this.initializeMap();
  }

  applyFilter() {
    this.filteredViajes = [...this.viajes];
    switch (this.sortBy) {
      case 'precio':
        this.filteredViajes.sort((a, b) => a.price - b.price);
        break;
      case 'espacio':
        this.filteredViajes.sort((a, b) => b.espaciodisponible - a.espaciodisponible);
        break;
      case 'disponibles':
        this.filteredViajes = this.filteredViajes.filter(v => v.espacio > 0);
        break;
    }
  }


  initForm() {
    this.form = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.maxLength(50), // Máximo 50 caracteres
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$') // Solo letras y espacios
      ]],
      apellido: ['', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      rut: ['', [
        Validators.required,
        Validators.pattern('^[0-9]+-[0-9kK]{1}$') // Formato RUT: Ej. 12345678-9
      ]],
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
      ]]
    });
  }
  

  verDetalle(viaje) {
    this.utilsSvc.presentToast({
      message: `Vehículo: ${viaje.vehiculo}, Patente: ${viaje.patente}, Precio: ${viaje.price}, Espacios: ${viaje.espaciodisponible} , Destino: ${viaje.nombreDestino}`,
      duration: 3000
    });
  }

  get destinoNombre(): FormControl {
    return this.form.get('destinoNombre') as FormControl;
  }

  loadUserName() {
    const user = this.utilsSvc.getFromLocalStorage('user');
    this.userName = user?.name || 'Usuario';
  }
  checkViajeEnCurso() {
    this.firebaseSvc.obtenerViajeEnCurso(this.userName).subscribe((viaje) => {
      this.viajeEnCurso = viaje;
    });
  }

  mostrarRuta(destino: [number, number]) {
    if (!destino) {
      this.utilsSvc.presentToast({ message: 'No se encontró una ruta registrada para este viaje.', duration: 2000 });
      return;
    }
  
    this.getRoute(destino);
  }

  user() {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  loadViajes() {
    this.firebaseSvc.obtenerViajes().subscribe((viajes) => {
      this.viajesIniciados = viajes.filter(viaje => viaje.user === this.userName && viaje.estado === 'finalizado');
    });
  }


  submit() {
    if (this.viajeEnCurso) {
      this.utilsSvc.presentToast({ message: 'Ya tienes un viaje en curso.', duration: 2000 });
      return;
    }
  
    if (!this.destination) {
      this.utilsSvc.presentToast({ message: 'Por favor, selecciona un destino en el mapa antes de iniciar el viaje.', duration: 2000 });
      return;
    }
  
    if (this.form.valid) {
      const viajeData = {
        ...this.form.value,
        user: this.userName,
        horaInicio: new Date().toLocaleString(),
        estado: 'en_curso',
        destino: this.destination,  // Coordenadas de destino
      };
  
      this.firebaseSvc.guardarViaje(viajeData).then(() => {
        this.firebaseSvc.guardarHistorial(viajeData, 'conductor').then(() => {
          this.utilsSvc.presentToast({ message: 'Viaje iniciado con éxito', duration: 2000 });
          this.form.reset();
          this.viajeEnCurso = viajeData;
          this.loadViajes();  // Recarga los viajes, incluyendo el nuevo
        });
      });
    }
  }


  initializeMap() {
    const accessToken = 'pk.eyJ1IjoiY2hpbm9za3kiLCJhIjoiY20zODU2c3dxMHA1cDJxb2xsbHE1bWdmYSJ9.D5UEJP-_CSnt4ABadGs8mw';

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v10',
      center: this.start,
      zoom: 12,
      accessToken: accessToken,
    });

    this.map.on('load', () => {
      this.getRoute(this.start);

      this.map.addLayer({
        id: 'point',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: this.start,
                },
              },
            ],
          },
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#3887be',
        },
      });
    });

    this.map.on('click', (event) => {
      const coords: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      const endFeature: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: coords,
            },
          },
        ],
      };

      this.destination = coords;

      if (this.map.getLayer('end')) {
        (this.map.getSource('end') as mapboxgl.GeoJSONSource).setData(endFeature);
      } else {
        this.map.addLayer({
          id: 'end',
          type: 'circle',
          source: {
            type: 'geojson',
            data: endFeature,
          },
          paint: {
            'circle-radius': 10,
            'circle-color': '#f30',
          },
        });
      }

      this.getRoute(coords);
    });
  }

  async getRoute(end: [number, number]) {
    const accessToken = 'pk.eyJ1IjoiY2hpbm9za3kiLCJhIjoiY20zODU2c3dxMHA1cDJxb2xsbHE1bWdmYSJ9.D5UEJP-_CSnt4ABadGs8mw';
    
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/cycling/${this.start[0]},${this.start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${accessToken}&language=es`,
      { method: 'GET' }
    );
    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;

    const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route,
          },
        },
      ],
    };

    if (this.map.getSource('route')) {
      (this.map.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      this.map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          data: geojson,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75,
        },
      });
    }

    const instructions = document.getElementById('instructions');
    instructions.innerHTML = `<p><strong>Distancia total</strong>: ${(data.distance / 1000).toFixed(2)} km<br><strong>Duración</strong>: ${Math.floor(data.duration / 60)} min</p>`;

    const steps = data.legs[0].steps;
    steps.forEach((step) => {
      instructions.innerHTML += `<p>${step.maneuver.instruction}</p>`;
    });
  }


  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      message: message,
      buttons: ['OK'],
    });
  
    await alert.present();
  }

  submitViaje() {
    if (this.form.valid) {
      // Aquí podrías guardar el viaje en Firebase
      const viaje = {
        ...this.form.value,
        user: this.userName,
      };
  
      this.firebaseSvc.guardarViaje(viaje).then(() => {
        this.utilsSvc.presentToast({ message: 'Viaje iniciado con éxito', duration: 2000 });
        this.viajeEnCurso = viaje; // Actualizar estado
        this.form.reset();
      }).catch((error) => {
        console.error('Error al guardar el viaje:', error);
        this.utilsSvc.presentToast({ message: 'Error al iniciar el viaje.', duration: 2000 });
      });
    }
  }


  

  loadVehiculo() {
    const user = this.userName;
    this.firebaseSvc.obtenerVehiculo(user).subscribe((vehiculo) => {
      if (vehiculo) {
        this.vehiculo = vehiculo;
        this.vehiculoRegistrado = true;
      } else {
        this.vehiculoRegistrado = false;
      }
    });
  }

  submitVehiculo() {
    if (this.vehiculoRegistrado) {
      this.utilsSvc.presentToast({
        message: 'Ya tienes un vehículo registrado. Elimina el existente para agregar uno nuevo.',
        duration: 2000,
      });
      return;
    }
  
    if (this.form.valid) {
      const vehiculoData = {
        ...this.form.value,
        user: this.userName,
      };
  
      this.firebaseSvc.guardarVehiculo(vehiculoData).then(() => {
        this.utilsSvc.presentToast({
          message: 'Vehículo registrado con éxito',
          duration: 2000,
        });
        this.loadVehiculo();
      }).catch((error) => {
        console.error('Error al registrar el vehículo:', error);
        this.utilsSvc.presentToast({
          message: 'Error al registrar el vehículo.',
          duration: 2000,
        });
      });
    }
  }

  eliminarVehiculo() {
    this.firebaseSvc.eliminarVehiculo(this.userName).then(() => {
      this.utilsSvc.presentToast({
        message: 'Vehículo eliminado con éxito',
        duration: 2000,
      });
      this.vehiculo = null;
      this.vehiculoRegistrado = false;
    }).catch((error) => {
      console.error('Error al eliminar el vehículo:', error);
      this.utilsSvc.presentToast({
        message: 'Error al eliminar el vehículo.',
        duration: 2000,
      });
    });
  }
  
  editarVehiculo() {
    this.form.setValue({
      nombre: this.vehiculo.nombre,
      apellido: this.vehiculo.apellido,
      rut: this.vehiculo.rut,
      vehiculo: this.vehiculo.vehiculo,
      patente: this.vehiculo.patente,
    });
    this.vehiculoRegistrado = false; // Permite editar
  }

  async mostrarNotificacionPasajero(pasajero: string) {
    const alert = await this.alertController.create({
      header: 'Nuevo pasajero',
      message: `${pasajero} se ha unido a tu viaje.`,
      buttons: ['OK']
    });
    await alert.present();
  }

  finalizarViaje() {
    if (this.viajeEnCurso) {
      const viajeFinalizado = {
        ...this.viajeEnCurso,
        estado: 'finalizado',
        horaFin: new Date().toLocaleString(),
      };
  
      // Guardar en Firebase o actualizar localmente
      this.firebaseSvc.guardarHistorial
      (viajeFinalizado, 'conductor').then(() => {
        this.utilsSvc.presentToast({ message: 'Viaje finalizado con éxito.', duration: 2000 });
        this.viajeEnCurso = null; // Limpia el viaje en curso
        this.loadViajes(); // Actualiza el historial
      }).catch((error) => {
        console.error('Error al finalizar viaje:', error);
        this.utilsSvc.presentToast({ message: 'Hubo un problema al finalizar el viaje.', duration: 2000 });
      });
    } else {
      this.utilsSvc.presentToast({ message: 'No hay ningún viaje en curso.', duration: 2000 });
    }
  }


  

initIniciarViajeForm() {
  this.iniciarViajeForm = this.fb.group({
    espaciodisponible: ['', [
      Validators.required,
      Validators.min(1), // Mínimo 1
      Validators.max(4), // Máximo 4
      Validators.pattern('^[1-4]$') // Solo números entre 1 y 4
    ]],
    price: ['', [
      Validators.required,
      Validators.min(1), // No permitir números negativos ni ceros
      Validators.pattern('^[0-9]+(\.[0-9]{1,2})?$') // Aceptar números enteros o con hasta 2 decimales
    ]],
    destinoNombre: ['', [
      Validators.required,
      Validators.maxLength(100) // Máximo 100 caracteres
    ]],
  });
}

onSubmit() {
  if (this.iniciarViajeForm.valid) {
    const viajeData = {
      ...this.iniciarViajeForm.value,
      user: this.user, // Asegúrate de tener `userName` definido en tu componente
    };

    this.firebaseSvc.guardarIniciarViaje(viajeData).then(() => {
      this.utilsSvc.presentToast({ message: 'Viaje guardado con éxito', duration: 2000 });
      this.iniciarViajeForm.reset(); // Reiniciar el formulario después de guardarlo
    }).catch((error) => {
      console.error('Error al guardar el viaje:', error);
      this.utilsSvc.presentToast({ message: 'Error al guardar el viaje.', duration: 2000 });
    });
  } else {
    console.log('Formulario no válido');
    this.utilsSvc.presentToast({ message: 'Por favor, completa todos los campos correctamente.', duration: 2000 });
  }
}


obtenerViaje() {
  const userId = this.userName; // Reemplaza con el identificador correcto
  this.firebaseSvc.obtenerIniciarViaje(userId).subscribe((viaje) => {
    console.log('Datos del viaje:', viaje);
  }, (error) => {
    console.error('Error al obtener el viaje:', error);
  });
}


eliminarViaje() {
  const userId = this.userName; // Reemplaza con el identificador correcto
  this.firebaseSvc.eliminarIniciarViaje(userId).then(() => {
    console.log('Viaje eliminado con éxito');
  }).catch((error) => {
    console.error('Error al eliminar el viaje:', error);
  });
}

  
  loadChat(chatId: string) {
    this.currentChatId = chatId;
    this.firebaseSvc.getChatMessages(chatId).subscribe((messages) => {
      this.chatMessages = messages;
    });
  }
  
  sendMessage() {
    if (!this.currentChatId || !this.messageText.trim()) return;
  
    const newMessage = {
      text: this.messageText,
      sender: this.userName,
      timestamp: new Date().toISOString(),
    };
  
    this.firebaseSvc.sendMessage(this.currentChatId, newMessage).then(() => {
      this.messageText = ''; // Limpia el campo de texto
    });
  }

}