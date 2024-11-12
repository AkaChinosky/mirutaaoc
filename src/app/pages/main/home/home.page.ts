import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import * as mapboxgl from 'mapbox-gl';


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
  joinedTripId: string | null = null; // Guardar el ID del viaje al que se unió el usuario
  viajeEnCurso: any = null; // Almacena el viaje en curso del usuario
  map!: mapboxgl.Map;
  start: [number, number] = [-73.062702, -36.794781]; // Coordenadas de inicio
  destination: [number, number] | null = null;

  constructor(private fb: FormBuilder) {
  }

  ngOnInit() {
    this.initForm();
    this.loadUserName();
    this.loadViajes();
    this.checkViajeEnCurso();
  }

  ngAfterViewInit() {
    this.initializeMap();
  }



  initForm() {
    this.form = this.fb.group({
      vehiculo: [
        '',
        [
          Validators.required,
          Validators.maxLength(10),
          Validators.pattern('^[a-zA-Z]+$') // Solo letras (sin espacios ni números)
        ]
      ],
      patente: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern('^[a-zA-Z0-9]+$') // Solo letras y números
        ]
      ],
      espacio: [
        '',
        [
          Validators.required,
          Validators.pattern('^[1-4]$') // Solo números del 1 al 4
        ]
      ],
      price: [
        '',
        [
          Validators.required,
          Validators.min(0), // No permitir números negativos
          Validators.pattern('^[0-9]+$') // Solo números
        ]
      ]
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
    // Verifica si hay un viaje en curso para el usuario
    this.firebaseSvc.obtenerViajeEnCurso(this.userName).subscribe((viaje) => {
      this.viajeEnCurso = viaje;
    });
  }

  openViajeDetail(viaje) {
    this.utilsSvc.presentToast({
      message: `Detalles del viaje:\nVehículo: ${viaje.vehiculo}, Patente: ${viaje.patente}, Precio: ${viaje.price}, Espacios: ${viaje.espacio}`,
      duration: 3000
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
      case 'cercania':
        this.filteredViajes.sort((a, b) => a.distancia - b.distancia);
        break;
    }
  }

  joinViaje(viaje) {
    // Verifica si ya está en otro viaje
    if (this.joinedTripId) {
      this.utilsSvc.presentToast({ message: `Ya estás unido a otro viaje.`, duration: 2000 });
      return;
    }

    this.firebaseSvc.actualizarViaje({
      ...viaje,
      espacio: viaje.espacio - 1,
      pasajeros: [...(viaje.pasajeros || []), this.userName]
    }).then(() => {
      this.firebaseSvc.agregarHistorial(viaje, 'pasajero').then(() => {
        this.utilsSvc.presentToast({ message: `Te has unido al viaje en ${viaje.vehiculo}`, duration: 2000 });
        this.joinedTripId = viaje.id;
        this.loadViajes();
      });
    });
  }

  verDetalle(viaje) {
    this.utilsSvc.presentToast({
      message: `Vehículo: ${viaje.vehiculo}, Patente: ${viaje.patente}, Precio: ${viaje.price}, Espacios: ${viaje.espacio}`,
      duration: 3000
    });
  }

  get vehiculo(): FormControl {
    return this.form.get('vehiculo') as FormControl;
  }

  get patente(): FormControl {
    return this.form.get('patente') as FormControl;
  }

  get espacio(): FormControl {
    return this.form.get('espacio') as FormControl;
  }

  get price(): FormControl {
    return this.form.get('price') as FormControl;
  }


  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }



  submit() {
    // Si ya hay un viaje en curso, no permite iniciar otro
    if (this.viajeEnCurso) {
      this.utilsSvc.presentToast({ message: 'Ya tienes un viaje en curso.', duration: 2000 });
      return;
    }

    if (this.form.valid) {
      const viajeData = {
        ...this.form.value,
        user: this.userName,
        horaInicio: new Date().toLocaleString(),
        estado: 'en_curso' // Marca el viaje como "en curso"
      };

      this.firebaseSvc.guardarViaje(viajeData).then(() => {
        this.firebaseSvc.agregarHistorial(viajeData, 'conductor').then(() => {
          this.utilsSvc.presentToast({ message: 'Viaje iniciado con éxito', duration: 2000 });
          this.form.reset();
          this.viajeEnCurso = viajeData; // Actualiza el viaje en curso
          this.loadViajes();
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

      // Agregar el punto de inicio
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

    // Evento para seleccionar el destino en el mapa al hacer clic
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

      // Verifica si la capa 'end' ya existe, y si no, la añade
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

      // Llama a getRoute con las coordenadas de destino
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

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
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

    // Display instructions in HTML
    const instructions = document.getElementById('instructions');
    const steps = data.legs[0].steps;
    let tripInstructions = '';

    for (const step of steps) {
        tripInstructions += `<li>${step.maneuver.instruction}</li>`;
    }

    instructions.innerHTML = `<p><strong>Duración del viaje: ${Math.floor(data.duration / 60)} min 🚗 </strong></p><ol>${tripInstructions}</ol>`;
}
}