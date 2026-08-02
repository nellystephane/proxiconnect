import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ChatProvider } from './context/ChatContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
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
import MaBoutique from './pages/Vente/MaBoutique.tsx';
import BoutiquePublique from './pages/Vente/BoutiquePublique.tsx';
import Boutiques from './pages/Vente/Boutiques.tsx';
import MonRestaurant from './pages/Restauration/MonRestaurant.tsx';
import RestaurantPublique from './pages/Restauration/RestaurantPublique.tsx';
import Restaurants from './pages/Restauration/Restaurants.tsx';
import MonHotel from './pages/Hotel/MonHotel.tsx';
import HotelPublique from './pages/Hotel/HotelPublique.tsx';
import Hotels from './pages/Hotel/Hotels.tsx';
import MonProfilLivreur from './pages/Livraison/MonProfilLivreur.tsx';
import Livreurs from './pages/Livraison/Livreurs.tsx';
import MonEspace from './pages/MonEspace/MonEspace.tsx';
import Conversations from './pages/Messages/Conversations.tsx';
import Conversation from './pages/Messages/Conversation.tsx';
import Notifications from './pages/Notifications/Notifications.tsx';

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

  // Seule la page d'accueil VISITEUR (marketing) gère sa propre navigation
  // complète (header + footer maison). Le fil d'annonces des membres connectés
  // n'a lui qu'un bandeau de bienvenue, pas une vraie nav : il a donc besoin
  // du Header/Footer partagés comme n'importe quelle autre page, sans quoi un
  // membre connecté se retrouvait sans recherche, sans déconnexion et sans
  // accès à ses favoris/profil tant qu'il restait sur "/".
  const estAccueilVisiteur = location.pathname === '/' && !isConnected;
  const afficherHeader = !estAccueilVisiteur;
  const afficherFooter = !estAccueilVisiteur;

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

          <Route path="/mon-espace" element={
            <ProtectedRoute>
              <MonEspace />
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <Conversations />
            </ProtectedRoute>
          } />
          <Route path="/messages/:id" element={
            <ProtectedRoute>
              <Conversation />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/vente" element={
            <ProtectedRoute>
              <MaBoutique />
            </ProtectedRoute>
          } />
          <Route path="/boutiques" element={<Boutiques />} />
          <Route path="/boutique/:id" element={<BoutiquePublique />} />

          <Route path="/restauration" element={
            <ProtectedRoute>
              <MonRestaurant />
            </ProtectedRoute>
          } />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurant/:id" element={<RestaurantPublique />} />

          <Route path="/hotel" element={
            <ProtectedRoute>
              <MonHotel />
            </ProtectedRoute>
          } />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotel/:id" element={<HotelPublique />} />

          <Route path="/livraison" element={
            <ProtectedRoute>
              <MonProfilLivreur />
            </ProtectedRoute>
          } />
          <Route path="/livreurs" element={<Livreurs />} />

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
      <ChatProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
