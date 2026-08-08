import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import API from '../api/axios';
import { getSocket } from '../api/socket';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  _id: string;
  type: string;
  titre: string;
  message: string;
  lien: string;
  lu: boolean;
  createdAt: string;
}

interface NotificationContextType {
  nonLues: number;
  rafraichirNonLues: () => void;
  decrementer: () => void;
  reinitialiser: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const INTERVALLE_RAFRAICHISSEMENT_MS = 25000;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, token } = useAuth();
  const [nonLues, setNonLues] = useState(0);

  const rafraichirNonLues = useCallback(() => {
    if (!isConnected) return;
    API.get('/notifications/non-lues')
      .then(({ data }) => setNonLues(data.total))
      .catch(() => {});
  }, [isConnected]);

  const decrementer = useCallback(() => {
    setNonLues((n) => Math.max(0, n - 1));
  }, []);

  const reinitialiser = useCallback(() => setNonLues(0), []);

  useEffect(() => {
    if (!isConnected || !token) {
      setNonLues(0);
      return;
    }

    rafraichirNonLues();
    const socket = getSocket(token);
    const surNouvelleNotif = () => setNonLues((n) => n + 1);
    socket.on('notification:nouvelle', surNouvelleNotif);

    const intervalle = setInterval(rafraichirNonLues, INTERVALLE_RAFRAICHISSEMENT_MS);

    return () => {
      socket.off('notification:nouvelle', surNouvelleNotif);
      clearInterval(intervalle);
    };
  }, [isConnected, token, rafraichirNonLues]);

  return (
    <NotificationContext.Provider value={{ nonLues, rafraichirNonLues, decrementer, reinitialiser }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
