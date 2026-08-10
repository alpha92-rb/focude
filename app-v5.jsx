/* ==========================================================
   app.jsx — Top-level App: navigation + topbar + page routing.
   ========================================================== */

const PAGE_IDS = ["dashboard", "pomodoro", "revisions", "tasks", "entreprise", "exams", "ambiance", "profile", "settings"];

const App = () => {
  const s = useStore();
  const [lang] = useLang();
  const toasts = useToasts();
  const c = useCloud();
  const [page, setPage] = React.useState("dashboard");
  const [confirmReset, setConfirmReset] = React.useState(false);
  const xpSeen = React.useRef(null);
  const [systemEvent, setSystemEvent] = React.useState(null); // { level, rank } | { level, rank, closing: true } | null

  // L'onglet Entreprise disparaît si l'utilisateur a répondu "non" à "tu
  // travailles ?" — s'il était affiché quand la réponse a changé, on ne
  // laisse pas l'utilisateur bloqué dessus.
  React.useEffect(() => {
    if (page === "entreprise" && s && s.profile && !s.profile.worksJob) setPage("dashboard");
  }, [page, s && s.profile && s.profile.worksJob]);

  const running = !!(s && s.timer && s.timer.running);
  const remaining = s && s.timer ? s.timer.remaining : 0;

  // ---- Global Pomodoro clock: keeps ticking whatever page you're on ----
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (state.timer.remaining <= 1) actions.timerComplete();
      else actions.timerTick();
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // ---- Countdown in the browser tab title ----
  React.useEffect(() => {
    const base = "Focude";
    if (running && s && s.pomodoro) {
      const m = Math.floor(remaining / 60), sec = remaining % 60;
      const tag = s.pomodoro.mode === "focus" ? "Focus" : "Pause";
      document.title = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")} · ${tag} — ${base}`;
    } else {
      document.title = base + " — " + t("onb.subtitle");
    }
  }, [running, remaining, s && s.pomodoro && s.pomodoro.mode]);

  // ---- XP / level-up toasts (ignores the mount pass and stale events) ----
  const lastXp = s && s._lastXp;
  React.useEffect(() => {
    if (!lastXp) return;
    if (xpSeen.current === lastXp.at) return;
    xpSeen.current = lastXp.at;
    if (now() - lastXp.at > 5000) return;
    if (lastXp.leveled) {
      sfx.levelUp();
      setSystemEvent({ level: s.profile.level, rank: rankFor(s.profile.level) });
    } else {
      pushToast({ kind: "xp", text: `+${lastXp.amount} XP · ${lastXp.reason}` });
    }
  }, [lastXp]);

  // ---- "System" level-up window: auto-dismiss after a few seconds, unless already closing ----
  React.useEffect(() => {
    if (!systemEvent || systemEvent.closing) return;
    const id = setTimeout(() => setSystemEvent((e) => e && { ...e, closing: true }), 4600);
    return () => clearTimeout(id);
  }, [systemEvent]);

  const closeSystemEvent = () => {
    setSystemEvent((e) => e && { ...e, closing: true });
  };

  // Les raccourcis 1-9 doivent pointer vers ce qui est réellement affiché
  // dans le menu — si Entreprise est masqué (pas de travail déclaré), la
  // touche 5 ne doit plus y sauter, sinon les numéros ne correspondraient
  // plus à ce que l'utilisateur voit.
  const visiblePageIds = React.useMemo(
    () => PAGE_IDS.filter((id) => id !== "entreprise" || (s && s.profile && s.profile.worksJob)),
    [s && s.profile && s.profile.worksJob]
  );

  // ---- Keyboard shortcuts (ignored while typing in a field) ----
  React.useEffect(() => {
    const onKey = (e) => {
      const el = e.target;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= visiblePageIds.length) { setPage(visiblePageIds[n - 1]); sfx.tick(); return; }
      if (e.code === "Space") {
        e.preventDefault();
        state.timer.running ? actions.timerPause() : actions.timerStart();
        sfx.tick();
      } else if (e.key.toLowerCase() === "r") {
        actions.timerReset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visiblePageIds]);

  const ToastLayer = (
    <div className="toast-stack">
      {toasts.map((t) => (<div key={t.id} className={"toast " + t.kind}>{t.text}</div>))}
    </div>
  );

  const SystemLevelUp = systemEvent && (
    <div className="system-layer">
      <div
        className={"system-scrim" + (systemEvent.closing ? " out" : "")}
        onClick={closeSystemEvent}
        onAnimationEnd={() => { if (systemEvent.closing) setSystemEvent(null); }}
      />
      <div className={"system-panel" + (systemEvent.closing ? " out" : "")} onClick={closeSystemEvent}>
        <div className="system-scan"/>
        <div className="system-eyebrow">{t("system.eyebrow")}</div>
        <div className="system-title">{t("system.title")}</div>
        <div className="system-divider"/>
        <div className="system-body">
          <div className="system-level">{t("system.level")} {systemEvent.level}</div>
          <div className="system-sub">{t("system.newRank")} <b>{systemEvent.rank}</b></div>
        </div>
        <div className="system-hint">{t("system.hint")}</div>
      </div>
    </div>
  );

  // === Synchro configurée : écran de connexion avant tout ===
  if (c.enabled && c.status === "boot") {
    return (
      <div className="boot-shell">
        <div className="app-bg"/>
        <div className="boot-card">
          <Logo size={44}/>
          <div className="mono boot-label">{lang === "en" ? "SIGNING IN…" : "CONNEXION AU COMPTE…"}</div>
        </div>
      </div>
    );
  }
  if (c.enabled && !c.user && c.status !== "offline") {
    return (<><AuthScreen/>{ToastLayer}</>);
  }

  // === No profile yet → onboarding ===
  if (!s || !s.profile || !s.profile.onboarded) {
    return (<><Onboarding/>{ToastLayer}</>);
  }

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: "dashboard" },
    { id: "pomodoro",  label: t("nav.pomodoro"),  icon: "pomodoro" },
    { id: "revisions", label: t("nav.revisions"), icon: "revisions", badge: reviewQuests(s).length || null },
    { id: "tasks",     label: t("nav.tasks"),     icon: "tasks", badge: (s.tasks.filter((t)=>t.status!=="done").length + reviewQuests(s).length) || null },
    ...(s.profile.worksJob ? [{ id: "entreprise", label: t("nav.entreprise"), icon: "circuit", badge: proQuests(s).length || null }] : []),
    { id: "exams",     label: t("nav.exams"),     icon: "exams",  badge: urgentExams(s).filter(e => e.daysLeft <= 7).length || null, urgent: urgentExams(s).some(e => e.daysLeft <= 7) },
    { id: "ambiance",  label: t("nav.media"),     icon: "sound" },
    { id: "profile",   label: t("nav.profile"),   icon: "stats" },
    { id: "settings",  label: t("nav.settings"),  icon: "settings" },
  ];

  const xpPct = s.profile.xp / s.profile.xpForNext;
  const rank = rankFor(s.profile.level);

  return (
    <div className="app">
      <div className="app-bg"/>
      {/* Décor pur : sur téléphone chaque particule est une couche animée de plus
          à composer à 60 fps, pour un effet que le petit écran rend à peine. */}
      <Particles count={matchMedia("(max-width: 840px)").matches ? 8 : 18}/>

      <div className="topbar">
        <div className="brand">
          <Logo size={30}/>
          <div className="brand-text">
            <div className="t1">FOCUDE</div>
            <div className="t2">SYSTEM v1.0</div>
          </div>
        </div>

        <div className="stat-chip">
          <Avatar src={s.profile.avatar} name={s.profile.name} size={20}/>
          <span className="label">{t("topbar.student")}</span>
          <span className="val">{s.profile.name}</span>
        </div>

        <div className="stat-chip">
          <span className="label">{t("topbar.rank")}</span>
          <span className="val">{rank}</span>
        </div>

        <div className="stat-chip">
          <Icon name="fire" size={12} stroke="oklch(0.88 0.14 75)"/>
          <span className="label">{t("topbar.streak")}</span>
          <span className="val mono">{computeStreak(s)}j</span>
        </div>

        <SyncChip/>

        <div className="topbar-spacer"/>

        <div className="xp-bar">
          <div className="level-badge">{s.profile.level}</div>
          <div className="progress"><i style={{ width: (xpPct * 100) + "%" }}/></div>
          <div className="xp-text mono"><b>{s.profile.xp.toLocaleString(lang === "en" ? "en-US" : "fr-FR")}</b> / {s.profile.xpForNext.toLocaleString(lang === "en" ? "en-US" : "fr-FR")} XP</div>
        </div>
      </div>

      <aside className="sidebar">
        <div className="sec-label">{t("nav.workspace")}</div>
        {navItems.map((item, i) => (
          <button key={item.id}
            className={"nav-btn " + (page === item.id ? "active " : "") + (item.urgent ? "urgent" : "")}
            title={`${item.label}  —  ${lang === "en" ? "key" : "touche"} ${i + 1}`}
            onClick={() => { setPage(item.id); sfx.tick(); }}>
            <span className="ico"><Icon name={item.icon} size={15}/></span>
            <span>{item.label}</span>
            {item.badge ? <span className="badge">{item.badge}</span> : null}
          </button>
        ))}

        <div className="sec-label">{t("nav.system")}</div>
        <button className="nav-btn" onClick={() => setConfirmReset(true)}>
          <span className="ico"><Icon name="reset" size={15}/></span>
          <span>{t("nav.reset")}</span>
        </button>

        <div className="sidebar-footer">
          <div className="sound-toggle">
            <span>{s.settings.sound ? (lang === "en" ? "Sound on" : "Audio activé") : (lang === "en" ? "Sound off" : "Audio coupé")}</span>
            <button
              type="button" role="switch" aria-checked={s.settings.sound}
              aria-label={s.settings.sound ? (lang === "en" ? "Mute" : "Couper le son") : (lang === "en" ? "Unmute" : "Activer le son")}
              className={"switch " + (s.settings.sound ? "on" : "")}
              onClick={() => actions.toggleSound()}
            />
          </div>
          <div className="mono" style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.18em", marginTop: 4 }}>
            {(s.profile.field || (lang === "en" ? "LOCAL STORAGE" : "SAUVEGARDE LOCALE")).toUpperCase()}
          </div>
        </div>
      </aside>

      <main className="main">
        {page === "dashboard" && <Dashboard onNav={setPage}/>}
        {page === "pomodoro" && <Pomodoro/>}
        {page === "revisions" && <Revisions/>}
        {page === "tasks" && <TasksPage/>}
        {page === "entreprise" && s.profile.worksJob && <Entreprise/>}
        {page === "exams" && <Exams/>}
        {page === "ambiance" && <MediaPage/>}
        {page === "profile" && <ProfilePage/>}
        {page === "settings" && <Settings/>}
      </main>

      <DockedPlayer/>
      <PlayerPill/>

      {running && page !== "pomodoro" && (
        <button className="timer-pill" onClick={() => setPage("pomodoro")} title={lang === "en" ? "Back to Pomodoro" : "Retour au Pomodoro"}>
          <span className={"timer-dot " + (s.pomodoro.mode === "focus" ? "focus" : "pause")}/>
          <span className="mono">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</span>
          <span className="timer-label">{s.pomodoro.mode === "focus" ? "Focus" : (lang === "en" ? "Break" : "Pause")}</span>
        </button>
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + t.kind}>{t.text}</div>
        ))}
      </div>

      {SystemLevelUp}

      {confirmReset && (
        <ConfirmModal
          title={lang === "en" ? "Reset the system" : "Réinitialiser le système"}
          message={lang === "en"
            ? "All local data will be deleted: chapters, tasks, exams, sessions, contacts, deliveries, and progress. This action is irreversible."
            : "Toutes les données locales seront supprimées : chapitres, tâches, examens, sessions, contacts, livraisons et progression. Cette action est irréversible."}
          confirmLabel={t("nav.reset")}
          onConfirm={() => actions.resetAll()}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
};

// Le verrou d'appareil protège l'accès local (Face ID/Touch ID/code) : il
// s'affiche avant même l'écran de connexion Supabase, puisqu'il garde
// l'appareil, pas le compte.
ReactDOM.createRoot(document.getElementById("root")).render(<AppLockGate><App/></AppLockGate>);

// Démarre la couche de synchronisation (inerte si non configurée)
if (typeof startCloud === "function") startCloud();
