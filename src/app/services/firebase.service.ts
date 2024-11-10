import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, getDoc, addDoc, collection, collectionData, query, where } from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Observable } from 'rxjs';

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
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvc.routerLink('/auth');
  }

  // Métodos específicos para viajes
  getViajesDisponibles(): Observable<any[]> {
    const ref = collection(getFirestore(), 'viajes');
    const q = query(ref, where('espacio', '>', 0)); // Puedes ajustar el filtro según tus necesidades
    return collectionData(q, { idField: 'id' });
  }

  getHistorialViajes(userId: string): Observable<any[]> {
    const ref = collection(getFirestore(), 'historialViajes');
    const q = query(ref, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' });
  }

  guardarViaje(viaje: any) {
    return addDoc(collection(getFirestore(), 'viajes'), viaje);
  }

  actualizarViaje(viaje: any) {
    const viajeDoc = doc(getFirestore(), `viajes/${viaje.id}`);
    return setDoc(viajeDoc, viaje, { merge: true });
  }

  agregarHistorial(viaje: any, role: string) {
    const user = this.utilsSvc.getFromLocalStorage('user');
    const historialItem = {
      userId: user.id,
      role: role,
      viajeId: viaje.id,
      fecha: new Date(),
      ...viaje
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
    return setDoc(doc(getFirestore(), path), data, { merge: true });
  }

  async uploadImage(path: string, data_url: string) {
    const storageRef = ref(getStorage(), path);
    await uploadString(storageRef, data_url, 'data_url');
    return getDownloadURL(storageRef);
  }

  obtenerViajes(): Observable<any[]> {
    return this.firestore.collection('viajes').valueChanges({ idField: 'id' });
  }
}
