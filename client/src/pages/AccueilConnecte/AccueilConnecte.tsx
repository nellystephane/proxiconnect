import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Package, Eye, Star, TrendingUp, ChevronRight, Sparkles,
  MapPin, User, Zap, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const AccueilConnecte = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    annonces: 0,
    vues: 0,
    avis: 0,
    moyenne: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // On récupère les annonces de l'utilisateur pour calculer les stats
        const { data: annonces } = await API.get('/annonces/mes-annonces');
        const totalVues = annonces.reduce((acc: number, a: any) => acc + (a.nombreVues || 0), 0);

        // Pour les avis, on utilise la route existante
        const { data: avisData } = await API.get(`/avis/utilisateur/${user?._id}`);
        
        setStats({
          annonces: annonces.length,
          vues: totalVues,
          avis: avisData.stats?.total || 0,
          moyenne: avisData.stats?.moyenne || 0
        });
      } catch (err) {
        console.error('Erreur chargement stats', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStats();
  }, [user]);

  return (
    <div className="space-y-8 animate-slide-up pb-8">
      {/* ===== EN-TÊTE BIENVENUE ===== */}
      <div className="glass rounded-3xl p-6 md:p-8 text-center md:text-left md:flex md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Bonjour, {user?.prenom || 'Membre'} 👋
          </h1>
          <p className="text-gray-500 mt-2">
            Gérez vos annonces et développez votre activité locale.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3 justify-center md:justify-end">
          <Link
            to="/deposer"
            className="inline-flex items-center gap-2 bg-[#007AFF] text-white px-5 py-2.5 rounded-full font-semibold text-sm no-underline hover:bg-blue-600 transition shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Déposer une annonce
          </Link>
          <Link
            to="/profil"
            className="inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full font-semibold text-sm text-gray-700 no-underline hover:shadow-md transition"
          >
            <User className="w-4 h-4" />
            Profil
          </Link>
        </div>
      </div>

      {/* ===== STATISTIQUES ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Mes annonces', value: stats.annonces, icon: <Package className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Vues totales', value: stats.vues, icon: <Eye className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Avis reçus', value: stats.avis, icon: <Star className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Note moyenne', value: stats.moyenne ? `${stats.moyenne}/5` : 'N/A', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stat.value}
            </div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ===== RACCOURCIS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/mes-annonces" className="glass rounded-2xl p-5 flex items-center gap-4 no-underline hover:shadow-md transition group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Mes annonces</h3>
            <p className="text-sm text-gray-500">Gérez vos annonces en ligne</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link to="/abonnements" className="glass rounded-2xl p-5 flex items-center gap-4 no-underline hover:shadow-md transition group">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Booster ma visibilité</h3>
            <p className="text-sm text-gray-500">Découvrir les abonnements</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* ===== CALL-TO-ACTION ABONNEMENT ===== */}
      <div className="glass rounded-3xl p-6 md:p-8 text-center bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-100/50">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Boostez votre activité</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Passez à la vitesse supérieure
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
          Avec un abonnement, vos annonces sont mises en avant, vous pouvez ajouter des vidéos et publier plus d’annonces.
        </p>
        <Link
          to="/abonnements"
          className="inline-flex items-center gap-2 bg-[#007AFF] text-white px-6 py-3 rounded-full font-semibold text-sm no-underline hover:bg-blue-600 transition shadow-md shadow-blue-500/20"
        >
          Voir les offres
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default AccueilConnecte;