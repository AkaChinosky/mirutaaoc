import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';



@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  })

firebaseSvc = inject(FirebaseService);
utilsSvc = inject(UtilsService)



  ngOnInit() {
  }


async submit(){
    if (this.form.valid) {

      const loading = await this.utilsSvc.loading();
      await loading.present();

      this.firebaseSvc.signIn(this.form.value as User).then(res => {


        this.getUserInfo(res.user.uid);

      }).catch(error => {
        console.log(error);

        this.utilsSvc.presentToast({
          message: error.message,
          duration: 3000,
          color: 'primary',
          position: 'middle',
          icon: 'alert-circle-outline'
        })


      }).finally(() => {
        loading.dismiss();
      })
    }

  }


  async getUserInfo(uid: string) {
    const loading = await this.utilsSvc.loading();
    await loading.present();
  
    const path = `users/${uid}`;
    this.firebaseSvc.getDocument(path).then((user: User) => {
      this.utilsSvc.saveInLocalStorage('user', user);
  
      // Verificar si el usuario ya tiene un rol asignado
      if (user.role === 'pasajero') {
        this.utilsSvc.routerLink('/main/home');
      } else if (user.role === 'conductor') {
        this.utilsSvc.routerLink('/main/conductor-home');
      } else {
        // Si no tiene rol, redirigir a la selección de roles
        this.utilsSvc.routerLink('/role-selection');
      }
  
      this.utilsSvc.presentToast({
        message: `Bienvenido ${user.name}`,
        duration: 2000,
        color: 'primary',
      });
      this.form.reset();
    }).catch(error => {
      console.log(error);
      this.utilsSvc.presentToast({
        message: error.message,
        duration: 3000,
        color: 'danger',
      });
    }).finally(() => {
      loading.dismiss();
    });
  }
}

