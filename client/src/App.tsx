import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ChatProvider } from './context/ChatContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { PlatformProvider } from './context/PlatformContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import Header from './components/Header/Header.tsx';
import Footer from './components/Footer/Footer.tsx';
import DashboardLayout from './components/DashboardLayout/DashboardLayout.tsx';
import PwaManager from './components/Pwa/PwaManager.tsx';
import Accueil from './pages/Accueil/Accueil.tsx';
import Connexion from './pages/Connexion/Connexion.tsx';
import Inscription from './pages/Inscription/Inscription.tsx';
import Dashboard from './pages/Dashboard/Dashboard.tsx';
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
import EvaluerLivreur from './pages/Livraison/EvaluerLivreur.tsx';
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

// Routes qui appartiennent à l'espace "compte" piloté par la Sidebar/DashboardLayout.
// La racine "/" en fait partie une fois connecté (Dashboard) ; en visiteur elle reste
// la page marketing publique gérée par le bloc Header/Footer classique.
// Distinction volontaire entre routes "exactes" (aucune sous-route privée, ex: "/hotel")
// et routes à sous-chemins ("/messages/:id", "/deposer/:id") : un simple préfixe
// aurait fait passer à tort les pages PUBLIQUES "/hotels" et "/hotel/:id" (détail
// d'un hôtel, consultable par tous) dans l'espace dashboard privé.
const ROUTES_DASHBOARD_EXACTES = [
  '/profil', '/favoris', '/abonnements', '/mon-espace',
  '/notifications', '/vente', '/restauration', '/hotel',
];
const PREFIXES_DASHBOARD_AVEC_SOUS_ROUTES = ['/messages', '/deposer', '/livraison'];
const estCheminDashboard = (pathname: string) =>
  ROUTES_DASHBOARD_EXACTES.includes(pathname) ||
  PREFIXES_DASHBOARD_AVEC_SOUS_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

function AppContent() {
  const { isConnected } = useAuth();
  const location = useLocation();

  // Seule la page d'accueil VISITEUR (marketing) gère sa propre navigation
  // complète (header + footer maison).
  const estAccueilVisiteur = location.pathname === '/' && !isConnected;

  // Tout l'espace "compte" (dashboard, mes espaces pro, messages, notifications,
  // favoris, abonnement, profil, dépôt d'annonce...) passe par la Sidebar plutôt
  // que par le Header/Footer public — c'est le nouveau "centre de contrôle".
  const estEspaceDashboard = isConnected && (
    location.pathname === '/' || estCheminDashboard(location.pathname)
  );

  const afficherHeader = !estAccueilVisiteur && !estEspaceDashboard;
  const afficherFooter = !estAccueilVisiteur && !estEspaceDashboard;

  const routesElement = (
    <Routes>
      <Route path="/" element={isConnected ? <Dashboard /> : <Accueil />} />
      <Route path="/explorer" element={
        <ProtectedRoute>
          <AccueilConnecte />
        </ProtectedRoute>
      } />
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
      <Route path="/livraison/:id/evaluer" element={
        <ProtectedRoute>
          <EvaluerLivreur />
        </ProtectedRoute>
      } />
      <Route path="/livreurs" element={<Livreurs />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-screen">
      {afficherHeader && <Header />}
      {estEspaceDashboard ? (
        <DashboardLayout>{routesElement}</DashboardLayout>
      ) : (
        <main className={afficherHeader ? 'pt-20 pb-8 px-4 max-w-2xl mx-auto' : ''}>
          {routesElement}
        </main>
      )}
      {afficherFooter && <Footer />}
      <PwaManager />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <NotificationProvider>
            <PlatformProvider>
              <AppContent />
            </PlatformProvider>
          </NotificationProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
