import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';



@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  loadingCtrl = inject(LoadingController);

  toastCtrl = inject(ToastController);

  router = inject(Router);

  modalCtrl = inject(ModalController)

  http = inject(HttpClient);

  //Loading

  loading() {
    return this.loadingCtrl.create({ spinner: 'crescent' })
  }


  //eltoast

  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts);
    toast.present();
  }



  //routerlink

  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }


  //localstorage guarda elementos 

  saveInLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value))
  }

  //Obtiene elementos del localstorage  
  getFromLocalStorage(key: string) {
    return JSON.parse(localStorage.getItem(key))
  }




async takePicture (promptLabelHeader: string)  {
  return await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    promptLabelHeader,
    promptLabelPhoto: 'Seleciona una imagen ',
    promptLabelPicture: 'Tomate una foto como Camilo rankiao'
  });
};




  //Model

  async presentModal(opts: ModalOptions) {
    const modal = await this.modalCtrl.create(opts);

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) return data;

  }


  dismissModal(data?: any) {
    return this.modalCtrl.dismiss(data)
  }


  getRoute(origin: [number, number], destination: [number, number]): Observable<any> {
    const accessToken = 'pk.eyJ1IjoiY2hpbm9za3kiLCJhIjoiY20zODU2c3dxMHA1cDJxb2xsbHE1bWdmYSJ9.D5UEJP-_CSnt4ABadGs8mw'; // Asegúrate de colocar tu token de Mapbox
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?steps=true&geometries=geojson&access_token=${accessToken}`;
    return this.http.get(url);  // Usando el servicio HttpClient para hacer la solicitud HTTP
  }
}
