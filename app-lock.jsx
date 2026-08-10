/* ==========================================================
   app-lock.jsx — Verrouillage biométrique local (Face ID / Touch ID / code).

   Couche indépendante de Supabase : elle protège l'accès à l'appareil,
   pas le compte. S'appuie sur l'authentificateur de plateforme WebAuthn —
   la clé privée ne quitte jamais l'enclave sécurisée du téléphone, et
   aucun serveur n'intervient : on stocke juste l'id d'identifiant en
   local et on vérifie que l'OS a bien validé Face ID / Touch ID / le code
   avant de laisser passer.
   ========================================================== */

const LOCK_KEY = "geii_applock_v1";

function loadLockConfig() {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, credentialId: null };
  } catch {
    return { enabled: false, credentialId: null };
  }
}
function saveLockConfig(cfg) {
  localStorage.setItem(LOCK_KEY, JSON.stringify(cfg));
}

function randomBytes(len) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return a;
}
function toB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromB64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0)).buffer;
}

// Un authentificateur de plateforme (Face ID, Touch ID, Windows Hello, code
// d'écran verrouillé) doit être disponible — sinon le réglage reste caché.
async function appLockSupported() {
  if (!window.PublicKeyCredential || !navigator.credentials) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Enregistre un nouvel identifiant lié à Face ID / Touch ID / code.
// N'importe quel succès ici prouve juste "cet appareil sait vérifier son
// utilisateur" — aucune donnée biométrique ne transite, seul l'OS le sait.
async function appLockEnable() {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: "Focude", id: location.hostname },
      user: { id: randomBytes(16), name: "verrouillage-appareil", displayName: "Verrouillage Focude" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
      timeout: 60000,
      attestation: "none",
    },
  });
  if (!cred) throw new Error("Enregistrement annulé.");
  saveLockConfig({ enabled: true, credentialId: toB64(cred.rawId) });
}

function appLockDisable() {
  saveLockConfig({ enabled: false, credentialId: null });
}

// Redemande Face ID / Touch ID / le code. La réussite de cet appel EST la
// preuve : WebAuthn ne renvoie une assertion que si l'OS a validé
// l'utilisateur, donc pas de vérification cryptographique supplémentaire
// à faire ici pour un simple verrou d'appareil.
async function appLockVerify(credentialId) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [{ id: fromB64(credentialId), type: "public-key" }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  if (!assertion) throw new Error("Vérification annulée.");
}

const AppLockGate = ({ children }) => {
  const [lang] = useLang();
  const [ready, setReady] = React.useState(false);
  const [cfg, setCfg] = React.useState(null);
  const [unlocked, setUnlocked] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const attempted = React.useRef(false);

  React.useEffect(() => {
    const c = loadLockConfig();
    setCfg(c);
    setReady(true);
  }, []);

  const tryUnlock = React.useCallback(async () => {
    if (!cfg || !cfg.credentialId) return;
    setBusy(true);
    setError(null);
    try {
      await appLockVerify(cfg.credentialId);
      setUnlocked(true);
    } catch {
      setError(getLang() === "en" ? "Verification failed or cancelled." : "Vérification échouée ou annulée.");
    } finally {
      setBusy(false);
    }
  }, [cfg]);

  React.useEffect(() => {
    // Tentative automatique à l'ouverture — évite une étape supplémentaire
    // quand l'appareil est déjà déverrouillé (Face ID répond en un instant).
    if (ready && cfg && cfg.enabled && !unlocked && !attempted.current) {
      attempted.current = true;
      tryUnlock();
    }
  }, [ready, cfg, unlocked, tryUnlock]);

  if (!ready) return null;
  if (!cfg.enabled || unlocked) return children;

  return (
    <div className="boot-shell">
      <div className="app-bg"/>
      <div className="boot-card applock-card">
        <Logo size={44}/>
        <div className="mono boot-label">{t("applock.locked")}</div>
        <div className="applock-msg">{t("applock.msg")}</div>
        {error && <div className="applock-error">{error}</div>}
        <button className="btn primary applock-btn" disabled={busy} onClick={tryUnlock}>
          {busy ? t("applock.checking") : t("applock.unlock")}
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { AppLockGate, appLockSupported, appLockEnable, appLockDisable });
