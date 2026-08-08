import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './axios';

let socket: Socket | null = null;

// ─── Récupère (ou crée) la connexion socket pour l'utilisateur connecté ───
export const getSocket = (token: string): Socket => {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
