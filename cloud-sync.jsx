/* ==========================================================
   cloud.jsx — Comptes + synchronisation multi-appareils.

   • Auth email/mot de passe via Supabase.
   • Chaque utilisateur possède UNE ligne dans la table `workspaces`,
     protégée par Row Level Security : personne d'autre ne peut la lire,
     même en connaissant l'URL du projet.
   • Stratégie de fusion : document complet, le plus récent gagne
     (comparaison de `updatedAt`). Simple et fiable pour un seul
     utilisateur sur 2-3 appareils.
   • Sans configuration Supabase, tout ce fichier reste inerte et
     l'application fonctionne en local comme avant.
   ========================================================== */

const cloudConfigured = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY);

// URL de retour de l'application, calculée à l'exécution.
//
// Sans `emailRedirectTo`, Supabase renvoie sur le « Site URL » du projet :
// si celui-ci ne pointe pas exactement sur le sous-dossier GitHub Pages où
// l'app est publiée, le lien de confirmation tombe sur un 404 GitHub. On
// force donc le retour sur l'adresse réellement servie, quelle qu'elle soit
// (racine de domaine, sous-dossier de projet, autre).
//
// À savoir côté tableau de bord Supabase : cette URL doit figurer dans la
// liste « Redirect URLs », sinon Supabase l'ignore et retombe sur Site URL.
function appReturnUrl() {
  return location.origin + location.pathname.replace(/index\.html?$/i, "");
}

// Supabase ramène l'utilisateur avec `type=signup` dans le lien de
// confirmation — dans le hash (flux implicite) ou dans la query (flux PKCE),
// selon la configuration du projet : on regarde les deux. Capturé ici, en
// lecture seule — surtout ne PAS toucher au hash/à la query avant que le SDK
// (créé plus tard, dans initCloud) n'ait eu la main dessus : c'est de là
// qu'il extrait la session.
const _linkHash = new URLSearchParams(location.hash.replace(/^#/, ""));
const _linkQuery = new URLSearchParams(location.search);
const _linkParam = (name) => _linkHash.get(name) || _linkQuery.get(name);

const emailJustConfirmed = _linkParam("type") === "signup";
// Lien périmé ou déjà utilisé : Supabase le signale par `error`, et sans
// traitement l'utilisateur retombe sur l'écran de connexion sans la moindre
// explication.
const authLinkError = _linkParam("error_description") || _linkParam("error") || "";
const cameFromAuthLink = emailJustConfirmed || !!authLinkError;

// Retire les paramètres du lien d'authentification en gardant le reste.
function cleanAuthParamsFromUrl() {
  try {
    const q = new URLSearchParams(location.search);
    ["type", "code", "error", "error_code", "error_description"].forEach((p) => q.delete(p));
    const qs = q.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  } catch (e) {
    // replaceState est refusé sur certains schémas (file://) : cosmétique
    // seulement, ça ne doit jamais faire échouer l'initialisation.
  }
}

const cloud = {
  enabled: cloudConfigured,
  client: null,
  user: null,
  status: cloudConfigured ? "boot" : "off",   // boot | off | signedout | syncing | synced | error | offline
  message: "",
  lastSync: null,
  // Retour d'un lien de confirmation d'e-mail : l'écran dédié se substitue à
  // tout le reste tant que l'utilisateur n'a pas acquitté.
  emailNotice: null,                          // null | "confirmed" | "error"
  emailNoticeDetail: "",
};

const cloudListeners = new Set();
function emitCloud() { cloudListeners.forEach((l) => l()); }
function setCloud(patch) { Object.assign(cloud, patch); emitCloud(); }

function useCloud() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    cloudListeners.add(force);
    return () => cloudListeners.delete(force);
  }, []);
  return cloud;
}

/* ---------- init ---------- */
async function initCloud() {
  const url = window.SUPABASE_URL, key = window.SUPABASE_ANON_KEY;
  if (!url || !key) { setCloud({ enabled: false, status: "off" }); return; }
  if (!window.supabase || !window.supabase.createClient) {
    // SDK absent (hors ligne au premier chargement) — on reste en local
    setCloud({ enabled: true, status: "offline", message: "Hors ligne — données locales" });
    return;
  }
  try {
    cloud.client = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    cloud.enabled = true;
    const { data } = await cloud.client.auth.getSession();
    // Le SDK a maintenant lu ce qu'il avait besoin de lire dans l'URL — on
    // peut la nettoyer et afficher l'écran de confirmation.
    if (cameFromAuthLink) {
      cleanAuthParamsFromUrl();
      setCloud({
        emailNotice: authLinkError ? "error" : "confirmed",
        emailNoticeDetail: authLinkError,
      });
    }
    if (data && data.session) {
      setCloud({ user: data.session.user, status: "syncing" });
      await syncOnLogin();
    } else {
      setCloud({ user: null, status: "signedout" });
    }
    cloud.client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { setCloud({ user: null, status: "signedout" }); }
      else if (session && (!cloud.user || cloud.user.id !== session.user.id)) {
        setCloud({ user: session.user, status: "syncing" });
        syncOnLogin();
      }
    });
  } catch (e) {
    setCloud({ enabled: true, status: "error", message: "Connexion au serveur impossible" });
  }
}

