import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import API from '../../api/axios';
import { Spinner, Button, Textarea, Card } from '../../components/ui';

const EvaluerLivreur = () => {
  const { id } = useParams<{ id: string }>();
  const [chargement, setChargement] = useState(true);
  const [peutEvaluer, setPeutEvaluer] = useState(false);
  const [dejaEvaluee, setDejaEvaluee] = useState(false);
  const [livraisonTerminee, setLivraisonTerminee] = useState(false);
  const [erreurChargement, setErreurChargement] = useState('');

  const [note, setNote] = useState(0);
  const [survol, setSurvol] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [reussite, setReussite] = useState(false);

  useEffect(() => {
    if (!id) return;
    API.get(`/evaluations-livreur/livraison/${id}/statut`)
      .then(({ data }) => {
        setPeutEvaluer(data.peutEvaluer);
        setDejaEvaluee(data.dejaEvaluee);
        setLivraisonTerminee(data.livraisonTerminee);
      })
      .catch((err) => setErreurChargement(err.response?.data?.message || 'Impossible de charger cette livraison.'))
      .finally(() => setChargement(false));
  }, [id]);

  const envoyerEvaluation = async () => {
    if (note === 0) {
      setErreur('Merci de choisir une note.');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      await API.post('/evaluations-livreur', { livraisonId: id, note, commentaire });
      setReussite(true);
    } catch (err: any) {
      setErreur(err.response?.data?.message || "Erreur lors de l'envoi de votre évaluation.");
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-md mx-auto pb-24 animate-fade-in">
      <Link to="/profil" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 no-underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour
      </Link>

      <Card variant="glass" className="text-center">
        {erreurChargement ? (
          <div className="py-6">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600">{erreurChargement}</p>
          </div>
        ) : reussite ? (
          <div className="py-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">Merci pour votre évaluation !</p>
            <p className="text-sm text-slate-500">Elle aide les livreurs à s'améliorer et les autres clients à choisir.</p>
          </div>
        ) : dejaEvaluee ? (
          <div className="py-6">
            <Star className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-900">Vous avez déjà évalué cette livraison.</p>
          </div>
        ) : !livraisonTerminee ? (
          <div className="py-6">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-900 mb-1">Cette livraison n'est pas encore terminée.</p>
            <p className="text-sm text-slate-500">Vous pourrez évaluer votre livreur une fois la livraison marquée comme livrée.</p>
          </div>
        ) : !peutEvaluer ? (
          <div className="py-6">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Cette livraison ne peut pas être évaluée pour le moment.</p>
          </div>
        ) : (
          <div>
            <p className="font-bold text-slate-900 mb-1">Comment s'est passée votre livraison ?</p>
            <p className="text-sm text-slate-500 mb-5">Notez votre livreur en quelques secondes.</p>

            <div className="flex items-center justify-center gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNote(n)}
                  onMouseEnter={() => setSurvol(n)}
                  onMouseLeave={() => setSurvol(0)}
                  className="p-1 transition-transform active:scale-90"
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                >
                  <Star className={`w-9 h-9 ${n <= (survol || note) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-white/20'} transition-colors`} />
                </button>
              ))}
            </div>

            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Un commentaire à ajouter ? (facultatif)"
              rows={3}
            />

            {erreur && <p className="text-xs text-red-500 flex items-center gap-1.5 mt-3"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>}

            <Button onClick={envoyerEvaluation} loading={envoi} fullWidth className="mt-4">
              Envoyer mon évaluation
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EvaluerLivreur;
