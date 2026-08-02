require('dotenv').config();

// ─── Clé secrète JWT ───
// En production, JWT_SECRET DOIT être défini dans les variables d'environnement.
// Le fallback ci-dessous n'est là que pour ne pas bloquer le développement local.
if (!process.env.JWT_SECRET) {
  console.warn('⚠ JWT_SECRET absent des variables d\'environnement — utilisation d\'une clé de développement. Ne pas utiliser en production.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'proxiconnect_dev_secret_a_changer';

module.exports = { JWT_SECRET };
