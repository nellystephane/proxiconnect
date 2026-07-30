# TODO – Correction page Admin

## ✅ Étape 1 : Header.tsx – Réparer le JSX cassé ✔
- [x] Corriger la structure du logo (fermer `</div>` manquant)
- [x] Corriger les `</Link>` / `<span>` orphelins
- [x] Nettoyer l'import inutilisé `MapPin`

## ✅ Étape 2 : Admin.tsx – Améliorations UI ✔
- [x] Ajouter ErrorMessage composant réutilisable avec bouton Réessayer
- [x] DashboardTab : gestion d'erreur avec retry (fetchDashboard)
- [x] Tous les onglets conservent recherche, filtre et pagination

## ✅ Étape 3 : App.tsx – Nettoyer le wrapper `<main>` pour admin ✔
- [x] Supprimer le doublon de fond pour les routes admin

## ✅ Étape 4 : AdminController.js – Corriger la requête abonnementsActifs ✔
- [x] Gérer le cas où `dateFin` est `null` avec `$or`

## ✅ Étape 5 : Build de vérification
- [ ] `npm run build` côté client

