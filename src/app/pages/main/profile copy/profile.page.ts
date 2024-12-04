import { Component, inject, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { User } from 'src/app/models/user.model';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  router = inject(Router);  

  ngOnInit() {
 
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  signOut() {
    this.firebaseSvc.signOut();
  }


  editProfile() {

    this.router.navigate(['/edit-profile']);  
  }


  viewTerms() {

    this.router.navigate(['/terms']); 
  }

  async takeImage() {
    try {
      const user = this.user();
      const path = `users/${user.uid}`;
      const imagePath = `${user.uid}/profile`;


      const dataUrl = (await this.utilsSvc.takePicture('imagen')).dataUrl;


      const loading = await this.utilsSvc.loading();
      await loading.present();


      user.image = await this.firebaseSvc.uploadImage(imagePath, dataUrl);


      await this.firebaseSvc.updateDocument(path, { image: user.image });
      

      this.utilsSvc.saveInLocalStorage('user', user);


      this.utilsSvc.presentToast({
        message: 'Imagen actualizada exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline',
      });
    } catch (error) {
      console.error('Error al actualizar la imagen:', error);


      this.utilsSvc.presentToast({
        message: 'Error al actualizar la imagen',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline',
      });
    } finally {

      const loading = await this.utilsSvc.loading();
      loading.dismiss();
    }
  }
}
