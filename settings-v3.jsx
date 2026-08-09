/* ==========================================================
   settings.jsx — Réglages : profil, charge de révision,
   notifications, et sauvegarde / restauration des données.
   ========================================================== */

const Settings = () => {
  const s = useStore();
  const c = useCloud();
  const [name, setName] = React.useState(s.profile.name);
  const [field, setField] = React.useState(s.profile.field || "");
  const [confirmImport, setConfirmImport] = React.useState(null);
  const [confirmOut, setConfirmOut] = React.useState(false);
  const [confirmDeleteSubject, setConfirmDeleteSubject] = React.useState(null);
  const [subjectInput, setSubjectInput] = React.useState("");
  const fileRef = React.useRef(null);

  const [lockSupported, setLockSupported] = React.useState(false);
  const [lockEnabled, setLockEnabled] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("geii_applock_v1") || "{}").enabled === true; }
    catch { return false; }
  });
  const [lockBusy, setLockBusy] = React.useState(false);
  React.useEffect(() => { appLockSupported().then(setLockSupported); }, []);
  const onToggleLock = async () => {
    if (lockEnabled) {
      appLockDisable();
      setLockEnabled(false);
      pushToast({ kind: "default", text: "Verrouillage désactivé." });
      return;
    }
    setLockBusy(true);
    try {
      await appLockEnable();
      setLockEnabled(true);
      pushToast({ kind: "xp", text: "Verrouillage activé — Face ID / Touch ID / code demandé à l'ouverture." });
    } catch {
      pushToast({ kind: "default", text: "Activation annulée ou refusée." });
    } finally {
      setLockBusy(false);
    }
  };

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

          <label className="field-label" style={{ marginTop: 16 }}>Domaine</label>
          <div className="row gap-2">
            <input className="input" value={field} onChange={(e) => setField(e.target.value)}
              placeholder="Ex. GEII, Droit, Autoformation…" style={{ flex: 1 }}/>
            <button className="btn primary" disabled={field === (s.profile.field || "")}
              onClick={() => { actions.updateProfile({ field: field.trim() }); pushToast({ kind: "default", text: "Domaine mis à jour." }); }}>
              Enregistrer
            </button>
          </div>

          <label className="field-label" style={{ marginTop: 16 }}>Année / niveau</label>
          <div className="year-grid">
            {[
              { id: "Y1", lbl: "Année 1" }, { id: "Y2", lbl: "Année 2" },
              { id: "Y3", lbl: "Année 3" }, { id: "OTHER", lbl: "Autre" },
            ].map((y) => (
              <button key={y.id} className={"year-card " + (s.profile.year === y.id ? "active" : "")}
                onClick={() => actions.updateProfile({ year: y.id })}>
                <div className="lbl">{y.lbl}</div>
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

          <Card title="Matières" meta="LIBRES · PAS FORCÉMENT SCOLAIRES">
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 12 }}>
              Un cours, un sport, un projet perso, ta vie pro… Ce que tu veux suivre séparément dans tes tâches, chapitres et examens.
            </div>
            <div className="row gap-2">
              <input className="input" value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && subjectInput.trim()) { actions.addSubject(subjectInput); setSubjectInput(""); } }}
                placeholder="Ex. Sport, Perso, Automatique…" style={{ flex: 1 }}/>
              <button className="btn primary" disabled={!subjectInput.trim()}
                onClick={() => { actions.addSubject(subjectInput); setSubjectInput(""); }}>
                Ajouter
              </button>
            </div>
            {s.subjects.length > 0 ? (
              <div className="row gap-2" style={{ flexWrap: "wrap", marginTop: 14 }}>
                {s.subjects.map((sub) => (
                  <span key={sub.id} className="tag" style={{ color: sub.color, borderColor: sub.color + "55", background: sub.color + "12" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: sub.color }}/>
                    {sub.name}
                    <button type="button" onClick={() => setConfirmDeleteSubject(sub)}
                      style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, marginLeft: 4, fontSize: 12, lineHeight: 1 }}
                      title="Supprimer">✕</button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>Aucune matière pour l'instant.</div>
            )}
          </Card>

          {lockSupported && (
            <Card title="Sécurité" meta="VERROUILLAGE DE L'APPAREIL">
              <div className="sound-toggle" style={{ fontSize: 12 }}>
                <span>Face ID / Touch ID / code</span>
                <button type="button" role="switch" aria-checked={lockEnabled}
                  aria-label="Verrouillage biométrique"
                  disabled={lockBusy}
                  className={"switch " + (lockEnabled ? "on" : "")}
                  onClick={onToggleLock}/>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
                Redemande Face ID, Touch ID ou le code de l'appareil à chaque ouverture
                de l'application. Vérifié directement par ton téléphone — aucune donnée
                biométrique ne transite ni n'est stockée par l'application ou Supabase.
              </div>
            </Card>
          )}
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
      {confirmDeleteSubject && (
        <ConfirmModal
          title="Supprimer cette matière"
          message={`"${confirmDeleteSubject.name}" sera retirée de la liste. Les tâches, chapitres et examens déjà associés garderont juste une étiquette vide — rien d'autre n'est supprimé.`}
          confirmLabel="Supprimer"
          onConfirm={() => { actions.deleteSubject(confirmDeleteSubject.id); setConfirmDeleteSubject(null); }}
          onClose={() => setConfirmDeleteSubject(null)}
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
