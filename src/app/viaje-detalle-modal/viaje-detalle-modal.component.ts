import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular'; // Importamos ModalController para controlar el modal

@Component({
  selector: 'app-viaje-detalle-modal',
  templateUrl: './viaje-detalle-modal.component.html',
  styleUrls: ['./viaje-detalle-modal.component.scss'],
})
export class ViajeDetalleModalComponent {

  @Input() viaje: any;  // Recibimos los detalles del viaje desde el componente que abre el modal

  constructor(private modalController: ModalController) {}

  // Método para cerrar el modal
  close() {
    this.modalController.dismiss();
  }
}
