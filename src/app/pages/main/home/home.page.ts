import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  form: FormGroup;
  userName: string;
  viajes = []; // Array para almacenar todos los viajes
  viajesUnidos = []; // Array para viajes en los que el usuario se unió como pasajero
  viajesIniciados = []; // Array para viajes iniciados por el usuario como conductor
  filteredViajes = []; // Array para almacenar los viajes filtrados
  sortBy = 'precio'; // Criterio de ordenación predeterminado
  historialSegment = 'unirse'; // Segmento por defecto para el historial

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.loadUserName();
    this.loadViajes(); // Cargar viajes al inicializar el componente
  }

  initForm() {
    this.form = this.fb.group({
      vehiculo: ['', Validators.required],
      patente: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(7)]],
      espacio: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(0)]],
    });
  }

  loadUserName() {
    const user = this.utilsSvc.getFromLocalStorage('user');
    this.userName = user?.name || 'Usuario';
  }

  // Cargar viajes desde Firebase y dividir en listas de viajes iniciados y unidos
  loadViajes() {
    this.firebaseSvc.obtenerViajes().subscribe((viajes) => {
      this.viajes = viajes;
      this.viajesUnidos = viajes.filter(viaje => viaje.pasajeros?.includes(this.userName));
      this.viajesIniciados = viajes.filter(viaje => viaje.user === this.userName);
      this.applyFilter(); // Aplica el filtro en viajes actuales
    });
  }


  openViajeDetail(viaje) {
    this.utilsSvc.presentToast({
      message: `Detalles del viaje:\nVehículo: ${viaje.vehiculo}, Patente: ${viaje.patente}, Precio: ${viaje.price}, Espacios: ${viaje.espacio}`,
      duration: 3000
    });
  }

  // Aplicar filtro según el criterio seleccionado
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

  // Función para unirse a un viaje
  joinViaje(viaje) {
    this.utilsSvc.presentToast({ message: `Te has unido al viaje en ${viaje.vehiculo}`, duration: 2000 });
  }

  // Función para ver los detalles de un viaje en el historial
  verDetalle(viaje) {
    this.utilsSvc.presentToast({
      message: `Vehículo: ${viaje.vehiculo}, Patente: ${viaje.patente}, Precio: ${viaje.price}, Espacios: ${viaje.espacio}`,
      duration: 3000
    });
  }

  // Setter para los controles del formulario
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

  // Submit para crear un nuevo viaje como conductor
  submit() {
    if (this.form.valid) {
      const viajeData = {
        ...this.form.value,
        user: this.userName,
      };
      this.firebaseSvc.guardarViaje(viajeData).then(() => {
        this.utilsSvc.presentToast({ message: 'Viaje iniciado con éxito', duration: 2000 });
        this.form.reset();
      });
    }
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }
}
