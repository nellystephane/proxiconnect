import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import Header from './components/Header/Header.tsx';
import Footer from './components/Footer/Footer.tsx';
import Accueil from './pages/Accueil/Accueil.tsx';
import Connexion from './pages/Connexion/Connexion.tsx';
import Inscription from './pages/Inscription/Inscription.tsx';
import AccueilConnecte from './pages/AccueilConnecte/AccueilConnecte.tsx';
import Deposer from './pages/Deposer/Deposer.tsx';
import Annonces from './pages/Annonces/Annonces.tsx';
import DetailAnnonce from './pages/DetailAnnonce/DetailAnnonce.tsx';
import Profil from './pages/Profil/Profil.tsx';
import Abonnements from './pages/Abonnements/Abonnements.tsx';
import Favoris from './pages/Favoris/Favoris.tsx';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isConnected, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isConnected) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
};

function AppContent() {
  const { isConnected } = useAuth();
  const location = useLocation();

  // La page d'accueil gère son propre en-tête (marketing pour les visiteurs,
  // fil d'annonces pour les membres) : on n'affiche pas le Header partagé dessus.
  const afficherHeader = location.pathname !== '/';
  const afficherFooter = isConnected && location.pathname !== '/';

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {afficherHeader && <Header />}
      <main className={afficherHeader ? 'pt-20 pb-8 px-4 max-w-2xl mx-auto' : ''}>
        <Routes>
          <Route path="/" element={isConnected ? <AccueilConnecte /> : <Accueil />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/annonces" element={<Annonces />} />
          <Route path="/annonces/:id" element={<DetailAnnonce />} />

          <Route path="/profil" element={
            <ProtectedRoute>
              <Profil />
            </ProtectedRoute>
          } />
          <Route path="/favoris" element={
            <ProtectedRoute>
              <Favoris />
            </ProtectedRoute>
          } />
          <Route path="/abonnements" element={
            <ProtectedRoute>
              <Abonnements />
            </ProtectedRoute>
          } />
          <Route path="/deposer" element={
            <ProtectedRoute>
              <Deposer />
            </ProtectedRoute>
          } />
          <Route path="/deposer/:id" element={
            <ProtectedRoute>
              <Deposer />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {afficherFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
