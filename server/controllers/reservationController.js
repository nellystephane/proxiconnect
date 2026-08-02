const Reservation = require('../models/Reservation');
const Chambre = require('../models/Chambre');
const Hotel = require('../models/Hotel');
const { creerNotification } = require('../utils/notifier');

const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

// ─── Vérifie qu'une chambre est libre sur la période demandée ───
const estDisponible = async (chambreId, dateArrivee, dateDepart, exclureReservationId = null) => {
  const filtre = {
    chambre: chambreId,
    statut: { $in: ['en_attente', 'confirmée'] },
    dateArrivee: { $lt: dateDepart },
    dateDepart: { $gt: dateArrivee }
  };
  if (exclureReservationId) filtre._id = { $ne: exclureReservationId };
  const conflit = await Reservation.findOne(filtre);
  return !conflit;
};

// ─── Réserver une chambre ───
// POST /api/reservations
const createReservation = async (req, res) => {
  try {
    const { chambreId, dateArrivee, dateDepart, note } = req.body;

    if (!chambreId || !dateArrivee || !dateDepart) {
      return res.status(400).json({ message: 'Chambre, date d\'arrivée et date de départ sont obligatoires.' });
    }

    const arrivee = new Date(dateArrivee);
    const depart = new Date(dateDepart);
    if (isNaN(arrivee) || isNaN(depart) || depart <= arrivee) {
      return res.status(400).json({ message: 'Les dates de séjour sont invalides.' });
    }

    const chambre = await Chambre.findById(chambreId);
    if (!chambre || !chambre.disponible) {
      return res.status(404).json({ message: 'Chambre introuvable ou indisponible.' });
    }

    const hotel = await Hotel.findById(chambre.hotel);
    if (hotel.proprietaire.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas réserver dans votre propre établissement.' });
    }

    const libre = await estDisponible(chambreId, arrivee, depart);
    if (!libre) {
      return res.status(409).json({ message: 'Cette chambre est déjà réservée sur cette période.' });
    }

    const nombreNuits = Math.round((depart - arrivee) / MS_PAR_JOUR);
    const montantTotal = nombreNuits * chambre.prixParNuit;

    const reservation = await Reservation.create({
      client: req.user._id,
      hotelier: hotel.proprietaire,
      hotel: hotel._id,
      chambre: chambre._id,
      dateArrivee: arrivee,
      dateDepart: depart,
      nombreNuits,
      montantTotal,
      note: note || ''
    });

    await creerNotification(
      req.app.get('io'),
      hotel.proprietaire,
      'nouvelle_reservation',
      'Nouvelle réservation',
      `Une chambre de ${hotel.nom} vient d'être réservée pour ${nombreNuits} nuit${nombreNuits > 1 ? 's' : ''}.`,
      '/hotel'
    );

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Mes réservations ───
// GET /api/reservations/mes-reservations
const getMesReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ client: req.user._id })
      .populate('hotel', 'nom logo')
      .populate('chambre', 'type')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Réservations reçues (hôtelier) ───
// GET /api/reservations/recues
const getReservationsRecues = async (req, res) => {
  try {
    const reservations = await Reservation.find({ hotelier: req.user._id })
      .populate('client', 'nom prenom photo telephone')
      .populate('chambre', 'type')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Mettre à jour le statut d'une réservation ───
// PUT /api/reservations/:id/statut
const updateStatutReservation = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['en_attente', 'confirmée', 'annulée', 'terminée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée.' });
    if (reservation.hotelier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Seul l'hôtelier peut mettre à jour cette réservation." });
    }

    reservation.statut = statut;
    await reservation.save();

    await creerNotification(
      req.app.get('io'),
      reservation.client,
      'statut_reservation',
      'Réservation mise à jour',
      `Votre réservation est maintenant : ${statut.replace('_', ' ')}.`,
      '/profil'
    );

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Dates déjà occupées pour une chambre (pour désactiver le calendrier côté client) ───
// GET /api/reservations/chambre/:chambreId
const getReservationsChambre = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      chambre: req.params.chambreId,
      statut: { $in: ['en_attente', 'confirmée'] }
    }).select('dateArrivee dateDepart');
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = {
  createReservation,
  getMesReservations,
  getReservationsRecues,
  updateStatutReservation,
  getReservationsChambre
};
