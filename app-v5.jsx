/* ==========================================================
   app.jsx — Top-level App: navigation + topbar + page routing.
   ========================================================== */

const PAGE_IDS = ["dashboard", "pomodoro", "revisions", "tasks", "entreprise", "exams", "ambiance", "stats", "settings"];

const App = () => {
  const s = useStore();
  const toasts = useToasts();
  const c = useCloud();
  const [page, setPage] = React.useState("dashboard");
  const [confirmReset, setConfirmReset] = React.useState(false);
  const xpSeen = React.useRef(null);

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
    const base = "GEII · Lab";
    if (running && s && s.pomodoro) {
      const m = Math.floor(remaining / 60), sec = remaining % 60;
      const tag = s.pomodoro.mode === "focus" ? "Focus" : "Pause";
      document.title = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")} · ${tag} — ${base}`;
    } else {
      document.title = base + " — Système de progression intellectuelle";
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
      pushToast({ kind: "levelup", text: `Niveau ${s.profile.level} atteint — la molécule évolue.`, duration: 4200 });
    } else {
      pushToast({ kind: "xp", text: `+${lastXp.amount} XP · ${lastXp.reason}` });
    }
  }, [lastXp]);

  // ---- Keyboard shortcuts (ignored while typing in a field) ----
  React.useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= PAGE_IDS.length) { setPage(PAGE_IDS[n - 1]); sfx.tick(); return; }
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
  }, []);

  const ToastLayer = (
    <div className="toast-stack">
      {toasts.map((t) => (<div key={t.id} className={"toast " + t.kind}>{t.text}</div>))}
    </div>
  );

  // === Synchro configurée : écran de connexion avant tout ===
  if (c.enabled && c.status === "boot") {
    return (
      <div className="boot-shell">
        <div className="app-bg"/>
        <div className="boot-card">
          <Logo size={44}/>
          <div className="mono boot-label">CONNEXION AU COMPTE…</div>
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
    { id: "dashboard", label: "Tableau de bord", icon: "dashboard" },
    { id: "pomodoro",  label: "Pomodoro",        icon: "pomodoro" },
    { id: "revisions", label: "Répétition espacée", icon: "revisions", badge: reviewQuests(s).length || null },
    { id: "tasks",     label: "Tâches",          icon: "tasks", badge: (s.tasks.filter((t)=>t.status!=="done").length + reviewQuests(s).length) || null },
    { id: "entreprise", label: "Entreprise",      icon: "circuit", badge: proQuests(s).length || null },
    { id: "exams",     label: "Examens",         icon: "exams",  badge: urgentExams(s).filter(e => e.daysLeft <= 7).length || null, urgent: urgentExams(s).some(e => e.daysLeft <= 7) },
    { id: "ambiance",  label: "Vidéo / Musique", icon: "sound" },
    { id: "stats",     label: "Statistiques",    icon: "stats" },
    { id: "settings",  label: "Réglages",        icon: "settings" },
  ];

  const xpPct = s.profile.xp / s.profile.xpForNext;
  const rank = rankFor(s.profile.level);

  return (
    <div className="app">
      <div className="app-bg"/>
      <Particles count={18}/>

      <div className="topbar">
        <div className="brand">
          <Logo size={30}/>
          <div className="brand-text">
            <div className="t1">GEII · LAB</div>
            <div className="t2">SYSTEM v1.0</div>
          </div>
        </div>

        <div className="stat-chip">
          <span className="dot" style={{ background: "var(--cyan)", boxShadow: "0 0 8px var(--cyan)" }}/>
          <span className="label">Étudiant</span>
          <span className="val">{s.profile.name}</span>
        </div>

        <div className="stat-chip">
          <span className="label">Rang</span>
          <span className="val">{rank}</span>
        </div>

        <div className="stat-chip">
          <Icon name="fire" size={12} stroke="oklch(0.88 0.14 75)"/>
          <span className="label">Streak</span>
          <span className="val mono">{computeStreak(s)}j</span>
        </div>

        <SyncChip/>

        <div className="topbar-spacer"/>

        <div className="xp-bar">
          <div className="level-badge">{s.profile.level}</div>
          <div className="progress"><i style={{ width: (xpPct * 100) + "%" }}/></div>
          <div className="xp-text mono"><b>{s.profile.xp.toLocaleString("fr-FR")}</b> / {s.profile.xpForNext.toLocaleString("fr-FR")} XP</div>
        </div>
      </div>

      <aside className="sidebar">
        <div className="sec-label">Espace de travail</div>
        {navItems.map((item, i) => (
          <button key={item.id}
            className={"nav-btn " + (page === item.id ? "active " : "") + (item.urgent ? "urgent" : "")}
            title={`${item.label}  —  touche ${i + 1}`}
            onClick={() => { setPage(item.id); sfx.tick(); }}>
            <span className="ico"><Icon name={item.icon} size={15}/></span>
            <span>{item.label}</span>
            {item.badge ? <span className="badge">{item.badge}</span> : null}
          </button>
        ))}

        <div className="sec-label">Système</div>
        <button className="nav-btn" onClick={() => setConfirmReset(true)}>
          <span className="ico"><Icon name="reset" size={15}/></span>
          <span>Réinitialiser</span>
        </button>

        <div className="sidebar-footer">
          <div className="sound-toggle">
            <span>{s.settings.sound ? "Audio activé" : "Audio coupé"}</span>
            <button
              type="button" role="switch" aria-checked={s.settings.sound}
              aria-label={s.settings.sound ? "Couper le son" : "Activer le son"}
              className={"switch " + (s.settings.sound ? "on" : "")}
              onClick={() => actions.toggleSound()}
            />
          </div>
          <div className="mono" style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.18em", marginTop: 4 }}>
            BUT GEII • SAUVEGARDE LOCALE
          </div>
        </div>
      </aside>

      <main className="main">
        {page === "dashboard" && <Dashboard onNav={setPage}/>}
        {page === "pomodoro" && <Pomodoro/>}
        {page === "revisions" && <Revisions/>}
        {page === "tasks" && <TasksPage/>}
        {page === "entreprise" && <Entreprise/>}
        {page === "exams" && <Exams/>}
        {page === "ambiance" && <MediaPage/>}
        {page === "stats" && <Stats/>}
        {page === "settings" && <Settings/>}
      </main>

      <DockedPlayer/>
      <PlayerPill/>

      {running && page !== "pomodoro" && (
        <button className="timer-pill" onClick={() => setPage("pomodoro")} title="Retour au Pomodoro">
          <span className={"timer-dot " + (s.pomodoro.mode === "focus" ? "focus" : "pause")}/>
          <span className="mono">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</span>
          <span className="timer-label">{s.pomodoro.mode === "focus" ? "Focus" : "Pause"}</span>
        </button>
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + t.kind}>{t.text}</div>
        ))}
      </div>

      {confirmReset && (
        <ConfirmModal
          title="Réinitialiser le système"
          message="Toutes les données locales seront supprimées : chapitres, tâches, examens, sessions, contacts, livraisons et progression. Cette action est irréversible."
          confirmLabel="Réinitialiser"
          onConfirm={() => actions.resetAll()}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

// Démarre la couche de synchronisation (inerte si non configurée)
if (typeof startCloud === "function") startCloud();
