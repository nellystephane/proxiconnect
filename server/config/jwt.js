require('dotenv').config();

// ─── Clé secrète JWT ───
// En production, JWT_SECRET DOIT être défini dans les variables d'environnement :
// le fallback ci-dessous est public (versionné sur GitHub), donc l'utiliser en
// production permettrait à quiconque de forger un token valide pour n'importe
// quel compte. On refuse donc de démarrer en production sans clé définie.
const FALLBACK_DEV_UNIQUEMENT = 'proxiconnect_dev_secret_a_changer';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '❌ JWT_SECRET est absent des variables d\'environnement. ' +
      'Définissez-le avant de démarrer en production (le serveur refuse de démarrer avec une clé prévisible et publique).'
    );
  }
  console.warn('⚠ JWT_SECRET absent des variables d\'environnement — utilisation d\'une clé de développement. Ne jamais utiliser en production.');
}

const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_DEV_UNIQUEMENT;

module.exports = { JWT_SECRET };
