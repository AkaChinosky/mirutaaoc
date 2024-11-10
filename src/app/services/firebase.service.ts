import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, updateCurrentUser, sendPasswordResetEmail} from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, getDoc, addDoc, collection, collectionData, query} from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  auth = inject(AngularFireAuth)
  firestore = inject(AngularFirestore)
  utilsSvc = inject(UtilsService)


  getAuth() {
    return getAuth();
  }


  //autenticacion
  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password)
  }

  //Crear usuario
  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password)
  }

  //Actualizar usuarios
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName })
  }

  //cambiar contrasena por email

  sendRecoveryEmail(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  //Funcion para cerrar sesion de los usuarios
  signOut() {
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvc.routerLink('/auth');
  }

  //Funcion para los items

  getcollectionData(path: string, collectionQuery?: any) {
    const ref = collection(getFirestore(), path);
    return collectionData(query(ref, collectionQuery))
  }


  //base de datos
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
}