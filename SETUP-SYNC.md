# Synchronisation & compte privé — mise en route (≈ 5 min, gratuit)

Sans cette configuration, l'application fonctionne **en local** : aucun compte, aucune
synchro, les données restent dans le navigateur de l'appareil. Tout ce qui suit est
optionnel — c'est ce qui ajoute **ton compte protégé par mot de passe** et la
**synchro téléphone ↔ ordinateur**.

GitHub Pages ne peut pas le faire seul : c'est de l'hébergement de fichiers, il n'a ni
base de données ni gestion de comptes. On lui ajoute donc Supabase (offre gratuite).

---

## 1. Créer le projet Supabase

1. Va sur **supabase.com** → *Start your project* (connexion possible avec GitHub).
2. *New project* → donne un nom (ex. `geii-lab`), choisis une région proche
   (**Europe West / Paris**), définis le mot de passe de la base (garde-le de côté,
   il ne sert pas dans l'application).
3. Attends ~2 min que le projet soit prêt.

## 2. Créer la table des données

Menu de gauche → **SQL Editor** → *New query* → colle ceci → **Run** :

```sql
create table if not exists workspaces (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table workspaces enable row level security;

create policy "chacun ses donnees"
  on workspaces for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

La dernière instruction est la partie importante : c'est la **Row Level Security**.
Elle garantit au niveau de la base que chaque ligne n'est lisible et modifiable que
par son propriétaire. Même quelqu'un qui lit le code source public de ton dépôt ne
peut rien voir de tes données.

## 3. Récupérer les deux clés

Menu de gauche → **Project Settings** → **API** :

- **Project URL** → ex. `https://abcdefgh.supabase.co`
- **anon public** (clé publique) → longue chaîne commençant par `eyJ…`

> La clé `anon` est faite pour être publique : sans compte + mot de passe valides,
> elle ne donne accès à rien. Ne publie **jamais** la clé `service_role`.

## 4. Renseigner l'application

Ouvre **`supabase-config.js`** et remplis les deux lignes :

```js
window.SUPABASE_URL = "https://abcdefgh.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

Envoie le fichier sur GitHub. Au prochain chargement, l'application demande une
connexion : crée ton compte, et c'est tout.

## 5. Autoriser l'adresse de retour (sinon : 404 GitHub)

**À faire si tu laisses la confirmation d'e-mail activée.** C'est l'étape la
plus facile à oublier, et son symptôme est net : on clique dans l'e-mail de
confirmation et on tombe sur une **page GitHub 404**.

Pourquoi : Supabase ne renvoie pas n'importe où après avoir validé un lien. Il
renvoie sur le **Site URL** du projet, sauf si l'application demande une autre
adresse *et* que celle-ci figure dans la liste blanche. L'application demande
bien son adresse réelle (calculée à l'exécution, voir `appReturnUrl()` dans
`cloud-sync.jsx`), mais Supabase l'ignore tant qu'elle n'est pas autorisée — et
retombe alors sur un Site URL qui, par défaut, ne pointe pas sur le
sous-dossier GitHub Pages du projet.

**Authentication → URL Configuration** :

- **Site URL** → l'adresse exacte de l'application, **avec le sous-dossier et
  le slash final** : `https://<utilisateur>.github.io/<depot>/`
  (pour ce dépôt : `https://alpha92-rb.github.io/focude/`).
- **Redirect URLs** → ajoute la même adresse. Ajoute aussi
  `http://localhost:*/**` si tu testes en local.

Une adresse sans le sous-dossier (`https://<utilisateur>.github.io/`) ou sans
le slash final est la cause typique du 404.

Une fois l'adresse correcte, cliquer dans l'e-mail ramène sur l'application,
qui affiche explicitement **« Focude a bien validé ton e-mail. »** — et, si le
lien a expiré ou a déjà servi, un message qui le dit au lieu d'un écran de
connexion muet.

## 6. (Facultatif) Se passer de la confirmation d'e-mail

Par défaut Supabase envoie un e-mail de confirmation à l'inscription.
Pour t'inscrire sans cette étape (usage personnel) :
**Authentication → Sign In / Providers → Email** → décoche *Confirm email*.

---

## Comment fonctionne la synchro

- Ton espace complet (chapitres, tâches, examens, sessions, contacts, livraisons,
  XP) est enregistré sur ton compte, automatiquement, ~1,5 s après chaque
  modification.
- À la connexion et à chaque retour sur l'application, la version la plus récente
  est récupérée.
- **Hors ligne, tout continue de fonctionner** : les modifications partent
  dès le retour de la connexion.
- Règle de fusion : le dernier appareil modifié gagne sur l'ensemble du document.
  Évite donc de travailler simultanément sur deux appareils sans les laisser se
  synchroniser entre-temps.
- « Se déconnecter » envoie d'abord les données sur le compte, puis les efface de
  l'appareil.

## Limites de l'offre gratuite

Largement suffisantes ici : 500 Mo de base, 50 000 utilisateurs actifs/mois.
Ton espace pèse quelques centaines de kilo-octets, même après des années.
Un projet gratuit est mis en pause après une longue inactivité (une visite le
réactive).
