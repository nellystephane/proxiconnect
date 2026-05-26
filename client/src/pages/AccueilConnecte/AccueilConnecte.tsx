import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx;
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
        // Récupère toutes les annonces actives (ou tu peux filtrer par ville plus tard)
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
            <Link
              key={annonce._id}
              to={`/annonce/${annonce._id}`}
              className="glass rounded-2xl p-5 no-underline hover:shadow-lg transition space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF] font-bold">
                  {annonce.createur?.prenom?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {annonce.createur?.prenom} {annonce.createur?.nom}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {annonce.localisation?.ville || 'Localisation inconnue'}
                  </p>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 line-clamp-2">{annonce.titre}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">{annonce.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {annonce.nombreVues} vues
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(annonce.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="font-bold text-blue-600">
                  {annonce.prix.estGratuit
                    ? 'Gratuit'
                    : `${annonce.prix.montant.toLocaleString()} XOF`}
                </span>
                {annonce.prix.estNegociable && !annonce.prix.estGratuit && (
                  <span className="text-gray-400 text-xs ml-2">(négociable)</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccueilConnecte;