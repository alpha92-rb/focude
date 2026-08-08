/* ==========================================================
   settings.jsx — Réglages : profil, charge de révision,
   notifications, et sauvegarde / restauration des données.
   ========================================================== */

const Settings = () => {
  const s = useStore();
  const c = useCloud();
  const [name, setName] = React.useState(s.profile.name);
  const [confirmImport, setConfirmImport] = React.useState(null);
  const [confirmOut, setConfirmOut] = React.useState(false);
  const fileRef = React.useRef(null);

  const gb = growthBreakdown(s);
  const created = new Date(s.profile.createdAt);
  const days = Math.max(1, Math.floor((now() - s.profile.createdAt) / dayMs));

  const pickFile = () => fileRef.current && fileRef.current.click();
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setConfirmImport(String(reader.result));
    reader.readAsText(f);
    e.target.value = "";
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Réglages</h1>
          <div className="sub">PROFIL • CHARGE DE TRAVAIL • SAUVEGARDE</div>
        </div>
        <div className="actions">
          <div className="stat-chip"><span className="label">Compte</span><span className="val mono">{days} j</span></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Card title="Profil" meta={`NIVEAU ${s.profile.level} · ${rankFor(s.profile.level).toUpperCase()}`}>
          <label className="field-label">Nom affiché</label>
          <div className="row gap-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }}/>
            <button className="btn primary" disabled={!name.trim() || name === s.profile.name}
              onClick={() => { actions.updateProfile({ name: name.trim() }); pushToast({ kind: "default", text: "Profil mis à jour." }); }}>
              Enregistrer
            </button>
          </div>

          <label className="field-label" style={{ marginTop: 16 }}>Année d'étude</label>
          <div className="year-grid">
            {["BUT1", "BUT2", "BUT3", "OTHER"].map((y) => (
              <button key={y} className={"year-card " + (s.profile.year === y ? "active" : "")}
                onClick={() => actions.updateProfile({ year: y })}>
                <div className="lbl">{y === "OTHER" ? "Autre" : y.replace("BUT", "BUT ")}</div>
              </button>
            ))}
          </div>

          <hr className="div"/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Stat lbl="XP total" val={s.profile.totalXp.toLocaleString("fr-FR")}/>
            <Stat lbl="Streak" val={`${computeStreak(s)} j`}/>
            <Stat lbl="Pomodoros" val={gb.pomodoros}/>
            <Stat lbl="Révisions" val={gb.reviews}/>
          </div>
          <div className="muted mono" style={{ fontSize: 10, marginTop: 12, letterSpacing: "0.1em" }}>
            DEPUIS LE {created.toLocaleDateString("fr-FR")}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Charge de révision" meta="ANTI-SURCHARGE">
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              Nombre maximum de révisions placées dans tes quêtes chaque jour. Les chapitres en trop sont automatiquement reportés au lendemain, les plus urgents d'abord.
            </div>
            <DurationSlider
              label="Révisions max / jour"
              value={(s.settings && s.settings.reviewCap) || 8}
              max={20} unit="chap."
              onChange={(v) => actions.setReviewCap(v)}
            />
            {deferredReviewCount(s) > 0 && (
              <div className="defer-hint mono" style={{ marginTop: 10 }}>
                {deferredReviewCount(s)} révision(s) actuellement reportée(s).
              </div>
            )}
          </Card>

          <Card title="Alertes & son">
            <div className="sound-toggle" style={{ fontSize: 12, marginBottom: 12 }}>
              <span>Sons de l'interface</span>
              <button type="button" role="switch" aria-checked={!!s.settings.sound}
                aria-label="Sons de l'interface"
                className={"switch " + (s.settings.sound ? "on" : "")}
                onClick={() => actions.toggleSound()}/>
            </div>
            <div className="sound-toggle" style={{ fontSize: 12 }}>
              <span>Notifications de fin de Pomodoro</span>
              <button type="button" role="switch" aria-checked={!!s.settings.notify}
                aria-label="Notifications système"
                className={"switch " + (s.settings.notify ? "on" : "")}
                onClick={() => s.settings.notify ? actions.disableNotifications() : actions.enableNotifications()}/>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
              Te prévient même si l'application est en arrière-plan.
            </div>
          </Card>
        </div>
      </div>

      {c.enabled && c.user && (
        <div style={{ marginTop: 16 }}>
          <Card title="Mon compte" meta="SYNCHRO MULTI-APPAREILS">
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13 }}>{c.user.email}</div>
                <div className="muted mono" style={{ fontSize: 10, letterSpacing: "0.12em", marginTop: 4 }}>
                  {c.status === "synced" ? "À JOUR" : c.status === "syncing" ? "SYNCHRONISATION…" : (c.message || "HORS LIGNE").toUpperCase()}
                  {c.lastSync ? " · " + new Date(c.lastSync).toLocaleTimeString("fr-FR") : ""}
                </div>
              </div>
              <div className="row gap-2">
                <button className="btn" onClick={() => pushNow()}>Synchroniser maintenant</button>
                <button className="btn ghost danger" onClick={() => setConfirmOut(true)}>Se déconnecter</button>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.6 }}>
              Tes données sont enregistrées automatiquement sur ton compte et récupérées
              sur chaque appareil où tu te connectes. Personne d'autre ne peut y accéder.
            </div>
          </Card>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Card title="Sauvegarde des données" meta="EXPORT · IMPORT">          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Tes données vivent uniquement dans ce navigateur. Exporte régulièrement un fichier de sauvegarde
            — c'est la seule protection si tu changes d'ordinateur, vides ton cache ou réinstalles l'application.
          </div>
          <div className="row gap-2" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => actions.exportBackup()}>
              <Icon name="check" size={13}/>Exporter ma sauvegarde
            </button>
            <button className="btn" onClick={pickFile}>
              <Icon name="reset" size={13}/>Restaurer un fichier
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} style={{ display: "none" }}/>
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 12, letterSpacing: "0.12em" }}>
            {s.chapters.length} CHAPITRES · {s.tasks.length} TÂCHES · {s.exams.length} EXAMENS · {s.sessions.length} SESSIONS
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="Raccourcis clavier">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {[
              ["1 – 9", "Changer de page"],
              ["Espace", "Démarrer / mettre en pause le Pomodoro"],
              ["R", "Réinitialiser le Pomodoro"],
              ["N", "Nouvelle tâche / chapitre selon la page"],
            ].map(([k, d]) => (
              <div key={k} className="row gap-2" style={{ alignItems: "baseline" }}>
                <kbd className="kbd">{k}</kbd>
                <span className="muted" style={{ fontSize: 11.5 }}>{d}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {confirmImport && (
        <ConfirmModal
          title="Restaurer cette sauvegarde"
          message="Toutes tes données actuelles seront remplacées par le contenu du fichier. Cette action est irréversible."
          confirmLabel="Restaurer"
          onConfirm={() => actions.importBackup(confirmImport)}
          onClose={() => setConfirmImport(null)}
        />
      )}
      {confirmOut && (
        <ConfirmModal
          title="Se déconnecter"
          message="Tes données sont d'abord envoyées sur ton compte, puis effacées de cet appareil. Tu les retrouveras à la prochaine connexion."
          confirmLabel="Se déconnecter"
          onConfirm={() => cloudAuth.signOut()}
          onClose={() => setConfirmOut(false)}
        />
      )}
    </div>
  );
};

window.Settings = Settings;
