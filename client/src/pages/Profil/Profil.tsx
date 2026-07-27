import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon, MapPin, Phone, Mail, LogOut, Trash2, Pencil, Save,
  Star, Eye, Clock, Plus, Lock, ShieldCheck, Crown, ChevronRight,
  AlertCircle, Check, X as XIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import ImageUploader from '../../components/ImageUploader';
import LocalisationPopup, { LocalisationValue } from '../../components/LocalisationPopup/LocalisationPopup';
import { getCategorieColor } from '../../utils/categories';
import type { Annonce, Avis, AbonnementStatut } from '../../types';

type Onglet = 'apercu' | 'annonces' | 'avis' | 'parametres';

const Profil = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState<Onglet>('apercu');

  // ─── Édition du profil ───
  const [editForm, setEditForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    telephone: user?.telephone || '',
    photo: user?.photo || '',
  });
  const [localisation, setLocalisation] = useState<LocalisationValue>({
    pays: user?.localisation?.pays || 'Bénin',
    ville: user?.localisation?.ville || '',
    quartier: user?.localisation?.quartier || '',
    details: user?.localisation?.details || '',
  });
  const [showLocPopup, setShowLocPopup] = useState(false);
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilMessage, setProfilMessage] = useState('');

  // ─── Mot de passe ───
  const [pwdForm, setPwdForm] = useState({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');

  // ─── Abonnement ───
  const [abonnement, setAbonnement] = useState<AbonnementStatut | null>(null);

  // ─── Mes annonces ───
  const [mesAnnonces, setMesAnnonces] = useState<Annonce[]>([]);
  const [quota, setQuota] = useState({ utilisees: 0, autorisees: 1 });
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);

  // ─── Avis reçus ───
  const [avisRecus, setAvisRecus] = useState<Avis[]>([]);
  const [statsAvis, setStatsAvis] = useState({ moyenne: 0, total: 0 });

  // ─── Suppression du compte ───
  const [confirmSuppression, setConfirmSuppression] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  useEffect(() => {
    API.get('/paiements/statut').then(({ data }) => setAbonnement(data)).catch(() => {});
  }, []);

  const fetchMesAnnonces = useCallback(() => {
    setLoadingAnnonces(true);
    API.get('/annonces/mes-annonces')
      .then(({ data }) => {
        setMesAnnonces(data.annonces || []);
        setQuota(data.quota || { utilisees: 0, autorisees: 1 });
      })
      .catch(() => {})
      .finally(() => setLoadingAnnonces(false));
  }, []);

  useEffect(() => { fetchMesAnnonces(); }, [fetchMesAnnonces]);

  useEffect(() => {
    if (!user?._id) return;
    API.get(`/avis/utilisateur/${user._id}`)
      .then(({ data }) => {
        setAvisRecus(data.avis || []);
        setStatsAvis(data.stats || { moyenne: 0, total: 0 });
      })
      .catch(() => {});
  }, [user?._id]);

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfil(true);
    setProfilMessage('');
    try {
      await API.put('/users/profil', { ...editForm, localisation });
      setProfilMessage('Profil mis à jour avec succès.');
      // Rafraîchir la session locale
      const { data } = await API.get('/users/profil');
      localStorage.setItem('user', JSON.stringify({ ...data, token: localStorage.getItem('token') }));
    } catch (err: any) {
      setProfilMessage(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSavingProfil(false);
    }
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    setPwdMessage('');
    try {
      await API.put('/users/password', pwdForm);
      setPwdMessage('Mot de passe modifié avec succès.');
      setPwdForm({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' });
    } catch (err: any) {
      setPwdMessage(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleDeleteAnnonce = async (id: string) => {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return;
    try {
      await API.delete(`/annonces/${id}`);
      fetchMesAnnonces();
    } catch {
      // silencieux
    }
  };

  const handleDeleteAccount = async () => {
    setSuppressionEnCours(true);
    try {
      await API.delete('/users');
      logout();
      navigate('/', { replace: true });
    } catch {
      setSuppressionEnCours(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const onglets: { id: Onglet; label: string }[] = [
    { id: 'apercu', label: 'Aperçu' },
    { id: 'annonces', label: 'Mes annonces' },
    { id: 'avis', label: 'Avis reçus' },
    { id: 'parametres', label: 'Paramètres' },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in space-y-6">
      {/* En-tête profil */}
      <div className="flex items-center gap-4 p-5 rounded-2xl glass">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-[#007AFF] font-bold text-xl overflow-hidden flex-shrink-0">
          {user?.photo ? <img src={user.photo} alt={user.prenom} className="w-full h-full object-cover" /> : (user?.prenom?.charAt(0) || 'U')}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 truncate">{user?.prenom} {user?.nom}</h1>
            {user?.estVerifie && <ShieldCheck className="w-4 h-4 text-[#007AFF] flex-shrink-0" />}
          </div>
          <p className="text-sm text-slate-500 truncate flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{user?.email}</p>
          {user?.localisation?.ville && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{user.localisation.ville}</p>
          )}
        </div>
      </div>

      {/* Carte abonnement */}
      <Link
        to="/abonnements"
        className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#007AFF] to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {abonnement?.estAbonne ? `Offre ${abonnement.type?.replace('abonnement_', '').replace('j', ' jours')}` : 'Offre Gratuite'}
            </p>
            <p className="text-xs text-white/80">
              {abonnement?.estAbonne
                ? `Expire dans ${abonnement.joursRestants} jour(s)`
                : 'Passez à un abonnement pour plus d\'annonces'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/80" />
      </Link>

      {/* Onglets */}
      <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 rounded-xl p-1">
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              onglet === o.id ? 'bg-white text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ─── APERÇU ─── */}
      {onglet === 'apercu' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl glass text-center">
              <p className="text-2xl font-bold text-slate-900">{quota.utilisees}/{quota.autorisees}</p>
              <p className="text-xs text-slate-400 mt-1">Annonces actives</p>
            </div>
            <div className="p-4 rounded-xl glass text-center">
              <p className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                {statsAvis.moyenne || '—'} {statsAvis.total > 0 && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
              </p>
              <p className="text-xs text-slate-400 mt-1">{statsAvis.total} avis reçus</p>
            </div>
          </div>

          <Link
            to="/deposer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#007AFF] text-white font-semibold hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" /> Déposer une nouvelle annonce
          </Link>
        </div>
      )}

      {/* ─── MES ANNONCES ─── */}
      {onglet === 'annonces' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{quota.utilisees} annonce(s) active(s) sur {quota.autorisees} autorisée(s)</p>
            <Link to="/deposer" className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </Link>
          </div>

          {loadingAnnonces ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : mesAnnonces.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Vous n'avez pas encore publié d'annonce.</div>
          ) : (
            mesAnnonces.map((a) => (
              <div key={a._id} className="flex items-center gap-3 p-3 rounded-xl glass">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategorieColor(a.categorie) }} />
                <Link to={`/annonces/${a._id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{a.titre}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span className="capitalize">{a.statut}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.nombreVues}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </Link>
                <Link to={`/deposer/${a._id}`} className="p-2 rounded-lg hover:bg-slate-100 transition">
                  <Pencil className="w-4 h-4 text-slate-500" />
                </Link>
                <button onClick={() => handleDeleteAnnonce(a._id)} className="p-2 rounded-lg hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── AVIS REÇUS ─── */}
      {onglet === 'avis' && (
        <div className="space-y-3 animate-fade-in">
          {statsAvis.total > 0 && (
            <div className="flex items-center gap-2 p-4 rounded-xl glass">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-slate-900">{statsAvis.moyenne}</span>
              <span className="text-sm text-slate-400">sur {statsAvis.total} avis</span>
            </div>
          )}
          {avisRecus.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Aucun avis reçu pour le moment.</div>
          ) : (
            avisRecus.map((a) => (
              <div key={a._id} className="p-3 rounded-xl glass">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800">{a.auteur.prenom} {a.auteur.nom?.charAt(0)}.</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= a.note ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                {a.commentaire && <p className="text-sm text-slate-600">{a.commentaire}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── PARAMÈTRES ─── */}
      {onglet === 'parametres' && (
        <div className="space-y-6 animate-fade-in">
          {/* Édition profil */}
          <form onSubmit={handleSaveProfil} className="p-5 rounded-2xl glass space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5" /> Informations personnelles
            </p>

            <div className="flex items-center gap-3">
              <ImageUploader currentImage={editForm.photo} onUpload={(url) => setEditForm({ ...editForm, photo: url })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nom</label>
                <input
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Prénom</label>
                <input
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={editForm.telephone}
                  onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                  placeholder="+229 01 23 45 67 89"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLocPopup(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-100/80 rounded-xl text-sm hover:bg-gray-200/60 transition-all"
            >
              <span className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                {localisation.ville ? `${localisation.ville}${localisation.quartier ? ', ' + localisation.quartier : ''}` : 'Définir ma localisation'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {profilMessage && (
              <p className={`text-xs flex items-center gap-1.5 ${profilMessage.includes('succès') ? 'text-emerald-600' : 'text-red-500'}`}>
                {profilMessage.includes('succès') ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {profilMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfil}
              className="w-full py-3 bg-[#007AFF] text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {savingProfil ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </form>

          {/* Mot de passe */}
          <form onSubmit={handleChangePwd} className="p-5 rounded-2xl glass space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Sécurité
            </p>
            <input
              type="password"
              placeholder="Mot de passe actuel"
              value={pwdForm.ancienMotDePasse}
              onChange={(e) => setPwdForm({ ...pwdForm, ancienMotDePasse: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={pwdForm.nouveauMotDePasse}
              onChange={(e) => setPwdForm({ ...pwdForm, nouveauMotDePasse: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
            <input
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={pwdForm.confirmation}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmation: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
            {pwdMessage && (
              <p className={`text-xs flex items-center gap-1.5 ${pwdMessage.includes('succès') ? 'text-emerald-600' : 'text-red-500'}`}>
                {pwdMessage.includes('succès') ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {pwdMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={savingPwd}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-60"
            >
              Changer le mot de passe
            </button>
          </form>

          {/* Déconnexion / suppression */}
          <div className="p-5 rounded-2xl glass space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
            >
              <LogOut className="w-4 h-4" /> Se déconnecter
            </button>

            {!confirmSuppression ? (
              <button
                onClick={() => setConfirmSuppression(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" /> Supprimer mon compte
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                <p className="text-sm text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Cette action supprimera définitivement votre compte, vos annonces et vos avis. Cette action est irréversible.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmSuppression(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg glass text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <XIcon className="w-4 h-4" /> Annuler
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={suppressionEnCours}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60"
                  >
                    {suppressionEnCours ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Confirmer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <LocalisationPopup
        open={showLocPopup}
        initialValue={localisation}
        onClose={() => setShowLocPopup(false)}
        onValidate={(val) => setLocalisation(val)}
      />
    </div>
  );
};

export default Profil;
