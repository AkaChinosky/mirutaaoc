import { Component } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-role-selection',
  templateUrl: './role-selection.page.html',
  styleUrls: ['./role-selection.page.scss'],
})

  export class RoleSelectionPage {
    constructor(private firebaseSvc: FirebaseService, private utilsSvc: UtilsService) {}
  
    async selectRole(role: string) {
      const user = this.utilsSvc.getFromLocalStorage('user');
      if (user) {
        const path = `users/${user.uid}`;
        await this.firebaseSvc.updateDocument(path, { role });
        user.role = role;
        this.utilsSvc.saveInLocalStorage('user', user);
    
        this.utilsSvc.presentToast({
          message: `Rol seleccionado: ${role}`,
          color: 'success',
          duration: 2000,
        });
    
        // Redirigir según el rol seleccionado
        if (role === 'pasajero') {
          this.utilsSvc.routerLink('/main/home');
        } else if (role === 'conductor') {
          this.utilsSvc.routerLink('/main/conductor-home');
        }
      }
    }
  }