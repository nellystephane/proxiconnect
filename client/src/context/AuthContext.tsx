import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API from '../api/axios.ts';

interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  photo?: string;
  localisation?: any;
  estVerifie?: boolean;
  role?: 'user' | 'admin';
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isConnected: boolean;
  isAdmin: boolean;
  loading: boolean;   // ← propriété indispensable
  login: (email: string, motDePasse: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);   // ← commence à true

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      setIsConnected(true);
      setIsAdmin(parsedUser.role === 'admin');
    }
    setLoading(false);   // ← fin de l'initialisation
  }, []);

  const login = async (email: string, motDePasse: string) => {
    const { data } = await API.post('/users/login', { email, motDePasse });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);
    setIsConnected(true);
    setIsAdmin(data.role === 'admin');
  };

  const register = async (userData: any) => {
    const { data } = await API.post('/users/register', userData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);
    setIsConnected(true);
    setIsAdmin(data.role === 'admin');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsConnected(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isConnected, isAdmin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
