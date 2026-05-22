import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import Header from './components/Header/Header.tsx';
import Footer from './components/Footer/Footer.tsx';
import Accueil from './pages/Accueil/Accueil.tsx';
import Connexion from './pages/Connexion/Connexion.tsx';
import Inscription from './pages/Inscription/Inscription.tsx';
import AccueilConnecte from './pages/AccueilConnecte/AccueilConnecte.tsx';




// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isConnected } = useAuth();
  if (!isConnected) {
    return <Navigate to="/connexion" replace />;
  }
  return children;
};

function AppContent() {
  const { isConnected } = useAuth();

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {isConnected && <Header />}
      <main className={isConnected ? 'pt-20 px-4 max-w-2xl mx-auto' : ''}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/" element={isConnected ? <AccueilConnecte /> : <Accueil />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/profil" element={
            <ProtectedRoute>
              <div>Profil (à créer)</div>
            </ProtectedRoute>
          } />
          <Route path="/deposer" element={
            <ProtectedRoute>
              <div>Déposer (à créer)</div>
            </ProtectedRoute>
          } />
          {/* autres routes protégées */}
        </Routes>
      </main>
      {isConnected && <Footer />}
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