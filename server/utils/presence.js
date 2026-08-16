// ─── Présence utilisateur, en mémoire uniquement (pas de Redis, pas de
// file d'attente : un Map suffit à l'échelle de ce projet). ───
//
// Un utilisateur peut avoir plusieurs sockets ouverts (plusieurs onglets,
// téléphone + PC...) : on compte les connexions actives par utilisateur et
// on ne le considère "hors ligne" que lorsque son dernier socket se ferme.
//
// Fiabilité : Socket.IO envoie déjà un ping/pong interne (toutes les 25s
// par défaut) et ferme automatiquement une connexion qui ne répond plus
// (pingTimeout ~20s) — cela déclenche l'événement "disconnect" côté
// serveur même en cas de perte réseau brutale ou de mise en veille du
// téléphone, sans qu'on ait besoin de réimplémenter un heartbeat maison.

const socketsParUtilisateur = new Map(); // userId (string) -> Set<socketId>

const marquerEnLigne = (userId, socketId) => {
  const id = String(userId);
  if (!socketsParUtilisateur.has(id)) socketsParUtilisateur.set(id, new Set());
  socketsParUtilisateur.get(id).add(socketId);
};

/** Retire ce socket ; renvoie true si l'utilisateur vient de passer hors ligne (plus aucun socket ouvert). */
const marquerHorsLigne = (userId, socketId) => {
  const id = String(userId);
  const sockets = socketsParUtilisateur.get(id);
  if (!sockets) return true;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    socketsParUtilisateur.delete(id);
    return true;
  }
  return false;
};

const estEnLigne = (userId) => socketsParUtilisateur.has(String(userId));

/** Sous-ensemble en ligne parmi une liste d'identifiants (pour annoter une liste de participants sans une requête par utilisateur). */
const filtrerEnLigne = (userIds) => userIds.map(String).filter(estEnLigne);

module.exports = { marquerEnLigne, marquerHorsLigne, estEnLigne, filtrerEnLigne };
