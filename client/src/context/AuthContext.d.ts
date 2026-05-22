import { ReactNode } from 'react';
interface User {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    photo?: string;
    localisation?: any;
    estVerifie?: boolean;
    token: string;
}
interface AuthContextType {
    user: User | null;
    token: string | null;
    isConnected: boolean;
    login: (email: string, motDePasse: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
}
export declare const AuthProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};
