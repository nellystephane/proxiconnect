import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User as UserIcon, MapPin, Phone, Mail, LogOut, Trash2, Pencil, Save,
  Star, Eye, Clock, Plus, Lock, ShieldCheck, Crown, ChevronRight,
  AlertCircle, Check, X as XIcon, Store, Activity, FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { Skeleton, Card, Button, Input, Badge, EmptyState } from '../../components/ui';
import ImageUploader from '../../components/ImageUploader';
import LocalisationPopup, { LocalisationValue } from '../../components/LocalisationPopup/LocalisationPopup';
import { getCategorieColor } from '../../utils/categories';
import type { Annonce, Avis, AbonnementStatut } from '../../types';

type Onglet = 'apercu' | 'annonces' | 'avis' | 'parametres';

const tempsEcoule = (date: string) => {
  const secondes = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secondes < 60) return "à l'instant";
  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return `il y a ${Math.floor(heures / 24)} j`;
};

const Profil = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ongletParam = searchParams.get('onglet');
  const ongletsValides: Onglet[] = ['apercu', 'annonces', 'avis', 'parametres'];
  const [onglet, setOnglet] = useState<Onglet>(
    ongletsValides.includes(ongletParam as Onglet) ? (ongletParam as Onglet) : 'apercu'
  );

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
  const [avisErreur, setAvisErreur] = useState(false);

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
    setAvisErreur(false);
    API.get(`/avis/utilisateur/${user._id}`)
      .then(({ data }) => {
        setAvisRecus(data.avis || []);
        setStatsAvis(data.stats || { moyenne: 0, total: 0 });
      })
      .catch(() => setAvisErreur(true));
  }, [user?._id]);

  // ─── Activité récente : fusion des annonces et avis déjà chargés (aucun nouvel
  // endpoint), triée par date, pour donner un vrai fil d'activité dans l'Aperçu. ───
  const activiteRecente = useMemo(() => {
    const items: { id: string; date: string; type: 'annonce' | 'avis'; contenu: React.ReactNode }[] = [
      ...mesAnnonces.map((a) => ({
        id: `annonce-${a._id}`,
        date: a.createdAt,
        type: 'annonce' as const,
        contenu: <>Annonce publiée : <span className="font-semibold text-slate-800">{a.titre}</span></>,
      })),
      ...avisRecus.map((a) => ({
        id: `avis-${a._id}`,
        date: a.createdAt,
        type: 'avis' as const,
        contenu: <>Avis reçu de <span className="font-semibold text-slate-800">{a.auteur.prenom}</span> ({a.note}/5)</>,
      })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [mesAnnonces, avisRecus]);

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
      <Card variant="glass" className="flex items-center gap-4" padding="lg">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-primary font-bold text-xl overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.14), rgba(94,92,230,0.14))', boxShadow: 'var(--glass-specular)' }}>
          {user?.photo ? <img src={user.photo} alt={user.prenom} className="w-full h-full object-cover" /> : (user?.prenom?.charAt(0) || 'U')}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 truncate">{user?.prenom} {user?.nom}</h1>
            {user?.estVerifie && <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />}
          </div>
          <p className="text-sm text-slate-500 truncate flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{user?.email}</p>
          {user?.localisation?.ville && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{user.localisation.ville}</p>
          )}
        </div>
      </Card>

      {/* Carte abonnement */}
      <Link
        to="/abonnements"
        className="flex items-center justify-between p-4 rounded-2xl no-underline text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
        style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--glass-specular), var(--shadow-glow-primary)' }}
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

      {/* Carte Mon espace (Vente / Restauration / Hôtel / Livraison) */}
      <Link to="/mon-espace" className="no-underline">
        <Card variant="glass" interactive className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" strokeWidth={2.1} />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-900">Mon espace</p>
              <p className="text-xs text-slate-500">Devenez vendeur, restaurateur, hôtelier ou livreur</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Card>
      </Link>

      {/* Onglets */}
      <div className="flex items-center gap-1.5 overflow-x-auto glass-light rounded-full p-1.5">
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              onglet === o.id ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
            style={onglet === o.id ? { background: 'var(--gradient-primary)' } : undefined}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ─── APERÇU ─── */}
      {onglet === 'apercu' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <Card variant="glass" className="text-center">
              <p className="text-2xl font-bold text-slate-900">{quota.utilisees}/{quota.autorisees}</p>
              <p className="text-xs text-slate-400 mt-1">Annonces actives</p>
            </Card>
            <Card variant="glass" className="text-center">
              <p className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                {statsAvis.moyenne || '—'} {statsAvis.total > 0 && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
              </p>
              <p className="text-xs text-slate-400 mt-1">{statsAvis.total} avis reçus</p>
            </Card>
          </div>

          <Link
            to="/deposer"
            className="btn-liquid-primary w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm no-underline"
          >
            <Plus className="w-4 h-4" /> Déposer une nouvelle annonce
          </Link>

          {/* Activité récente */}
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3"><Activity className="w-4 h-4 text-primary" strokeWidth={2.2} /> Activité récente</h2>
            <Card variant="glass" padding="none" className="overflow-hidden">
              {loadingAnnonces ? (
                <div className="p-4"><Skeleton className="h-10 rounded-xl" count={3} /></div>
              ) : activiteRecente.length === 0 ? (
                <EmptyState icon={FileText} title="Aucune activité pour le moment" />
              ) : (
                <ul className="divide-y divide-white/40" role="list">
                  {activiteRecente.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'avis' ? 'bg-amber-400/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                        {item.type === 'avis' ? <Star className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-700">{item.contenu}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{tempsEcoule(item.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ─── MES ANNONCES ─── */}
      {onglet === 'annonces' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{quota.utilisees} annonce(s) active(s) sur {quota.autorisees} autorisée(s)</p>
            <Link to="/deposer" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </Link>
          </div>

          {loadingAnnonces ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 rounded-xl" count={3} />
            </div>
          ) : mesAnnonces.length === 0 ? (
            <Card variant="glass-light">
              <EmptyState
                icon={FileText}
                title="Vous n'avez pas encore publié d'annonce"
                action={<Link to="/deposer" className="text-sm font-semibold text-primary hover:underline">Déposer une annonce</Link>}
              />
            </Card>
          ) : (
            mesAnnonces.map((a) => (
              <Card key={a._id} variant="glass" padding="sm" className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategorieColor(a.categorie) }} />
                <Link to={`/annonces/${a._id}`} className="flex-1 min-w-0 no-underline">
                  <p className="text-sm font-semibold text-slate-900 truncate">{a.titre}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <Badge tone={a.statut === 'actif' ? 'success' : 'neutral'} size="sm" className="capitalize">{a.statut}</Badge>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.nombreVues}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </Link>
                <Link to={`/deposer/${a._id}`} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <Pencil className="w-4 h-4 text-slate-500" />
                </Link>
                <button onClick={() => handleDeleteAnnonce(a._id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ─── AVIS REÇUS ─── */}
      {onglet === 'avis' && (
        <div className="space-y-3 animate-fade-in">
          {statsAvis.total > 0 && (
            <Card variant="glass" className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-slate-900">{statsAvis.moyenne}</span>
              <span className="text-sm text-slate-400">sur {statsAvis.total} avis</span>
            </Card>
          )}
          {avisErreur ? (
            <div className="text-center py-12 text-red-500 text-sm flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Impossible de charger vos avis pour le moment.
            </div>
          ) : avisRecus.length === 0 ? (
            <Card variant="glass-light">
              <EmptyState icon={Star} title="Aucun avis reçu pour le moment" />
            </Card>
          ) : (
            avisRecus.map((a) => (
              <Card key={a._id} variant="glass" padding="sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800">{a.auteur.prenom} {a.auteur.nom?.charAt(0)}.</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= a.note ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                {a.commentaire && <p className="text-sm text-slate-600">{a.commentaire}</p>}
              </Card>
            ))
          )}
        </div>
      )}

      {/* ─── PARAMÈTRES ─── */}
      {onglet === 'parametres' && (
        <div className="space-y-6 animate-fade-in">
          {/* Édition profil */}
          <form onSubmit={handleSaveProfil}>
            <Card variant="glass" className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5" /> Informations personnelles
              </p>

              <div className="flex items-center gap-3">
                <ImageUploader currentImage={editForm.photo} onUpload={(url) => setEditForm({ ...editForm, photo: url })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nom"
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                />
                <Input
                  label="Prénom"
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                />
              </div>

              <Input
                label="Téléphone"
                value={editForm.telephone}
                onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                placeholder="+229 01 23 45 67 89"
                icon={<Phone className="w-4 h-4" />}
              />

              <button
                type="button"
                onClick={() => setShowLocPopup(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-100/70 rounded-xl text-sm hover:bg-slate-200/60 transition-all duration-200"
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

              <Button type="submit" loading={savingProfil} fullWidth icon={<Save className="w-4 h-4" />}>
                Enregistrer
              </Button>
            </Card>
          </form>

          {/* Mot de passe */}
          <form onSubmit={handleChangePwd}>
            <Card variant="glass" className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Sécurité
              </p>
              <Input
                type="password"
                placeholder="Mot de passe actuel"
                value={pwdForm.ancienMotDePasse}
                onChange={(e) => setPwdForm({ ...pwdForm, ancienMotDePasse: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Nouveau mot de passe"
                value={pwdForm.nouveauMotDePasse}
                onChange={(e) => setPwdForm({ ...pwdForm, nouveauMotDePasse: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={pwdForm.confirmation}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmation: e.target.value })}
              />
              {pwdMessage && (
                <p className={`text-xs flex items-center gap-1.5 ${pwdMessage.includes('succès') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pwdMessage.includes('succès') ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {pwdMessage}
                </p>
              )}
              <Button type="submit" loading={savingPwd} fullWidth variant="subtle">
                Changer le mot de passe
              </Button>
            </Card>
          </form>

          {/* Déconnexion / suppression */}
          <Card variant="glass" className="space-y-3">
            <Button onClick={handleLogout} fullWidth variant="outline" icon={<LogOut className="w-4 h-4" />}>
              Se déconnecter
            </Button>

            {!confirmSuppression ? (
              <button
                onClick={() => setConfirmSuppression(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
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
                  <Button onClick={() => setConfirmSuppression(false)} variant="ghost" className="flex-1" icon={<XIcon className="w-4 h-4" />}>
                    Annuler
                  </Button>
                  <Button onClick={handleDeleteAccount} loading={suppressionEnCours} variant="danger" className="flex-1" icon={<Trash2 className="w-4 h-4" />}>
                    Confirmer
                  </Button>
                </div>
              </div>
            )}
          </Card>
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
