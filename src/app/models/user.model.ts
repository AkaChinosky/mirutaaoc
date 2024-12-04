export interface User {
    uid: string;
    email: string;
    password: string;
    name: string;
    image: string;
    role: string;
  }
  
  export interface Message {
    sender: string; // Nombre del remitente
    text: string;   // Contenido del mensaje
    timestamp: Date; // Fecha y hora del mensaje
  }
  
  export interface Viaje {
    id: string;           // Identificador único del viaje
    vehiculo: string;     // Nombre del vehículo
    patente: string;      // Patente del vehículo
    espacio: number;      // Espacios disponibles
    price: number;        // Precio del viaje
    destino: [number, number]; // Coordenadas del destino
    destinoNombre: string; // Nombre del destino
    pasajeros: string[];   // Lista de usuarios unidos al viaje
    mensajes?: Message[];  // Mensajes asociados al viaje
  }
  