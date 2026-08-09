# GEII · Lab — notes pour Claude Code

PWA React de productivité pour étudiant GEII (Pomodoro, répétition espacée,
tâches, examens, molécule évolutive). Servie telle quelle par GitHub Pages,
branche `main`.

## Contrainte fondamentale : aucun build

Il n'y a **ni bundler, ni build step, ni npm install**. Tout part directement
en production :

- React + ReactDOM + Babel Standalone sont chargés depuis des CDN (`unpkg`)
  dans `index.html`, versions épinglées avec `integrity`.
- Chaque fichier `.jsx` est chargé par un `<script type="text/babel" src="...">`
  et transpilé **dans le navigateur** au chargement de la page.
- Chaque `<script type="text/babel">` s'exécute dans **son propre scope** —
  il n'y a pas de `import`/`export` ES modules, pas de scope partagé
  implicite entre fichiers. Un composant ou une fonction défini dans un
  fichier n'est visible ailleurs que s'il est explicitement accroché sur
  `window`.
- **Convention obligatoire** : à la fin de chaque fichier `.jsx` qui définit
  quelque chose d'utile aux autres fichiers, exposer via
  `Object.assign(window, { Truc, autreTruc })` (ou `window.Truc = Truc`).
  Tout nouveau composant/hook/helper partagé doit suivre ce même schéma.
- **Ordre de chargement critique** : les `<script>` dans `index.html`
  doivent rester dans l'ordre où les dépendances sont satisfaites (store et
  helpers d'abord, puis les pages, puis `app-v5.jsx` en dernier). Si tu
  ajoutes un fichier, insère-le au bon endroit dans cet ordre, pas juste à
  la fin.
- Ne jamais introduire de syntaxe `import`/`export`, ni supposer qu'un
  outil de build va exister un jour — écrire du code qui tourne tel quel
  dans le navigateur via Babel Standalone.

## Versionnage par nom de fichier

Il n'y a pas de git tags ni de changelog séparé pour les fichiers runtime :
**le numéro de version fait partie du nom de fichier** (`store-v6.jsx`,
`dashboard-v6.jsx`, `molecule-atom-v3.jsx`, `styles-v9.css`, …). Quand tu
fais une modification structurelle importante à un de ces fichiers (pas un
simple correctif), le renommer en incrémentant sa version et mettre à jour
**tous** les points qui le référencent :

1. `index.html` — la balise `<script src="...">` (et `<link rel="stylesheet">`
   pour le CSS).
2. `service-worker.js` — le tableau `SHELL`.
3. `service-worker.js` — **incrémenter la constante `CACHE`** (`geii-lab-vN`)
   à chaque changement de shell, sinon les appareils déjà installés restent
   coincés sur l'ancien cache.

Les fichiers sans suffixe de version (`auth.jsx`, `tasks.jsx`,
`entreprise.jsx`, …) n'ont pas besoin de renommage pour de petits changements ;
le suffixe `-vN` n'est utilisé que pour les fichiers qui ont déjà connu des
révisions majeures.

## Carte des fichiers

| Fichier | Rôle | Exporte sur `window` |
|---|---|---|
| `index.html` | Shell HTML, ordre de chargement des scripts | — |
| `service-worker.js` | Cache app-shell offline (`CACHE`, `SHELL`) | — |
| `manifest.webmanifest` | Métadonnées PWA / install iPhone-Android | — |
| `icons/` | Icônes PWA (180/192/512/512-maskable) | — |
| `styles-v9.css` | Feuille de style globale (inclut le bloc mobile / tactile / safe-area) | — |
| `store-v6.jsx` | État global (Zustand-like maison), actions, FSRS-lite, atome à paliers, sons, toasts | `useStore, actions, sfx, pushToast, useToasts, hasProfile, todaySessions, weekSessions, monthSessions, totalMinutes, dueChapters, urgentExams, dayKey, todayKey, dayMs, now, …` |
| `cloud-sync.jsx` | Client de synchro Supabase (push/pull, veille) | `cloud, useCloud, cloudAuth, startCloud, pushNow, syncOnLogin` |
| `supabase-config.js` | `SUPABASE_URL` / `SUPABASE_ANON_KEY` (vide par défaut = sync désactivée) | `window.SUPABASE_URL`, `window.SUPABASE_ANON_KEY` |
| `logo.jsx` | Logo SVG animé | `window.Logo` |
| `icons.jsx` | Bibliothèque d'icônes SVG inline | `window.Icon` |
| `shared-fixed.jsx` | Composants UI partagés (Card, Modal, Sparkline, ProgressRing, …) | `Card, Sparkline, ProgressRing, Particles, Modal, ConfirmModal, SubjectTag` |
| `app-lock.jsx` | Verrou d'appareil Face ID/Touch ID/code (WebAuthn, sans serveur) | `AppLockGate, appLockSupported, appLockEnable, appLockDisable` |
| `molecule-atom-v3.jsx` | Rendu 3D (Three.js) de la molécule/atome compagnon | `window.Molecule3D` |
| `tasks.jsx` | Page tâches | `TaskRow, TasksPage, AddTaskModal` |
| `entreprise.jsx` | Page suivi entreprise/alternance | `window.Entreprise` |
| `dashboard-v6.jsx` | Page tableau de bord | `window.Dashboard` |
| `pomodoro-final.jsx` | Minuteur Pomodoro | `Pomodoro, Stat, DurationSlider` |
| `revisions.jsx` | Page révisions + courbe d'Ebbinghaus | `Revisions, EbbinghausCurve, KpiMini` |
| `exams.jsx` | Page examens | `window.Exams` |
| `media-embed.jsx` | Lecteur média intégré (dock, pill) | `MediaPage, DockedPlayer, PlayerPill, MediaEmbed, activeMedia` |
| `stats.jsx` | Page statistiques | `window.Stats` |
| `settings-v2.jsx` | Page réglages | `window.Settings` |
| `onboarding.jsx` | Écran d'accueil / première utilisation | `window.Onboarding` |
| `auth.jsx` | Écran de connexion + puce de statut de synchro | `AuthScreen, SyncChip` |
| `app-v5.jsx` | Point d'entrée, routing, montage React | — (dernier chargé) |
| `SETUP-SYNC.md` | Guide utilisateur pour activer Supabase | — |

