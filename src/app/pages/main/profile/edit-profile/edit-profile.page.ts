import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
})
export class EditProfilePage implements OnInit {
  editProfileForm: FormGroup;
  user: User;

  constructor(
    private fb: FormBuilder,
    private firebaseSvc: FirebaseService,
    private utilsSvc: UtilsService
  ) {}

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user'); // Carga el usuario desde el localStorage
    this.initForm();
  }

  initForm() {
    this.editProfileForm = this.fb.group({
      name: [this.user?.name || '', [Validators.required]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
    });
  }

  saveProfile() {
    if (this.editProfileForm.valid) {
      const updatedUser = { ...this.user, ...this.editProfileForm.value };
      const path = `users/${updatedUser.uid}`;

      this.firebaseSvc.updateDocument(path, updatedUser).then(() => {
        this.utilsSvc.saveInLocalStorage('user', updatedUser); // Guardamos los datos actualizados en el localStorage
        this.utilsSvc.presentToast({
          message: 'Perfil actualizado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline',
        });
      }).catch(error => {
        this.utilsSvc.presentToast({
          message: 'Error al actualizar el perfil',
          duration: 1500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      });
    }
  }
}
