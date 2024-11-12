import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
})
export class TermsPage {

  // Inyectamos los servicios necesarios
  constructor(
    private navCtrl: NavController,
    private firebaseSvc: FirebaseService,
    private utilsSvc: UtilsService
  ) {}

  // Función para cerrar los términos y volver a la página anterior
  closeTerms() {
    this.navCtrl.pop();
  }

  // Función para aceptar los términos
  acceptTerms() {
    const user: User = this.utilsSvc.getFromLocalStorage('user');  // Obtenemos el usuario desde localStorage
    this.utilsSvc.saveInLocalStorage('user', user); // Agregamos la propiedad de aceptación de términos al usuario
  
    const path = `users/${user.uid}`;  // Definimos el path de usuario en Firebase
  
    // Actualizamos los datos del usuario
    this.firebaseSvc.updateDocument(path, user).then(() => {
      this.utilsSvc.saveInLocalStorage('user', user);  // Guardamos los datos actualizados en el localStorage
      this.utilsSvc.presentToast({
        message: 'Términos aceptados exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline',
      });
      this.navCtrl.pop();  // Cerramos la vista de términos
    }).catch(error => {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al aceptar los términos',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline',
      });
    });
  }
}