/* ==========================================================
   auth.jsx — Écran de connexion / création de compte.
   Affiché uniquement quand la synchronisation est configurée.
   ========================================================== */

const AuthScreen = () => {
  const [lang] = useLang();
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
    if (!email.trim()) { setErr(lang === "en" ? "Enter your email address." : "Renseigne ton adresse e-mail."); return; }
    if (mode === "reset") {
      setBusy(true);
      const r = await cloudAuth.resetPassword(email);
      setBusy(false);
      if (r.error) setErr(r.error);
      else setInfo(lang === "en" ? "Reset email sent." : "E-mail de réinitialisation envoyé.");
      return;
    }
    if (pwd.length < 6) { setErr(lang === "en" ? "Password: 6 characters minimum." : "Mot de passe : 6 caractères minimum."); return; }
    if (mode === "signup" && pwd !== pwd2) { setErr(lang === "en" ? "The two passwords don't match." : "Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const r = mode === "signup" ? await cloudAuth.signUp(email, pwd) : await cloudAuth.signIn(email, pwd);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    if (r.needsConfirm) {
      setInfo(lang === "en" ? "Account created — confirm your email, then come back to sign in." : "Compte créé — confirme ton e-mail puis reviens te connecter.");
      setMode("signin");
    }
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
            <div className="line"><b>SYSTEM</b> {t("auth.system")}</div>
            <div className="line"><b>{t("profile.account").toUpperCase()}</b> <span style={{ color: "var(--cyan)" }}>{t("auth.required")}</span></div>
            <div className="line"><b>{t("auth.data")}</b> {t("auth.encrypted")}</div>
            <div className="line"><b>{t("auth.sync")}</b> {t("auth.syncDesc")}</div>
          </div>
        </div>

        <div className="onb-form">
          <div className="onb-brand">
            <Logo size={40}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, letterSpacing: "0.04em" }}>{t("onb.title")}</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.28em", color: "var(--fg-3)", marginTop: 2 }}>
                {t("auth.private")}
              </div>
            </div>
            <LangSwitch/>
          </div>

          <div className="onb-step">
            <h2>{mode === "signup" ? t("auth.signup.h") : mode === "reset" ? t("auth.reset.h") : t("auth.signin.h")}</h2>
            <p>
              {mode === "signup" ? t("auth.signup.p") : mode === "reset" ? t("auth.reset.p") : t("auth.signin.p")}
            </p>

            <div>
              <label className="field-label">{t("auth.email")}</label>
              <input className="input lg" type="email" autoComplete="email" autoFocus
                value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={lang === "en" ? "name@example.com" : "prenom@exemple.fr"}/>
            </div>

            {mode !== "reset" && (
              <div>
                <label className="field-label">{t("auth.password")}</label>
                <input className="input lg" type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={pwd} onChange={(e) => { setPwd(e.target.value); setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="••••••••"/>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="field-label">{t("auth.confirmPassword")}</label>
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
                {mode === "signin" ? t("auth.createAccount") : t("auth.haveAccount")}
              </button>
              {mode === "signin" && (
                <button className="btn ghost" onClick={() => { setMode("reset"); setErr(""); setInfo(""); }}>
                  {t("auth.forgot")}
                </button>
              )}
              <button className="btn primary" disabled={busy} onClick={submit}>
                {busy ? "…" : mode === "signup" ? t("auth.createAccount") : mode === "reset" ? t("auth.sendLink") : t("auth.signin")}
              </button>
            </div>
          </div>

          <div className="onb-footer mono">
            <span>{t("auth.footer1")}</span>
            <span>{t("auth.footer2")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================
   Retour du lien de confirmation d'e-mail.

   Sans cet écran, l'utilisateur qui clique dans son mail retombe sur
   l'écran de connexion sans savoir si la validation a marché — ou, quand
   le lien ne pointe pas sur le bon sous-dossier, sur un 404 GitHub.
   ========================================================== */
const EmailNoticeScreen = () => {
  const [lang] = useLang();
  const c = useCloud();
  const ok = c.emailNotice === "confirmed";
  return (
    <div className="boot-shell">
      <div className="app-bg"/>
      <Particles count={18}/>
      <div className="boot-card applock-card">
        <Logo size={44}/>
        <div className="mono boot-label">{ok ? t("auth.confirmed.tag") : t("auth.linkError.tag")}</div>
        <div style={{ fontSize: 15, letterSpacing: "0.03em" }}>
          {ok ? t("auth.confirmed.title") : t("auth.linkError.title")}
        </div>
        <div className="applock-msg">
          {ok ? t("auth.confirmed.msg") : t("auth.linkError.msg")}
        </div>
        {/* Le détail brut de Supabase n'est pas traduit : il sert surtout à
            comprendre un lien périmé, il ne remplace pas le message. */}
        {!ok && c.emailNoticeDetail && (
          <div className="applock-error">{c.emailNoticeDetail}</div>
        )}
        <button className="btn primary applock-btn" onClick={() => dismissEmailNotice()}>
          {ok ? t("auth.confirmed.cta") : t("auth.linkError.cta")}
        </button>
      </div>
    </div>
  );
};

/* Petit indicateur d'état de synchro pour la barre du haut */
const SyncChip = () => {
  const [lang] = useLang();
  const c = useCloud();
  if (!c.enabled) return null;
  const map = lang === "en" ? {
    syncing: { color: "var(--cyan)", label: "Syncing…" },
    synced:  { color: "var(--green)", label: "Synced" },
    error:   { color: "var(--red)", label: c.message || "Sync error" },
    offline: { color: "var(--amber)", label: "Offline" },
    signedout: { color: "var(--fg-3)", label: "Signed out" },
  } : {
    syncing: { color: "var(--cyan)", label: "Synchro…" },
    synced:  { color: "var(--green)", label: "Synchronisé" },
    error:   { color: "var(--red)", label: c.message || "Erreur synchro" },
    offline: { color: "var(--amber)", label: "Hors ligne" },
    signedout: { color: "var(--fg-3)", label: "Déconnecté" },
  };
  const v = map[c.status] || map.offline;
  const lastSyncLabel = lang === "en" ? "Last sync: " : "Dernière synchro : ";
  return (
    <div className="stat-chip" title={c.lastSync ? lastSyncLabel + new Date(c.lastSync).toLocaleTimeString(lang === "en" ? "en-US" : "fr-FR") : v.label}>
      <span className="dot" style={{ background: v.color, boxShadow: `0 0 8px ${v.color}` }}/>
      <span className="label">Cloud</span>
      <span className="val">{v.label}</span>
    </div>
  );
};

Object.assign(window, { AuthScreen, SyncChip, EmailNoticeScreen });
