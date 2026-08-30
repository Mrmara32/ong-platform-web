# ONG Platform Web

Frontend Vite + React branché sur `ong-platform-api`.

## Installation

```bash
npm install
cp .env.example .env    # ajuster VITE_API_URL si besoin
npm run dev              # http://localhost:5173
```

Assure-toi que l'API tourne (`ong-platform-api`, `npm run dev` sur le port 4000)
et que le seed a été exécuté (`npm run seed`) avant de te connecter.

## PWA (installabilité + cache app shell)

Le frontend est configuré comme PWA installable via `vite-plugin-pwa` :
- Manifeste (`manifest.webmanifest`), icônes 192/512px, thème marine cohérent
  avec l'identité visuelle
- Service worker généré (Workbox) qui met en cache l'app shell (JS/CSS/HTML)
  pour un chargement quasi instantané, y compris hors-ligne
- Les lectures API (`GET /api/...`) sont mises en cache en stratégie
  `NetworkFirst` : en ligne, la donnée la plus fraîche est toujours utilisée ;
  hors-ligne, la dernière réponse connue s'affiche plutôt qu'un écran vide

**Limite assumée** : ce n'est PAS le mode hors-ligne complet avec file de
synchronisation décrit à titre d'architecture cible dans le cahier des
charges (§5.1.bis). Les écritures (créer une dépense, une facture...)
nécessitent toujours une connexion active — il n'y a pas de queue IndexedDB
qui rejoue les actions à la reconnexion. C'est un vrai projet à part entière
si le besoin devient concret.

## Découverte importante : `npm run build` a trouvé un bug qu'esbuild n'avait pas vu

Toutes les vérifications précédentes de ce projet utilisaient `esbuild`
fichier par fichier avec `--external:lucide-react`, ce qui **ne vérifie
jamais que les icônes importées existent réellement** dans la bibliothèque.
Le premier vrai `vite build` de ce projet a immédiatement révélé que l'icône
`IdCard` n'existe pas dans la version installée de `lucide-react` — utilisée
dans `DriversView.jsx` et `App.jsx`. Corrigée (remplacée par `CreditCard`).

**Leçon retenue** : avant toute mise en production, exécute toujours
`npm run build` en conditions réelles plutôt que de te fier uniquement à des
vérifications partielles — c'est désormais fait et le build passe proprement
(`dist/` généré sans erreur ni avertissement).

## Trous comblés lors d'une revue de complétude

Une vérification systématique a révélé que plusieurs fonctions API étaient
définies dans `lib/api.js` mais jamais réellement appelées — signe d'écrans
laissés inachevés lors de sessions précédentes :

- **Logistique** : aucun formulaire ne permettait de créer une commande ni un
  fournisseur (le texte affiché invitait littéralement à utiliser `curl`).
  Corrigé — `LogisticsView` a maintenant un vrai formulaire de commande avec
  création de fournisseur à la volée.
- **Projets** : impossible de créer un nouveau projet ni de basculer entre
  plusieurs projets existants — l'app ne travaillait que sur le premier
  projet renvoyé par l'API. Corrigé — sélecteur de projet + formulaire de
  création complet (avec lignes budgétaires initiales) dans `ProjectsView`.
- **Ressources humaines** : aucun moyen de créer un employé depuis
  l'interface. Corrigé — formulaire dans `HrView`.
- **Équipe** : le changement de rôle existait mais pas le retrait d'un
  membre. Corrigé dans `TeamView`.
- **Journal comptable** : `getJournal`/`exportJournalXlsx` existaient dans
  `api.js` mais aucun écran ne les affichait. Nouveau `JournalView.jsx`.
- **Stocks** : `listStockItems`/`createStockMovement` existaient côté client
  sans écran, et il manquait carrément les fonctions pour les entrepôts
  (`listWarehouses`/`createWarehouse`, pourtant déjà en place côté API).
  Nouveau `StockView.jsx` complet (entrepôts, articles, mouvements, alerte
  de seuil).
- **Paiement fournisseur** : `paySupplier` n'était appelé nulle part — une
  commande comptabilisée n'avait aucun moyen d'être soldée. Ajouté dans
  `LogisticsView`.
- **Export du parc véhicules** : `exportVehiclesXlsx` ajouté à `FleetView`.
- **Carnet de déplacements** : `createTrip`/`closeTrip`/`listTrips`
  existaient sans aucun écran. Ajouté dans `FleetView` (fiche véhicule) :
  démarrage d'un déplacement (chauffeur, projet, motif), détection du
  déplacement en cours, clôture avec kilométrage d'arrivée.
- **Équipe par projet** : `addProjectMember` existait sans écran. Nouveau
  `ProjectTeamSection` dans `ProjectsView` — ajout/retrait de membres avec
  rôle (Responsable/Membre/Partenaire/Lecture seule) et portée d'accès
  (complet/personnel), distinct de l'équipe organisationnelle (`TeamView`).

## État du branchement API

| Module | Statut |
|---|---|
| Authentification | ✅ Branchée (`/auth/login` + `/auth/register`) — écran à deux volets (branding + formulaire), bascule connexion/inscription, création d'organisation avec compte Admin automatique |
| Tableau de bord | ✅ Branché (projets + lignes budgétaires réels) |
| Budget & Dépenses | ✅ Branché (`POST /finance/expenses`, contrôle du disponible en direct, export Excel) |
| Logistique — Commandes | ✅ Branché (`POST /logistics/purchase-orders/:id/deliver`) |
| Projets — Activités | ✅ Branché (`GET/POST /projects/:id/activities`), avec bannière de portée d'accès (COMPLET/PERSONNEL) renvoyée par l'API |
| Documents & TDR | ✅ Branché (création + liste + export PDF/Word) |
| Flotte (véhicules/motos/engins) | ✅ Branché (`/fleet/*`) — module réservé Admin/Logisticien ; chauffeur = employé obligatoire, affectation projet, signalement de panne avec notification des responsables, détection d'anomalie carburant |
| Chauffeurs (écran dédié) | ✅ Branché (`/fleet/drivers/*`) — liste, fiche détail, permis éditable, véhicules attitrés, historique de trajets, retrait protégé |
| Équipements & Alertes | ✅ Branché (`/logistics/assets`, `/logistics/notifications`) |
| Équipe (invitations, rôles) | ✅ Branché (`/members/*`) — invitation par email, écran public d'acceptation via lien (`/accept-invite?token=...`) |
| Logistique — Stocks/Véhicules/Carburant/Maintenance | 🔲 À brancher (même schéma que Commandes) |
| Ressources humaines | 🔲 À brancher |
| Facturation / Paie | 🔲 À brancher (routes API prêtes : `/invoices`, `/payroll`) |
| Partage inter-ONG | 🔲 À brancher |

Le fichier `src/lib/api.js` expose déjà toutes les fonctions nécessaires
(`listVehicles`, `createFuelLog`, `listStaff`, `shareDocument`, `exportInvoicePdf`,
`exportPayslipPdf`, `exportVehiclesXlsx`, `exportJournalXlsx`, etc.) pour
connecter les modules restants — il ne reste qu'à répliquer le pattern déjà
utilisé dans `BudgetView`, `LogisticsView`, `ProjectsView` et `DocumentsView` :
1. `useEffect`/`useCallback` pour charger les données au montage
2. état local + fonction `refresh...`
3. appel API dans le gestionnaire d'action, suivi d'un `refresh...()`
4. pour l'export, `ExportMenu` + une fonction `exportXxx()` de `api.js` qui déclenche le téléchargement
