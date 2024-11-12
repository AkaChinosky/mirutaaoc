import { Component, inject, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { User } from 'src/app/models/user.model';
import { Router } from '@angular/router';  // Asegúrate de importar Router para la navegación

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  // Inyección de servicios
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  router = inject(Router);  // Inyección del servicio Router para la navegación

  ngOnInit() {
    // Inicialización del componente
  }

  // Obtener el usuario desde el almacenamiento local
  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  signOut() {
    this.firebaseSvc.signOut();
  }

  // Método para editar el perfil
  editProfile() {
    // Navegar a la página de edición de perfil
    this.router.navigate(['/edit-profile']);  // Reemplaza 'edit-profile' con el nombre correcto de tu ruta
  }

  // Método para ver los términos y condiciones
  viewTerms() {
    // Navegar a la página de términos y condiciones
    this.router.navigate(['/terms']);  // Reemplaza 'terms' con el nombre correcto de tu ruta
  }

  async takeImage() {
    try {
      const user = this.user();
      const path = `users/${user.uid}`;
      const imagePath = `${user.uid}/profile`;

      // Captura la imagen y obtiene la URL en base64
      const dataUrl = (await this.utilsSvc.takePicture('imagen')).dataUrl;

      // Mostrar el indicador de carga mientras se sube la imagen
      const loading = await this.utilsSvc.loading();
      await loading.present();

      // Subir la imagen al servicio Firebase y actualizar la imagen del usuario
      user.image = await this.firebaseSvc.uploadImage(imagePath, dataUrl);

      // Actualizar la imagen en Firestore
      await this.firebaseSvc.updateDocument(path, { image: user.image });
      
      // Guardar el usuario actualizado en el almacenamiento local
      this.utilsSvc.saveInLocalStorage('user', user);

      // Mostrar notificación de éxito
      this.utilsSvc.presentToast({
        message: 'Imagen actualizada exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline',
      });
    } catch (error) {
      console.error('Error al actualizar la imagen:', error);

      // Notificación de error en caso de fallo
      this.utilsSvc.presentToast({
        message: 'Error al actualizar la imagen',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline',
      });
    } finally {
      // Detener el indicador de carga
      const loading = await this.utilsSvc.loading();
      loading.dismiss();
    }
  }
}
