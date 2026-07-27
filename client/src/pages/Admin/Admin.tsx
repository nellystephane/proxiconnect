import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Users, FileText, MessageSquare, CreditCard,
  TrendingUp, Activity, AlertTriangle, Ban, CheckCircle,
  XCircle, Eye, Search, ChevronLeft, ChevronRight,
  Trash2, RefreshCw, Star, MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import type { DashboardStats, UserProfil, Annonce, Avis, PaiementAdmin } from '../../types';

// ─── Helpers ───
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const statutBadge = (s: string) => {
  const map: Record<string, string> = {
    actif: 'bg-green-100 text-green-700',
    'expiré': 'bg-orange-100 text-orange-700',
    désactivé: 'bg-red-100 text-red-700',
    confirmé: 'bg-green-100 text-green-700',
    en_attente: 'bg-yellow-100 text-yellow-700',
    échoué: 'bg-red-100 text-red-700',
  };
  return `px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || 'bg-gray-100 text-gray-600'}`;
};

// ─── Composants réutilisables ───
const Loader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
  </div>
);

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <div className="glass rounded-2xl p-4 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
    </div>
  </div>
);

// ─── Onglet Dashboard ───
const DashboardTab = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then(r => setStats(r.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return <p className="text-red-500 text-center py-10">Erreur de chargement des statistiques.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Tableau de bord</h2>
        <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-600 transition">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard icon={FileText} label="Annonces" value={stats.totalAnnonces} color="bg-indigo-500" />
        <StatCard icon={MessageSquare} label="Avis" value={stats.totalAvis} color="bg-teal-500" />
        <StatCard icon={CreditCard} label="Paiements" value={stats.totalPaiements} color="bg-emerald-500" />
        <StatCard icon={Activity} label="Annonces actives" value={stats.annoncesActives} color="bg-green-500" />
        <StatCard icon={AlertTriangle} label="Expirées" value={stats.annoncesExpirees} color="bg-orange-500" />
        <StatCard icon={Ban} label="Bannis" value={stats.utilisateursBannis} color="bg-red-500" />
        <StatCard icon={TrendingUp} label="Inscriptions (30j)" value={stats.inscriptionsRecentes} color="bg-purple-500" />
      </div>

      {/* Chiffre d'affaires et abonnements */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Chiffre d'affaires</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.chiffreAffaires.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Abonnements actifs</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.abonnementsActifs}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Onglet Utilisateurs ───
const UsersTab = () => {
  const [users, setUsers] = useState<UserProfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [recherche, setRecherche] = useState('');
  const [filtreBannis, setFiltreBannis] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limite: 15 };
      if (recherche) params.q = recherche;
      if (filtreBannis) params.bannis = filtreBannis;
      const { data } = await API.get('/admin/users', { params });
      setUsers(data.users);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, recherche, filtreBannis]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBan = async (userId: string, estBanni: boolean) => {
    const motif = estBanni ? '' : prompt('Motif du bannissement :');
    if (!estBanni && motif === null) return;
    try {
      await API.put(`/admin/users/${userId}/ban`, { motif });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Supprimer définitivement cet utilisateur et toutes ses données ?')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] glass rounded-xl px-3 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Rechercher un utilisateur..."
            value={recherche}
            onChange={e => { setRecherche(e.target.value); setPage(1); }}
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>
        <select
          value={filtreBannis}
          onChange={e => { setFiltreBannis(e.target.value); setPage(1); }}
          className="glass rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="">Tous</option>
          <option value="false">Actifs</option>
          <option value="true">Bannis</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <>
          <p className="text-xs text-gray-500">{total} utilisateur{total > 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u._id} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.estBanni ? 'bg-red-400' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                    {u.prenom?.charAt(0)}{u.nom?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {u.prenom} {u.nom}
                      {u.estVerifie && <CheckCircle className="w-3.5 h-3.5 inline ml-1 text-blue-500" />}
                      {u.estBanni && <Ban className="w-3.5 h-3.5 inline ml-1 text-red-500" />}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email} · {u.telephone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{formatDate(u.createdAt)}</span>
                  <button onClick={() => handleBan(u._id, u.estBanni)} className={`p-2 rounded-lg transition ${u.estBanni ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`} title={u.estBanni ? 'Réactiver' : 'Bannir'}>
                    {u.estBanni ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(u._id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-gray-400 py-10">Aucun utilisateur trouvé.</p>}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Onglet Annonces ───
const AnnoncesTab = () => {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [recherche, setRecherche] = useState('');

  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limite: 15 };
      if (filtreStatut) params.statut = filtreStatut;
      if (recherche) params.q = recherche;
      const { data } = await API.get('/admin/annonces', { params });
      setAnnonces(data.annonces);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, filtreStatut, recherche]);

  useEffect(() => { fetchAnnonces(); }, [fetchAnnonces]);

  const handleStatutChange = async (id: string, statut: string) => {
    try {
      await API.put(`/admin/annonces/${id}/statut`, { statut });
      fetchAnnonces();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette annonce définitivement ?')) return;
    try {
      await API.delete(`/admin/annonces/${id}`);
      fetchAnnonces();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] glass rounded-xl px-3 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher une annonce..." value={recherche} onChange={e => { setRecherche(e.target.value); setPage(1); }} className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }} className="glass rounded-xl px-3 py-2 text-sm outline-none">
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="expiré">Expiré</option>
          <option value="désactivé">Désactivé</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <>
          <p className="text-xs text-gray-500">{total} annonce{total > 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {annonces.map(a => (
              <div key={a._id} className="glass rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/annonces/${a._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate max-w-[250px]">{a.titre}</Link>
                      <span className={statutBadge(a.statut)}>{a.statut}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {a.createur?.prenom} {a.createur?.nom} · {a.categorie} · {formatDate(a.createdAt)}
                    </p>
                    {a.prix && <p className="text-xs text-gray-600 mt-0.5">{a.prix.estGratuit ? 'Gratuit' : `${a.prix.montant?.toLocaleString('fr-FR')} FCFA`}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={a.statut}
                      onChange={e => handleStatutChange(a._id, e.target.value)}
                      className="text-xs rounded-lg px-2 py-1 border border-gray-200 outline-none bg-white"
                    >
                      <option value="actif">Actif</option>
                      <option value="expiré">Expiré</option>
                      <option value="désactivé">Désactivé</option>
                    </select>
                    <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {annonces.length === 0 && <p className="text-center text-gray-400 py-10">Aucune annonce trouvée.</p>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Onglet Avis ───
const AvisTab = () => {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtreSignales, setFiltreSignales] = useState('');

  const fetchAvis = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limite: 15 };
      if (filtreSignales === 'signales') params.signales = 'true';
      const { data } = await API.get('/admin/avis', { params });
      setAvis(data.avis);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, filtreSignales]);

  useEffect(() => { fetchAvis(); }, [fetchAvis]);

  const handleMasquer = async (id: string) => {
    try {
      await API.put(`/admin/avis/${id}/masquer`);
      fetchAvis();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet avis définitivement ?')) return;
    try {
      await API.delete(`/admin/avis/${id}`);
      fetchAvis();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={filtreSignales} onChange={e => { setFiltreSignales(e.target.value); setPage(1); }} className="glass rounded-xl px-3 py-2 text-sm outline-none">
          <option value="">Tous les avis</option>
          <option value="signales">Signalés</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <>
          <p className="text-xs text-gray-500">{total} avis</p>
          <div className="space-y-2">
            {avis.map(a => (
              <div key={a._id} className="glass rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= a.note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}
                      </div>
                      {a.signalements && a.signalements > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          {a.signalements} signalement{a.signalements > 1 ? 's' : ''}
                        </span>
                      )}
                      {a.estMasque && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">Masqué</span>}
                    </div>
                    {a.commentaire && <p className="text-sm text-gray-700 mt-1">{a.commentaire}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Par {typeof a.auteur === 'object' ? `${a.auteur.prenom} ${a.auteur.nom}` : 'Inconnu'}
                      {typeof a.annonce === 'object' && ` sur « ${a.annonce.titre} »`}
                      · {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleMasquer(a._id)} className={`p-1.5 rounded-lg transition ${a.estMasque ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={a.estMasque ? 'Afficher' : 'Masquer'}>
                      {a.estMasque ? <Eye className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {avis.length === 0 && <p className="text-center text-gray-400 py-10">Aucun avis trouvé.</p>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Onglet Paiements ───
const PaiementsTab = () => {
  const [paiements, setPaiements] = useState<PaiementAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtreStatut, setFiltreStatut] = useState('');

  const fetchPaiements = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limite: 15 };
      if (filtreStatut) params.statut = filtreStatut;
      const { data } = await API.get('/admin/paiements', { params });
      setPaiements(data.paiements);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, filtreStatut]);

  useEffect(() => { fetchPaiements(); }, [fetchPaiements]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }} className="glass rounded-xl px-3 py-2 text-sm outline-none">
          <option value="">Tous les paiements</option>
          <option value="confirmé">Confirmé</option>
          <option value="en_attente">En attente</option>
          <option value="échoué">Échoué</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <>
          <p className="text-xs text-gray-500">{total} paiement{total > 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {paiements.map(p => (
              <div key={p._id} className="glass rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">{p.type}</span>
                      <span className={statutBadge(p.statut)}>{p.statut}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {p.utilisateur?.prenom} {p.utilisateur?.nom} · {p.montant?.toLocaleString('fr-FR')} {p.devise || 'FCFA'}
                      · {p.methode}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
            {paiements.length === 0 && <p className="text-center text-gray-400 py-10">Aucun paiement trouvé.</p>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Page Admin principale ───
type Onglet = 'dashboard' | 'users' | 'annonces' | 'avis' | 'paiements';

const onglets: { id: Onglet; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'annonces', label: 'Annonces', icon: FileText },
  { id: 'avis', label: 'Avis', icon: MessageSquare },
  { id: 'paiements', label: 'Paiements', icon: CreditCard },
];

const Admin = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ongletActif, setOngletActif] = useState<Onglet>('dashboard');

  // Rediriger si pas admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  if (authLoading) return <Loader />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* En-tête */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Administration</h1>
            <p className="text-xs text-gray-500">ProxiConnect</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto pb-2">
            {onglets.map(o => (
              <button
                key={o.id}
                onClick={() => setOngletActif(o.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  ongletActif === o.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <o.icon className="w-4 h-4" />
                {o.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {ongletActif === 'dashboard' && <DashboardTab />}
        {ongletActif === 'users' && <UsersTab />}
        {ongletActif === 'annonces' && <AnnoncesTab />}
        {ongletActif === 'avis' && <AvisTab />}
        {ongletActif === 'paiements' && <PaiementsTab />}
      </div>
    </div>
  );
};

export default Admin;

