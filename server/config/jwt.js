// Clé secrète JWT
// En production, utilisez une variable d'environnement JWT_SECRET forte.
// En développement, cette valeur de secours suffit (elle n'est pas utilisée
// sur un serveur public exposé à du trafic réel).
const JWT_SECRET = process.env.JWT_SECRET || 'proxiconnect_dev_secret_key_2024';

module.exports = { JWT_SECRET };

