import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard';
import API from '../../api/axios';

interface Annonce {
  _id: string;
  titre: string;
  description: string;
  categorie: string;
  prix: { montant: number; estNegociable: boolean; estGratuit: boolean };
  photos: string[];
  localisation: { ville: string; quartier: string };
  createur: { nom: string; prenom: string };
  nombreVues: number;
  createdAt: string;
}

const AccueilConnecte = () => {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnonces = async () => {
      try {
        const { data } = await API.get('/annonces?limite=20');
        setAnnonces(data.annonces || []);
      } catch (err) {
        console.error('Erreur chargement annonces', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnonces();
  }, []);

  return (
    <div className="space-y-6 pb-8 animate-slide-up">
      {/* Bienvenue */}
      <div className="glass rounded-3xl p-6 text-center md:text-left">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.prenom || 'Membre'} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Découvrez les annonces près de chez vous
        </p>
      </div>

      {/* Liste des annonces */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : annonces.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Aucune annonce pour le moment.</p>
          <Link to="/deposer" className="text-[#007AFF] text-sm font-medium mt-2 inline-block">
            Soyez le premier à déposer une annonce
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {annonces.map((annonce) => (
            <AnnonceCard key={annonce._id} annonce={annonce} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AccueilConnecte;