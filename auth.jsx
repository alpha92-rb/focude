/* ==========================================================
   auth.jsx — Écran de connexion / création de compte.
   Affiché uniquement quand la synchronisation est configurée.
   ========================================================== */

const AuthScreen = () => {
  const c = useCloud();
  const [mode, setMode] = React.useState("signin");   // signin | signup | reset
  const [email, setEmail] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [info, setInfo] = React.useState("");

  const submit = async () => {
    setErr(""); setInfo("");
    if (!email.trim()) { setErr("Renseigne ton adresse e-mail."); return; }
    if (mode === "reset") {
      setBusy(true);
      const r = await cloudAuth.resetPassword(email);
      setBusy(false);
      if (r.error) setErr(r.error);
      else setInfo("E-mail de réinitialisation envoyé.");
      return;
    }
    if (pwd.length < 6) { setErr("Mot de passe : 6 caractères minimum."); return; }
    if (mode === "signup" && pwd !== pwd2) { setErr("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const r = mode === "signup" ? await cloudAuth.signUp(email, pwd) : await cloudAuth.signIn(email, pwd);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    if (r.needsConfirm) { setInfo("Compte créé — confirme ton e-mail puis reviens te connecter."); setMode("signin"); }
  };

  return (
    <div className="onboarding-shell">
      <div className="app-bg"/>
      <Particles count={24}/>

      <div className="onb-stage">
        <div className="onb-visual">
          <div className="onb-molecule">
            <Molecule3D stage={1}/>
            <div className="corners"><i className="tl"/><i className="tr"/><i className="bl"/><i className="br"/></div>
          </div>
          <div className="onb-readout">
            <div className="line"><b>SYSTEM</b> FOCUDE</div>
            <div className="line"><b>COMPTE</b> <span style={{ color: "var(--cyan)" }}>AUTHENTIFICATION REQUISE</span></div>
            <div className="line"><b>DONNÉES</b> CHIFFRÉES PAR UTILISATEUR</div>
            <div className="line"><b>SYNCHRO</b> TÉLÉPHONE ↔ ORDINATEUR</div>
          </div>
        </div>

        <div className="onb-form">
          <div className="onb-brand">
            <Logo size={40}/>
            <div>
              <div style={{ fontSize: 15, letterSpacing: "0.04em" }}>FOCUDE</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.28em", color: "var(--fg-3)", marginTop: 2 }}>
                ACCÈS PRIVÉ
              </div>
            </div>
          </div>

          <div className="onb-step">
            <h2>{mode === "signup" ? "Créer ton compte." : mode === "reset" ? "Mot de passe oublié." : "Connexion."}</h2>
            <p>
              {mode === "signup"
                ? "Ton espace est strictement privé : personne d'autre ne peut lire tes chapitres, tâches ou statistiques — même en connaissant l'adresse du site."
                : mode === "reset"
                ? "Indique ton e-mail, tu recevras un lien pour choisir un nouveau mot de passe."
                : "Connecte-toi pour retrouver ton travail sur tous tes appareils."}
            </p>

            <div>
              <label className="field-label">Adresse e-mail</label>
              <input className="input lg" type="email" autoComplete="email" autoFocus
                value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="prenom@exemple.fr"/>
            </div>

            {mode !== "reset" && (
              <div>
                <label className="field-label">Mot de passe</label>
                <input className="input lg" type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={pwd} onChange={(e) => { setPwd(e.target.value); setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="••••••••"/>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="field-label">Confirmer le mot de passe</label>
                <input className="input lg" type="password" autoComplete="new-password"
                  value={pwd2} onChange={(e) => { setPwd2(e.target.value); setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="••••••••"/>
              </div>
            )}

            {err && <div className="auth-msg err">{err}</div>}
            {info && <div className="auth-msg ok">{info}</div>}

            <div className="onb-actions">
              <button className="btn ghost" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); setInfo(""); }}>
                {mode === "signin" ? "Créer un compte" : "J'ai déjà un compte"}
              </button>
              {mode === "signin" && (
                <button className="btn ghost" onClick={() => { setMode("reset"); setErr(""); setInfo(""); }}>
                  Oublié ?
                </button>
              )}
              <button className="btn primary" disabled={busy} onClick={submit}>
                {busy ? "…" : mode === "signup" ? "Créer mon compte" : mode === "reset" ? "Envoyer le lien" : "Se connecter"}
              </button>
            </div>
          </div>

          <div className="onb-footer mono">
            <span>ACCÈS PROTÉGÉ PAR MOT DE PASSE</span>
            <span>SYNCHRO CHIFFRÉE · TLS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Petit indicateur d'état de synchro pour la barre du haut */
const SyncChip = () => {
  const c = useCloud();
  if (!c.enabled) return null;
  const map = {
    syncing: { color: "var(--cyan)", label: "Synchro…" },
    synced:  { color: "var(--green)", label: "Synchronisé" },
    error:   { color: "var(--red)", label: c.message || "Erreur synchro" },
    offline: { color: "var(--amber)", label: "Hors ligne" },
    signedout: { color: "var(--fg-3)", label: "Déconnecté" },
  };
  const v = map[c.status] || map.offline;
  return (
    <div className="stat-chip" title={c.lastSync ? "Dernière synchro : " + new Date(c.lastSync).toLocaleTimeString("fr-FR") : v.label}>
      <span className="dot" style={{ background: v.color, boxShadow: `0 0 8px ${v.color}` }}/>
      <span className="label">Cloud</span>
      <span className="val">{v.label}</span>
    </div>
  );
};

Object.assign(window, { AuthScreen, SyncChip });
