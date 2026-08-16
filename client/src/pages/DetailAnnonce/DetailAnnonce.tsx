import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Eye, Clock, Phone, Heart, Star, Pencil, Trash2,
  ChevronLeft, ChevronRight, ImageOff, AlertCircle, Send, ShieldCheck,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useContacter } from '../../hooks/useContacter';
import API from '../../api/axios';
import { Spinner, Button, Textarea } from '../../components/ui';
import { getCategorieColor } from '../../utils/categories';
import type { Annonce, Avis } from '../../types';

const DetailAnnonce = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isConnected } = useAuth();
  const { contacter, contactEnCours, contactErreur } = useContacter();

  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  const [avis, setAvis] = useState<Avis[]>([]);
  const [stats, setStats] = useState<{ moyenne: number; total: number }>({ moyenne: 0, total: 0 });
  const [avisErreur, setAvisErreur] = useState(false);

  const [favoris, setFavoris] = useState<string[]>([]);
  const [favoriLoading, setFavoriLoading] = useState(false);
  const [favoriErreur, setFavoriErreur] = useState('');

  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [envoiAvis, setEnvoiAvis] = useState(false);
  const [avisMessage, setAvisMessage] = useState('');

  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setErreur('');
    API.get(`/annonces/${id}`)
      .then(({ data }) => { if (!annule) setAnnonce(data); })
      .catch(() => { if (!annule) setErreur("Cette annonce n'existe plus ou a été retirée."); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [id]);

  useEffect(() => {
    if (!annonce?.createur?._id) return;
    let annule = false;
    setAvisErreur(false);
    API.get(`/avis/utilisateur/${annonce.createur._id}`)
      .then(({ data }) => {
        if (annule) return;
        setAvis(data.avis || []);
        setStats(data.stats || { moyenne: 0, total: 0 });
      })
      .catch(() => { if (!annule) setAvisErreur(true); });
    return () => { annule = true; };
  }, [annonce?.createur?._id]);

  useEffect(() => {
    if (!isConnected) return;
    let annule = false;
    API.get('/users/favoris')
      .then(({ data }) => { if (!annule) setFavoris(data.map((a: Annonce) => a._id)); })
      .catch(() => { if (!annule) setFavoriErreur("Impossible de charger vos favoris pour l'instant."); });
    return () => { annule = true; };
  }, [isConnected]);

  const estProprietaire = isConnected && annonce && user?._id === annonce.createur._id;
  const estFavori = annonce ? favoris.includes(annonce._id) : false;
  const dejaNote = annonce ? avis.some(a => {
    const annonceId = typeof a.annonce === 'string' ? a.annonce : a.annonce?._id;
    return a.auteur._id === user?._id && annonceId === annonce._id;
  }) : false;

  const toggleFavori = useCallback(async () => {
    if (!annonce) return;
    if (!isConnected) { navigate('/connexion'); return; }
    setFavoriLoading(true);
    setFavoriErreur('');
    const etaitFavori = favoris.includes(annonce._id);
    // Mise à jour optimiste : l'icône réagit tout de suite, avant la réponse serveur.
    setFavoris((prev) => (etaitFavori ? prev.filter((id) => id !== annonce._id) : [...prev, annonce._id]));
    try {
      const { data } = await API.put(`/users/favoris/${annonce._id}`);
      setFavoris(data.favoris);
    } catch {
      // Échec : on annule la mise à jour optimiste et on informe l'utilisateur
      // au lieu de laisser l'action échouer silencieusement.
      setFavoris((prev) => (etaitFavori ? [...prev, annonce._id] : prev.filter((id) => id !== annonce._id)));
      setFavoriErreur("Impossible de mettre à jour vos favoris. Réessayez.");
    } finally {
      setFavoriLoading(false);
    }
  }, [annonce, isConnected, navigate, favoris]);

  const handleSupprimer = async () => {
    if (!annonce) return;
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return;
    setSuppressionEnCours(true);
    try {
      await API.delete(`/annonces/${annonce._id}`);
      navigate('/profil', { replace: true });
    } catch {
      setSuppressionEnCours(false);
    }
  };

  const handleEnvoiAvis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annonce) return;
    setEnvoiAvis(true);
    setAvisMessage('');
    try {
      await API.post('/avis', { concerne: annonce.createur._id, annonce: annonce._id, note, commentaire });
      setAvisMessage('Merci, votre avis a été publié.');
      setCommentaire('');
      const { data } = await API.get(`/avis/utilisateur/${annonce.createur._id}`);
      setAvis(data.avis || []);
      setStats(data.stats || { moyenne: 0, total: 0 });
    } catch (err: any) {
      setAvisMessage(err.response?.data?.message || "Impossible d'envoyer votre avis.");
    } finally {
      setEnvoiAvis(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (erreur || !annonce) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 gap-3">
        <AlertCircle className="w-10 h-10 text-slate-300" />
        <p className="text-slate-500 font-medium">{erreur || 'Annonce introuvable.'}</p>
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">Retour à l'accueil</Link>
      </div>
    );
  }

  const categoryColor = getCategorieColor(annonce.categorie);
  const hasPhotos = annonce.photos?.length > 0;

  return (
    <div className="max-w-2xl mx-auto pb-32 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="glass-pill inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary mb-4 no-underline transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      {/* ─── Galerie : grande image immersive + contrôles verre ─── */}
      <div
        className="relative rounded-[26px] overflow-hidden bg-slate-100 mb-5 animate-scale-in"
        style={{ boxShadow: `var(--glass-specular), 0 20px 44px -16px ${categoryColor}66` }}
      >
        {hasPhotos ? (
          <div className="relative aspect-[16/10]">
            <img
              src={annonce.photos[photoIndex]}
              alt={`${annonce.titre} - photo ${photoIndex + 1}`}
              className="w-full h-full object-cover"
            />
            {annonce.photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIndex((p) => (p - 1 + annonce.photos.length) % annonce.photos.length)}
                  className="glass-control absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <button
                  onClick={() => setPhotoIndex((p) => (p + 1) % annonce.photos.length)}
                  className="glass-control absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {annonce.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIndex(i)}
                      aria-label={`Photo ${i + 1}`}
                      className={`w-2 h-2 rounded-full transition-all ${i === photoIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/[0.02]">
            <ImageOff className="w-10 h-10 text-slate-300" />
          </div>
        )}

        <button
          onClick={toggleFavori}
          disabled={favoriLoading}
          className="glass-control absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition disabled:opacity-60"
          aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-5 h-5 transition-colors ${estFavori ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
        </button>
      </div>

      {favoriErreur && (
        <p className="text-xs text-red-500 mb-3 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{favoriErreur}</p>
      )}

      {/* ─── En-tête : chips catégorie/premium + titre + méta ─── */}
      <div className="space-y-3 mb-5 animate-slide-up">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {annonce.categorie}
          </span>
          {annonce.estPremium && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1 dark:bg-amber-400/15 dark:text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5" /> Premium
            </span>
          )}
          {annonce.statut !== 'actif' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 capitalize">
              {annonce.statut}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{annonce.titre}</h1>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{annonce.nombreVues} vues</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(annonce.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ─── Prix + vendeur regroupés dans une carte verre ─── */}
      <div className="glass rounded-[22px] p-5 mb-5 animate-slide-up">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/70">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Prix</p>
            <p className="text-3xl font-bold text-primary tracking-tight">
              {annonce.prix.estGratuit ? 'Gratuit' : `${annonce.prix.montant.toLocaleString('fr-FR')} XOF`}
            </p>
          </div>
          {annonce.prix.estNegociable && !annonce.prix.estGratuit && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full">Négociable</span>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.14), rgba(94,92,230,0.14))' }}
          >
            {annonce.createur?.photo
              ? <img src={annonce.createur.photo} alt="" className="w-full h-full object-cover" />
              : (annonce.createur?.prenom?.charAt(0) || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{annonce.createur?.prenom} {annonce.createur?.nom}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              {annonce.localisation?.ville}{annonce.localisation?.quartier && ` • ${annonce.localisation.quartier}`}
            </div>
            {stats.total > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{stats.moyenne}</span>
                <span className="text-slate-400">({stats.total} avis)</span>
              </div>
            )}
          </div>
        </div>

        {isConnected && !estProprietaire && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => contacter(annonce.createur._id, 'annonce', annonce._id, annonce.titre)}
              loading={contactEnCours}
              icon={!contactEnCours ? <MessageCircle className="w-4 h-4" /> : undefined}
            >
              Contacter
            </Button>
            {annonce.createur?.telephone && (
              <a
                href={`tel:${annonce.createur.telephone}`}
                className="btn-liquid-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm no-underline flex-1"
              >
                <Phone className="w-4 h-4" /> Appeler
              </a>
            )}
          </div>
        )}
      </div>

      {/* Actions propriétaire */}
      {estProprietaire && (
        <div className="flex items-center gap-3 mb-5">
          <Link
            to={`/deposer/${annonce._id}`}
            className="btn-liquid-ghost flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm no-underline"
          >
            <Pencil className="w-4 h-4" /> Modifier
          </Link>
          <button
            onClick={handleSupprimer}
            disabled={suppressionEnCours}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      )}

      {contactErreur && (
        <p className="text-xs text-red-500 mb-3 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{contactErreur}</p>
      )}

      {!isConnected && (
        <Link
          to="/inscription"
          className="btn-liquid-primary block w-full text-center py-3.5 rounded-2xl text-sm no-underline mb-5"
        >
          S'inscrire pour contacter {annonce.createur?.prenom}
        </Link>
      )}

      {/* ─── Description ─── */}
      <div className="glass-light rounded-[22px] p-5 mb-5 animate-slide-up">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Description</h3>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{annonce.description}</p>
      </div>

      {/* Précisions localisation */}
      {annonce.localisation?.details && (
        <div className="glass-light rounded-[22px] p-5 mb-5 animate-slide-up">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Précisions sur la localisation
          </h3>
          <p className="text-sm text-slate-600">{annonce.localisation.details}</p>
        </div>
      )}

      {/* ─── Avis ─── */}
      <div className="glass rounded-[22px] p-5 animate-slide-up">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-2">
          <Star className="w-3.5 h-3.5" /> Avis {stats.total > 0 && <span className="text-slate-400 normal-case">({stats.total})</span>}
        </h3>

        {avisErreur ? (
          <p className="text-sm text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />Impossible de charger les avis pour le moment.</p>
        ) : avis.length === 0 ? (
          <p className="text-sm text-slate-400 mb-4">Aucun avis pour le moment.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {avis.slice(0, 5).map((a) => (
              <div key={a._id} className="glass-light rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800">{a.auteur.prenom} {a.auteur.nom?.charAt(0)}.</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= a.note ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-white/20'}`} />
                    ))}
                  </div>
                </div>
                {a.commentaire && <p className="text-sm text-slate-600">{a.commentaire}</p>}
              </div>
            ))}
          </div>
        )}

        {isConnected && !estProprietaire && !dejaNote && (
          <form onSubmit={handleEnvoiAvis} className="glass-light rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Laisser un avis</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setNote(n)} aria-label={`${n} étoile${n > 1 ? 's' : ''}`}>
                  <Star className={`w-6 h-6 transition-colors ${n <= note ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200 dark:text-white/20'}`} />
                </button>
              ))}
            </div>
            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Partagez votre expérience (optionnel)"
            />
            {avisMessage && <p className="text-xs text-slate-500">{avisMessage}</p>}
            <Button type="submit" loading={envoiAvis} icon={!envoiAvis ? <Send className="w-4 h-4" /> : undefined}>
              {envoiAvis ? 'Envoi…' : "Envoyer l'avis"}
            </Button>
          </form>
        )}
      </div>

      {/* ─── Barre d'action sticky mobile : contacter / appeler ─── */}
      {isConnected && !estProprietaire && annonce.createur?.telephone && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 lg:hidden" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <div className="glass-elevated rounded-2xl p-2 flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => contacter(annonce.createur._id, 'annonce', annonce._id, annonce.titre)}
              loading={contactEnCours}
              icon={!contactEnCours ? <MessageCircle className="w-4 h-4" /> : undefined}
            >
              Contacter
            </Button>
            <a
              href={`tel:${annonce.createur.telephone}`}
              className="btn-liquid-primary flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm no-underline"
            >
              <Phone className="w-4 h-4" /> Appeler
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailAnnonce;
