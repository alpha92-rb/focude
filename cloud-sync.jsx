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

const cloud = {
  enabled: cloudConfigured,
  client: null,
  user: null,
  status: cloudConfigured ? "boot" : "off",   // boot | off | signedout | syncing | synced | error | offline
  message: "",
  lastSync: null,
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
    const { data, error } = await cloud.client.auth.signUp({ email: email.trim(), password });
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
    const { error } = await cloud.client.auth.resetPasswordForEmail(email.trim());
    if (error) return { error: translateAuthError(error.message) };
    return {};
  },
  async signOut() {
    if (!cloud.client) return;
    await pushNow();                       // ne rien perdre avant de partir
    await cloud.client.auth.signOut();
    try { localStorage.removeItem("geii_lab_v1"); } catch (e) {}
    actions.resetAll();                    // l'appareil ne garde pas les données
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

// On login: whichever side is newer wins.
async function syncOnLogin() {
  if (!cloud.client || !cloud.user) return;
  try {
    const remote = await fetchRemote();
    const local = getSnapshot();
    const localAt = local && local.updatedAt ? local.updatedAt : 0;
    const remoteAt = remote && remote.data && remote.data.updatedAt ? remote.data.updatedAt : 0;

    if (remote && remoteAt >= localAt) {
      hydrateStore(remote.data);
      setCloud({ status: "synced", lastSync: Date.now(), message: "" });
    } else if (local && local.profile) {
      await pushNow();
      pushToast({ kind: "default", text: "Données de cet appareil envoyées sur ton compte." });
    } else {
      setCloud({ status: "synced", lastSync: Date.now() });
    }
  } catch (e) {
    setCloud({ status: "error", message: "Synchro impossible — travail en local" });
  }
}

let pushTimer = null;
let pushInFlight = false;

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
    setCloud({ status: "synced", lastSync: Date.now(), message: "" });
  } catch (e) {
    setCloud({ status: "error", message: "Sauvegarde en ligne échouée" });
  } finally {
    pushInFlight = false;
  }
}

function schedulePush() {
  if (!cloud.client || !cloud.user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 1500);   // regroupe les modifications rapides
}

/* ---------- wiring ---------- */
function startCloud() {
  initCloud().then(() => {
    if (!cloud.enabled) return;
    subscribeStore(schedulePush);                   // toute modification locale → push
    window.addEventListener("focus", () => {        // retour sur l'appareil → pull
      if (cloud.user && !pushInFlight) syncOnLogin();
    });
    window.addEventListener("beforeunload", () => {
      if (cloud.user) { clearTimeout(pushTimer); pushNow(); }
    });
  });
}

Object.assign(window, { cloud, useCloud, cloudAuth, startCloud, pushNow, syncOnLogin });
