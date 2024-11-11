import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { ModalController } from '@ionic/angular';
import { ViajeDetalleModalComponent } from 'src/app/viaje-detalle-modal/viaje-detalle-modal.component';  // Importa el modal

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  modalController = inject(ModalController);  // Inyectamos ModalController
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

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.loadUserName();
    this.loadViajes();
    this.checkViajeEnCurso(); // Verifica si hay un viaje en curso
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

  // Nueva función para abrir el modal con los detalles del viaje
  async verDetalle(viaje: any) {
    const modal = await this.modalController.create({
      component: ViajeDetalleModalComponent,  // Componente modal que muestra los detalles
      componentProps: { viaje }  // Pasamos los detalles del viaje al modal
    });
    return await modal.present();
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

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }



  // Función para abrir el modal con los detalles del viaje
  async openViajeDetail(viaje: any) {
    const modal = await this.modalController.create({
      component: ViajeDetalleModalComponent,  // Modal que se abrirá
      componentProps: { viaje: viaje }      // Pasa los datos del viaje al modal
    });
    await modal.present();  // Muestra el modal
  }

}