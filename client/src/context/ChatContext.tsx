import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import API from '../api/axios';
import { getSocket, disconnectSocket } from '../api/socket';
import { useAuth } from './AuthContext';

interface ChatContextType {
  nonLus: number;
  rafraichirNonLus: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const INTERVALLE_RAFRAICHISSEMENT_MS = 20000;

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, token } = useAuth();
  const [nonLus, setNonLus] = useState(0);

  const rafraichirNonLus = useCallback(() => {
    if (!isConnected) return;
    API.get('/conversations/non-lus')
      .then(({ data }) => setNonLus(data.total))
      .catch(() => {});
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected || !token) {
      disconnectSocket();
      setNonLus(0);
      return;
    }

    rafraichirNonLus();
    const socket = getSocket(token);
    socket.on('conversation:maj', rafraichirNonLus);

    const intervalle = setInterval(rafraichirNonLus, INTERVALLE_RAFRAICHISSEMENT_MS);

    return () => {
      socket.off('conversation:maj', rafraichirNonLus);
      clearInterval(intervalle);
    };
  }, [isConnected, token, rafraichirNonLus]);

  return (
    <ChatContext.Provider value={{ nonLus, rafraichirNonLus }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
