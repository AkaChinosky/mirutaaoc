import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, getDoc, addDoc, collection, collectionData, query, where } from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { map, Observable } from 'rxjs';
import { orderBy } from 'firebase/firestore/lite';




@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore);
  utilsSvc = inject(UtilsService);

  getAuth() {
    return getAuth();
  }

  // Autenticación
  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  sendRecoveryEmail(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  signOut() {
    const user = this.utilsSvc.getFromLocalStorage('user');
    if (user) {
      const path = `users/${user.uid}`;
      this.updateDocument(path, { role: null }); // Elimina el rol
    }
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvc.routerLink('/auth');
  }
  

  // Métodos específicos para viajes
  getViajesDisponibles(): Observable<any[]> {
    const ref = collection(getFirestore(), 'viajes');
    const q = query(ref, where('espacio', '>', 0));
    return collectionData(q, { idField: 'id' });
  }

  getHistorialViajes(userId: string): Observable<any[]> {
    const ref = collection(getFirestore(), 'historialViajes');
    const q = query(ref, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' });
  }

  guardarViaje(viaje: any) {
    const viajeData = { ...viaje, estado: 'viajes' };
    return addDoc(collection(getFirestore(), 'viajes'), viajeData);
  }

  actualizarViaje(viaje: any, data?: Partial<any>) {
    const viajeDoc = doc(getFirestore(), `viajes/${viaje.id || viaje}`);
    
    const updateData = data ? data : viaje;
    return setDoc(viajeDoc, updateData, { merge: true });
  }

  guardarHistorial(viaje: any, role: string) {
    const user = this.utilsSvc.getFromLocalStorage('user');
    const historialItem = {
      userId: user.id,
      userName: user.name,
      role: role,
      viajeId: viaje.id,
      fecha: new Date(),
      vehiculo: viaje.vehiculo,
      patente: viaje.patente,
      price: viaje.price,
      espacio: viaje.espacio,
    };
    return addDoc(collection(getFirestore(), 'historialViajes'), historialItem);
  }

  // Otros métodos
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }

  addDocument(path: string, data: any) {
    return addDoc(collection(getFirestore(), path), data);
  }

  updateDocument(path: string, data: any) {
    const docRef = doc(getFirestore(), path);
    return setDoc(docRef, data, { merge: true });
  }

  async uploadImage(path: string, data_url: string) {
    const storageRef = ref(getStorage(), path);
    await uploadString(storageRef, data_url, 'data_url');
    return getDownloadURL(storageRef);
  }

  obtenerViajes(): Observable<any[]> {
    return this.firestore.collection('viajes').valueChanges({ idField: 'id' });
  }

  obtenerViajeEnCurso(userId: string): Observable<any> {
    const ref = collection(getFirestore(), 'viajes');
    const q = query(ref, where('userId', '==', userId), where('estado', '==', 'en_curso'));
    return collectionData(q, { idField: 'id' }).pipe(
      map((viajes) => (viajes.length > 0 ? viajes[0] : null))
    );
  }

  // Verifica si el usuario tiene un viaje en curso
  async verificarViajeEnCurso(userId: string): Promise<boolean> {
    const ref = collection(getFirestore(), 'viajes');
    const q = query(ref, where('userId', '==', userId), where('estado', '==', 'en_curso'));
    const viajesEnCurso = await collectionData(q).pipe(map((viajes) => viajes.length > 0)).toPromise();
    return viajesEnCurso;
  }

  iniciarViaje(viaje: any) {
    return this.verificarViajeEnCurso(viaje.userId).then((enCurso) => {
      if (!enCurso) {
        return this.guardarViaje(viaje);
      } else {
        throw new Error("Ya tienes un viaje en curso");
      }
    });
  }


  guardarUsuario(datos: any): Promise<void> {
    const id = this.firestore.createId(); // Genera un ID único
    return this.firestore.collection('usuarios').doc(id).set(datos);
  }
  


  obtenerMensajes(tripId: string): Observable<any[]> {
    const ref = collection(getFirestore(), `viajes/${tripId}/mensajes`);
    const q = query(ref, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' });
  }
  
  enviarMensaje(tripId: string, message: any) {
    const ref = collection(getFirestore(), `viajes/${tripId}/mensajes`);
    return addDoc(ref, { ...message, timestamp: new Date() });
  }

  guardarVehiculo(vehiculoData: any) {
    const userId = vehiculoData.user;
    return this.firestore.collection('vehiculos').doc(userId).set(vehiculoData);
  }
  
  obtenerVehiculo(userId: string) {
    return this.firestore.collection('vehiculos').doc(userId).valueChanges();
  }
  
  eliminarVehiculo(userId: string) {
    return this.firestore.collection('vehiculos').doc(userId).delete();
  }

  finalizarViaje(viajeId: string): Promise<void> {
    return this.firestore.collection('viajes').doc(viajeId).update({ estado: 'finalizado', horaFin: new Date().toLocaleString() });
  }

  getChatMessages(viajeId: string) {
    return this.firestore
      .collection(`chats/${viajeId}/messages`, ref => ref.orderBy('timestamp', 'asc'))
      .valueChanges({ idField: 'id' });
  }

  sendMessage(viajeId: string, message: any) {
    return this.firestore.collection(`chats/${viajeId}/messages`).add(message);
  }

  createChat(viajeId: string) {
    const chatRef = this.firestore.collection(`chats`).doc(viajeId);
    return chatRef.set({ createdAt: new Date().toISOString() });
  }

  guardarIniciarViaje(viajeData: any) {
    const userId = viajeData.user; // Suponiendo que el formulario incluye un campo `user` (nombre o ID)
    return this.firestore.collection('iniciarViajes').doc(userId).set(viajeData);
  }
  
  obtenerIniciarViaje(userId: string) {
    return this.firestore.collection('iniciarViajes').doc(userId).valueChanges();
  }
  
  eliminarIniciarViaje(userId: string) {
    return this.firestore.collection('iniciarViajes').doc(userId).delete();
  }

  

}

  


