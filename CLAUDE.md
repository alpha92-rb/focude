# Focude — notes pour Claude Code

PWA React de productivité **multi-domaine** (Pomodoro, répétition espacée,
tâches, examens, molécule évolutive). N'importe qui définit son propre
domaine d'études (ou métier, ou passion) et ses propres matières à
l'onboarding — l'app n'assume rien de fixe sur ce que l'utilisateur étudie.
Servie telle quelle par GitHub Pages, branche `main`.

Nom de code historique du dépôt GitHub (`geii`) et de certaines clés
internes (`geii_lab_v1` en `localStorage`, `id: "geii-lab"` dans le
manifest, `geii-lab-vN` pour le cache du service worker) : **ne pas
renommer** — l'app s'appelait ainsi à l'origine (spécifique BUT GEII), et
changer ces identifiants internes casserait soit l'URL du dépôt soit la
reconnaissance de la PWA déjà installée sur les appareils. Le nom
utilisateur affiché partout dans l'interface est **Focude**.

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
**le numéro de version fait partie du nom de fichier** (`store-v8.jsx`,
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
| `store-v8.jsx` | État global (Zustand-like maison), actions, FSRS-lite, atome à paliers, matières libres, sons, toasts | `useStore, actions, sfx, pushToast, useToasts, hasProfile, todaySessions, weekSessions, monthSessions, totalMinutes, dueChapters, urgentExams, dayKey, todayKey, dayMs, now, SUBJECT_PALETTE, …` |
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
| `profile.jsx` | Page Profil : photo + heatmap/courbe/répartition/historique (ex-`stats.jsx`) | `ProfilePage, Avatar` (+ `compressAvatar`, pas exporté) |
| `settings-v3.jsx` | Page réglages (profil, domaine, année, travail, langue, matières, sécurité, sauvegarde) | `window.Settings` |
| `i18n.jsx` | Traduction FR/EN — dictionnaire plat + `t()` + préférence de langue | `t, useLang, setLang, getLang, LANGS` |
| `onboarding.jsx` | Questionnaire de première utilisation (6 étapes : prénom+photo, domaine, année, matières, travail, mode) | `window.Onboarding` (+ `LangSwitch`, pas exporté séparément) |
| `auth.jsx` | Écran de connexion + puce de statut de synchro | `AuthScreen, SyncChip` |
| `app-v5.jsx` | Point d'entrée, routing, montage React | — (dernier chargé) |
| `SETUP-SYNC.md` | Guide utilisateur pour activer Supabase | — |

## Systèmes métier

### Répétition espacée — FSRS-lite (`store-v8.jsx`)

Algorithme inspiré d'Anki/FSRS, allégé, basé sur la courbe de l'oubli
d'Ebbinghaus. Chaque chapitre a un état de révision programmé ; une révision
se note sur une grille **1..4** (Again/Hard/Good/Easy) qui ajuste
l'intervalle avant la prochaine échéance. `dueChapters` expose les chapitres
en retard/à réviser aujourd'hui. La page `revisions.jsx` affiche la courbe
(`EbbinghausCurve`) et la file de révision.

### Atome à 16 paliers (`store-v8.jsx`, `molecule-atom-v3.jsx`)

Système de progression/gamification : au lieu de quelques stades grossiers,
**16 paliers nommés** avec des seuils **géométriques** (chaque palier coûte
davantage que le précédent), pensé pour donner de la marge de progression
sur plusieurs années d'utilisation. La progression est stockée en continu
(0..15, partie fractionnaire = avancement réel à l'intérieur du palier
courant) puis rendue visuellement par `molecule-atom-v3.jsx` (Three.js,
orbitales + nucleus + électrons qui évoluent avec le palier).

### Domaine et matières — libres, définis par l'utilisateur

L'app n'a plus aucune liste de matières figée dans le code pour l'usage réel
(seul `seedData()` dans `store-v8.jsx` garde des matières d'ingénierie
GEII-flavored, mais **seulement pour le mode démo** — le mode "démarrage
propre" démarre avec `subjects: []`). Deux points d'entrée pour construire
sa liste :

1. **Onboarding** (`onboarding.jsx`, étape 4/6) — champ + bouton "Ajouter",
   chips retirables, palette de couleurs cyclique (`SUBJECT_PALETTE`).
2. **Réglages** (`settings-v3.jsx`, carte "Matières") — mêmes actions
   (`actions.addSubject`, `actions.deleteSubject`, `actions.renameSubject`
   dans `store-v8.jsx`), accessibles à tout moment après l'onboarding.

Une "matière" n'est qu'une étiquette `{ id, name, color }` — rien ne
l'oblige à être scolaire (le texte d'aide le dit explicitement : sport,
projet perso, vie pro…). Supprimer une matière ne purge pas les
tâches/chapitres/examens qui la référençaient : `SubjectTag` (dans
`shared-fixed.jsx`) ignore silencieusement un `subject` orphelin.

Le champ `profile.field` (domaine/filière, texte libre, facultatif) est
purement informatif — aucune logique ne se branche dessus, contrairement à
l'ancien état où "GEII" était supposé partout dans les textes d'interface.

### Traduction FR/EN (`i18n.jsx`)

Dictionnaire plat (pas d'imbrication) : chaque texte est une clé
`"domaine.nom"` mappée dans `DICT.fr` et `DICT.en`. `t("clé")` cherche dans
la langue active, retombe sur le français si absent, puis sur la clé
elle-même en tout dernier recours — jamais un écran vide même si une clé a
été oubliée dans une langue. Préférence stockée à part de `profile`, en
`localStorage` direct (`focude_lang_v1`) : elle doit être lisible **avant**
qu'un compte existe, pour les écrans d'onboarding et de connexion. Se
propage instantanément (`useLang()` + listeners, même mécanique que
`useStore`/`useCloud`) — pas de rechargement de page nécessaire.

**Couverture actuelle** : nav, topbar, onboarding, connexion, verrou
biométrique, réglages, page Profil, et les modales de confirmation
génériques (réinitialiser, déconnexion, sauvegarde). **Non couvert** : le
contenu profond des pages métier (tableau de bord, tâches, entreprise,
examens, révisions, Pomodoro, média) reste en français uniquement — les
sous-chaînes `lastXp.reason` générées par `store-v8.jsx` (ex. "Révision",
"Tâche terminée") aussi. Étendre la couverture = ajouter des clés dans
`i18n.jsx` puis remplacer les chaînes en dur par `t("clé")` dans le fichier
concerné, en import­ant `useLang()`/`t` (déjà global, aucun chargement
supplémentaire requis vu l'ordre de `index.html`).

### Photo de profil

`profile.avatar` (data URL JPEG, `null` par défaut) est réglable dès
l'onboarding (étape 1/6, facultatif) ou à tout moment depuis la page Profil.
`compressAvatar()` (dans `profile.jsx`) redimensionne côté client à 256×256
recadré carré et compresse en JPEG qualité 0.82 **avant** stockage — une
photo de téléphone de plusieurs Mo finirait sinon dans chaque sync Supabase.
Le composant `Avatar` (initiale colorée en repli si pas de photo) est
réutilisé dans la topbar, l'onboarding et la page Profil.

### Section Entreprise conditionnelle (`profile.worksJob`)

L'onboarding demande "Tu travailles ?" (étape 5/6) ; la réponse (`profile.worksJob`,
booléen) contrôle si l'onglet Entreprise apparaît dans la nav — réglable
ensuite à tout moment dans Réglages. Comptes créés avant l'ajout de cette
question (`migrate()` dans `store-v8.jsx`) reçoivent `worksJob: true` par
défaut, pour ne pas faire disparaître un onglet déjà utilisé. Les raccourcis
clavier 1-9 (`app-v5.jsx`, `visiblePageIds`) sont recalculés dynamiquement
pour toujours correspondre à ce qui est réellement affiché dans le menu — si
Entreprise est masqué, les numéros décalent en conséquence.

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
