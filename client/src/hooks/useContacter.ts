import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

type ContexteType = 'annonce' | 'produit' | 'plat' | 'chambre' | 'livraison';

export const useContacter = () => {
  const navigate = useNavigate();
  const [contactEnCours, setContactEnCours] = useState(false);
  const [contactErreur, setContactErreur] = useState('');

  const contacter = useCallback(async (destinataireId: string, type?: ContexteType, id?: string, titre?: string) => {
    setContactEnCours(true);
    setContactErreur('');
    try {
      const { data } = await API.post('/conversations', {
        destinataireId,
        contexte: type ? { type, id, titre } : undefined,
      });
      navigate(`/messages/${data._id}`);
    } catch (err: any) {
      setContactErreur(err.response?.data?.message || 'Impossible de démarrer la conversation.');
    } finally {
      setContactEnCours(false);
    }
  }, [navigate]);

  return { contacter, contactEnCours, contactErreur };
};