/* ---------- auth ---------- */
const cloudAuth = {
  async signUp(email, password) {
    if (!cloud.client) return { error: "Synchronisation non configurée." };
    const { data, error } = await cloud.client.auth.signUp({
      email: email.trim(), password,
      options: { emailRedirectTo: appReturnUrl() },
    });
    if (error) return { error: translateAuthError(error.message) };
    if (data.user && !data.session) {
      return { needsConfirm: true };   // confirmation e-mail activée sur le projet
    }
    return {};
  },
  async signIn(email, password) {
    if (!cloud.client) return { error: "Synchronisation non configurée." };
    const { error } = await cloud.client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  },
  async resetPassword(email) {
    if (!cloud.client) return { error: "Synchronisation non configurée." };
    const { error } = await cloud.client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: appReturnUrl(),
    });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  },
  async signOut() {
    if (!cloud.client) return;
    await pushNow();                       // ne rien perdre avant de partir — déjà résiliente à ses propres erreurs
    try {
      // Si le compte a été supprimé côté serveur entre-temps (session locale
      // périmée pointant vers un utilisateur qui n'existe plus), cet appel
      // peut échouer. Le nettoyage local ci-dessous doit avoir lieu quoi
      // qu'il arrive : sinon l'utilisateur reste bloqué, connecté à un compte
      // fantôme, sans aucun moyen de s'en sortir depuis l'interface.
      await cloud.client.auth.signOut();
    } catch (e) {}
    try { localStorage.removeItem("geii_lab_v1"); } catch (e) {}
    actions.resetAll();                    // l'appareil ne garde pas les données
    // Repères de synchro remis à zéro : sans ça, une connexion suivante
    // comparerait l'état d'un autre compte à celui-ci.
    clearTimeout(pushTimer);
    firstSyncDone = false;
    lastPushedAt = null;
    setCloud({ user: null, status: "signedout" });
  },
};

function translateAuthError(msg) {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Un compte existe déjà avec cet e-mail.";
  if (m.includes("password should be at least")) return "Mot de passe trop court (6 caractères minimum).";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Adresse e-mail invalide.";
  if (m.includes("email not confirmed")) return "E-mail non confirmé — vérifie ta boîte de réception.";
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives, réessaie dans un instant.";
  return msg || "Erreur inconnue.";
}

