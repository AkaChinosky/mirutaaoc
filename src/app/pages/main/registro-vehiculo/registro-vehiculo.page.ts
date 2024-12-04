import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-registro-vehiculo',
  templateUrl: './registro-vehiculo.page.html',
  styleUrls: ['./registro-vehiculo.page.scss'],
})
export class RegistroVehiculoPage {
  form: FormGroup;

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.form = this.fb.group({
      vehiculo: ['', Validators.required],
      patente: ['', Validators.required],
      asientos: ['', [Validators.required, Validators.min(1)]],
      precio: ['', [Validators.required, Validators.min(0)]],
    });
  }

  async submit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}'); // Obtener usuario logeado
    const vehicleData = { ...this.form.value, uid: user.uid };

    const vehicleDoc = doc(this.firestore, `vehicles/${user.uid}`);
    await setDoc(vehicleDoc, vehicleData);

    alert('Vehículo registrado exitosamente');
  }
}