## Systèmes métier

### Répétition espacée — FSRS-lite (`store-v6.jsx`)

Algorithme inspiré d'Anki/FSRS, allégé, basé sur la courbe de l'oubli
d'Ebbinghaus. Chaque chapitre a un état de révision programmé ; une révision
se note sur une grille **1..4** (Again/Hard/Good/Easy) qui ajuste
l'intervalle avant la prochaine échéance. `dueChapters` expose les chapitres
en retard/à réviser aujourd'hui. La page `revisions.jsx` affiche la courbe
(`EbbinghausCurve`) et la file de révision.

### Atome à 16 paliers (`store-v6.jsx`, `molecule-atom-v3.jsx`)

Système de progression/gamification : au lieu de quelques stades grossiers,
**16 paliers nommés** avec des seuils **géométriques** (chaque palier coûte
davantage que le précédent), pensé pour donner de la marge de progression
sur plusieurs années d'utilisation. La progression est stockée en continu
(0..15, partie fractionnaire = avancement réel à l'intérieur du palier
courant) puis rendue visuellement par `molecule-atom-v3.jsx` (Three.js,
orbitales + nucleus + électrons qui évoluent avec le palier).

### Contraintes mobile / PWA iPhone

L'app est installée sur l'écran d'accueil iPhone, ce qui impose des règles que le
rendu bureau ne révèle jamais :

- `index.html` porte `viewport-fit=cover` — **sans lui `env(safe-area-inset-*)`
  vaut 0** et la barre de navigation du bas passe sous le trait d'accueil.
- Les hauteurs plein écran utilisent `100dvh` (repli `100vh`) : `100vh` ignore la
  barre d'adresse Safari et fait sauter la mise en page au scroll.
- Tout champ de saisie fait **16px minimum en mobile** : en dessous, iOS zoome
  d'autorité à la mise au point et l'utilisateur doit pincer pour revenir.
- Les effets `:hover` sont neutralisés sous `@media (hover: none)` — au doigt un
  survol se déclenche au tap et **reste collé** ensuite ; le retour visuel passe
  par `:active`.
- Cibles tactiles à 44px minimum (boutons, onglets, interrupteurs, cases).
- Le rendu WebGL de la molécule plafonne le `pixelRatio` à 1.5 et coupe
  l'antialias sur téléphone ; les particules de fond passent de 18 à 8.

### Verrou d'appareil (`app-lock.jsx`)

Couche indépendante de Supabase : elle protège l'accès à l'appareil, pas le
compte, et n'a besoin d'aucun serveur. Basée sur WebAuthn avec un
authentificateur de plateforme (`authenticatorAttachment: "platform"`) —
Face ID, Touch ID, code de l'appareil. La clé privée reste dans l'enclave
sécurisée du téléphone ; seul l'id de l'identifiant (`credentialId`) est
gardé côté app, dans `localStorage` (`geii_applock_v1`). Réussir
`navigator.credentials.get()` EST la preuve de vérification — inutile de
valider une signature côté client pour un simple verrou local. `AppLockGate`
enveloppe `<App/>` dans `app-v5.jsx` et s'affiche avant même l'écran de
connexion Supabase. Le réglage n'apparaît dans Réglages que si
`appLockSupported()` répond vrai (aucun authentificateur de plateforme →
la carte "Sécurité" ne s'affiche pas).

### Supabase — synchro en veille par défaut

`cloud-sync.jsx` gère la synchro multi-appareils, mais elle est **inactive
tant que `supabase-config.js` n'est pas rempli** (`SUPABASE_URL` /
`SUPABASE_ANON_KEY` vides). Sans configuration, l'app fonctionne 100% en
local (`localStorage`), aucun compte requis. Voir `SETUP-SYNC.md` pour la
procédure complète (création projet Supabase, table `workspaces` avec Row
Level Security, récupération des clés). Règle de fusion : dernier appareil
à écrire gagne sur l'ensemble du document — pas de fusion champ à champ.