/* ---------- data sync ---------- */
async function fetchRemote() {
  const { data, error } = await cloud.client
    .from("workspaces").select("data, updated_at")
    .eq("user_id", cloud.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

// Le plus récent des deux côtés gagne. Appelée à la connexion, mais aussi en
// boucle tant que la page est visible : tout ce qui suit doit donc rester
// silencieux et sans effet quand il n'y a rien à faire.
async function syncOnLogin() {
  if (!cloud.client || !cloud.user) return;
  try {
    const remote = await fetchRemote();
    const local = getSnapshot();
    const localAt = local && local.updatedAt ? local.updatedAt : 0;
    const remoteAt = remote && remote.data && remote.data.updatedAt ? remote.data.updatedAt : 0;

    const hasLocal = !!(local && local.profile);

    // Comparaison STRICTE : à égalité, les deux côtés portent déjà le même
    // document. Ré-hydrater serait sans effet utile mais reconstruirait tout
    // l'état React — soit, avec la récupération périodique, un rafraîchissement
    // complet de l'interface toutes les 45 secondes.
    if (remote && (!hasLocal || remoteAt > localAt)) {
      // Une écriture locale programmée avant ce pull porterait sur un état
      // désormais périmé : elle réécrirait par-dessus ce qu'on vient de
      // récupérer. On l'annule, et on marque l'hydratation pour que les
      // listeners du store ne la relancent pas en écho.
      clearTimeout(pushTimer);
      hydrating = true;
      try { hydrateStore(remote.data); } finally { hydrating = false; }
      lastPushedAt = remoteAt;            // ce document vient du serveur, ne pas le renvoyer
      setCloud({ status: "synced", lastSync: Date.now(), message: "" });
    } else if (hasLocal && localAt !== lastPushedAt) {
      // Local en avance ET réellement modifié depuis le dernier envoi : sans
      // cette seconde condition, la récupération périodique réenverrait le
      // même document indéfiniment.
      await pushNow();
      // Le message n'a de sens qu'au premier rapprochement après connexion ;
      // répété toutes les 45 s, il deviendrait du bruit.
      if (!firstSyncDone) pushToast({ kind: "default", text: "Données de cet appareil envoyées sur ton compte." });
    } else {
      setCloud({ status: "synced", lastSync: Date.now(), message: "" });
    }
    firstSyncDone = true;
  } catch (e) {
    setCloud({ status: "error", message: "Synchro impossible — travail en local" });
  }
}

let pushTimer = null;
let pushInFlight = false;
let hydrating = false;      // vrai le temps d'appliquer un document distant
let firstSyncDone = false;  // le message de rapprochement ne sert qu'une fois
let lastPushedAt = null;    // `updatedAt` du dernier document réellement envoyé

async function pushNow() {
  if (!cloud.client || !cloud.user) return;
  const doc = getSnapshot();
  if (!doc || !doc.profile) return;
  pushInFlight = true;
  setCloud({ status: "syncing" });
  try {
    const { error } = await cloud.client.from("workspaces").upsert({
      user_id: cloud.user.id,
      data: doc,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw error;
    lastPushedAt = doc.updatedAt;
    setCloud({ status: "synced", lastSync: Date.now(), message: "" });
  } catch (e) {
    setCloud({ status: "error", message: "Sauvegarde en ligne échouée" });
  } finally {
    pushInFlight = false;
  }
}

function schedulePush() {
  if (!cloud.client || !cloud.user) return;
  if (hydrating) return;                   // écho d'un pull, pas une vraie modification
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 1500);   // regroupe les modifications rapides
}

// Envoie sans attendre la fin du regroupement : à utiliser quand la page peut
// être gelée ou détruite d'un instant à l'autre.
function flushPush() {
  if (!cloud.client || !cloud.user) return;
  clearTimeout(pushTimer);
  pushNow();
}

// Récupère, sauf si une écriture est déjà en cours (elle porte l'état le plus
// récent : la doubler d'un pull ferait clignoter les données).
function pullIfIdle() {
  if (!cloud.client || !cloud.user || pushInFlight) return;
  syncOnLogin();
}

/* ---------- wiring ----------

   La synchro doit être invisible : aucune action de l'utilisateur ne doit
   être nécessaire pour envoyer ou récupérer. Les deux événements employés
   auparavant — `focus` pour récupérer, `beforeunload` pour envoyer — sont
   précisément ceux sur lesquels on ne peut pas compter dans une PWA
   installée sur téléphone :

   • `focus` ne se déclenche pas de façon fiable quand on revient sur une
     application depuis le sélecteur d'applications iOS/Android ;
   • `beforeunload` n'est quasiment jamais émis sur iOS, où le système gèle
     puis tue l'onglet sans prévenir — les dernières modifications restaient
     donc en attente sur l'appareil.

   On s'appuie donc sur le cycle de vie réellement émis (`visibilitychange`,
   `pagehide`, `pageshow`), et on ajoute une récupération périodique tant que
   la page est visible, pour qu'un changement fait sur l'autre appareil
   arrive tout seul, sans avoir à quitter puis revenir. */
const PULL_INTERVAL_MS = 45000;
let pullTimer = null;

function startCloud() {
  initCloud().then(() => {
    if (!cloud.enabled) return;

    subscribeStore(schedulePush);                   // toute modification locale → push

    document.addEventListener("visibilitychange", () => {
      // Passer en arrière-plan est le dernier moment fiable pour écrire.
      if (document.visibilityState === "hidden") flushPush();
      else pullIfIdle();
    });

    // `pagehide`/`pageshow` couvrent le gel et la restauration depuis le cache
    // de navigation, que `visibilitychange` seul ne signale pas toujours.
    window.addEventListener("pagehide", flushPush);
    window.addEventListener("pageshow", pullIfIdle);

    // Bureau : `focus` reste le signal le plus immédiat au retour sur l'onglet.
    window.addEventListener("focus", pullIfIdle);
    window.addEventListener("beforeunload", flushPush);

    // Retour de connexion : rattraper ce qui n'a pas pu partir ou arriver.
    window.addEventListener("online", () => { flushPush(); pullIfIdle(); });

    clearInterval(pullTimer);
    pullTimer = setInterval(() => {
      if (document.visibilityState === "visible") pullIfIdle();
    }, PULL_INTERVAL_MS);
  });
}

// Acquittement de l'écran de confirmation d'e-mail.
function dismissEmailNotice() {
  setCloud({ emailNotice: null, emailNoticeDetail: "" });
}

Object.assign(window, { cloud, useCloud, cloudAuth, startCloud, pushNow, syncOnLogin, dismissEmailNotice });
