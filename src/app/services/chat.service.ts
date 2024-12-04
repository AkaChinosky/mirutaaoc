import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatPath = '/chats';

  constructor(private db: AngularFireDatabase) {}

  getMessages(): Observable<any[]> {
    return this.db.list(this.chatPath).valueChanges();
  }

  sendMessage(sender: string, text: string): void {
    const message = { sender, text, timestamp: Date.now() };
    this.db.list(this.chatPath).push(message);
  }
}
