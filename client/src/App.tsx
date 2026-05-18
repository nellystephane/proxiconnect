
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.tsx';
import Footer from './components/Footer/Footer.tsx';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 w-full">
        <Routes>
          {/* Page d'accueil intégrée directement */}
          <Route path="/" element={
            <>
              {/* Section Hero */}
              <section className="bg-blue-600 text-white py-16 px-4">
                <div className="max-w-6xl mx-auto text-center">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Trouvez un service près de chez vous
                  </h1>
                  <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                    ProxiConnect met en relation les talents locaux avec des clients à proximité. 
                    Services, vente, location : tout est à portée de main.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/annonces" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 no-underline">
                      Voir les annonces
                    </a>
                    <a href="/deposer" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 no-underline">
                      Déposer une annonce
                    </a>
                  </div>
                </div>
              </section>

              {/* Comment ça marche */}
              <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Comment ça marche ?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                      <h3 className="font-bold text-gray-800 mb-2">Inscrivez-vous</h3>
                      <p className="text-gray-500 text-sm">Créez votre compte gratuitement et complétez votre profil.</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                      <h3 className="font-bold text-gray-800 mb-2">Publiez une annonce</h3>
                      <p className="text-gray-500 text-sm">Décrivez votre service, ajoutez des photos et votre localisation.</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                      <h3 className="font-bold text-gray-800 mb-2">Trouvez des clients</h3>
                      <p className="text-gray-500 text-sm">Recevez des demandes et développez votre activité près de chez vous.</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          } />

          {/* Autres pages (vides pour l'instant) */}
          <Route path="/deposer" element={<div className="text-center py-20 text-gray-500">Page dépôt d'annonce</div>} />
          <Route path="/connexion" element={<div className="text-center py-20 text-gray-500">Page connexion</div>} />
          <Route path="/inscription" element={<div className="text-center py-20 text-gray-500">Page inscription</div>} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
