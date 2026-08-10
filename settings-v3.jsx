/* ==========================================================
   settings.jsx — Réglages : profil, langue, matières, sécurité,
   charge de révision, notifications, et sauvegarde / restauration.
   ========================================================== */

const Settings = () => {
  const [lang, setL] = useLang();
  const s = useStore();
  const c = useCloud();
  const locale = lang === "en" ? "en-US" : "fr-FR";
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
      pushToast({ kind: "default", text: lang === "en" ? "Lock disabled." : "Verrouillage désactivé." });
      return;
    }
    setLockBusy(true);
    try {
      await appLockEnable();
      setLockEnabled(true);
      pushToast({ kind: "xp", text: lang === "en" ? "Lock enabled — Face ID / Touch ID / passcode required on open." : "Verrouillage activé — Face ID / Touch ID / code demandé à l'ouverture." });
    } catch {
      pushToast({ kind: "default", text: lang === "en" ? "Setup cancelled or refused." : "Activation annulée ou refusée." });
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
          <h1>{t("settings.title")}</h1>
          <div className="sub">{t("settings.subtitle")}</div>
        </div>
        <div className="actions">
          <div className="stat-chip"><span className="label">{t("profile.account")}</span><span className="val mono">{days} {lang === "en" ? "d" : "j"}</span></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Card title={t("settings.profile")} meta={`${t("profile.level").toUpperCase()} ${s.profile.level} · ${rankFor(s.profile.level).toUpperCase()}`}>
          <label className="field-label">{t("settings.displayName")}</label>
          <div className="row gap-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }}/>
            <button className="btn primary" disabled={!name.trim() || name === s.profile.name}
              onClick={() => { actions.updateProfile({ name: name.trim() }); pushToast({ kind: "default", text: lang === "en" ? "Profile updated." : "Profil mis à jour." }); }}>
              {t("common.save")}
            </button>
          </div>

          <label className="field-label" style={{ marginTop: 16 }}>{t("settings.domain")}</label>
          <div className="row gap-2">
            <input className="input" value={field} onChange={(e) => setField(e.target.value)}
              placeholder={lang === "en" ? "E.g. Electronics, Law, Self-taught…" : "Ex. GEII, Droit, Autoformation…"} style={{ flex: 1 }}/>
            <button className="btn primary" disabled={field === (s.profile.field || "")}
              onClick={() => { actions.updateProfile({ field: field.trim() }); pushToast({ kind: "default", text: lang === "en" ? "Field updated." : "Domaine mis à jour." }); }}>
              {t("common.save")}
            </button>
          </div>

          <label className="field-label" style={{ marginTop: 16 }}>{t("settings.yearLevel")}</label>
          <div className="year-grid">
            {[
              { id: "Y1", lbl: t("onb.year1") }, { id: "Y2", lbl: t("onb.year2") },
              { id: "Y3", lbl: t("onb.year3") }, { id: "OTHER", lbl: t("onb.yearOther") },
            ].map((y) => (
              <button key={y.id} className={"year-card " + (s.profile.year === y.id ? "active" : "")}
                onClick={() => actions.updateProfile({ year: y.id })}>
                <div className="lbl">{y.lbl}</div>
              </button>
            ))}
          </div>

          <div className="sound-toggle" style={{ fontSize: 12, marginTop: 16 }}>
            <span>{t("settings.workToggle")}</span>
            <button type="button" role="switch" aria-checked={!!s.profile.worksJob}
              aria-label={t("settings.workToggle")}
              className={"switch " + (s.profile.worksJob ? "on" : "")}
              onClick={() => actions.updateProfile({ worksJob: !s.profile.worksJob })}/>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>{t("settings.workToggleDesc")}</div>

          <hr className="div"/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Stat lbl="XP" val={s.profile.totalXp.toLocaleString(locale)}/>
            <Stat lbl={t("topbar.streak")} val={`${computeStreak(s)} ${lang === "en" ? "d" : "j"}`}/>
            <Stat lbl="Pomodoros" val={gb.pomodoros}/>
            <Stat lbl={t("nav.revisions")} val={gb.reviews}/>
          </div>
          <div className="muted mono" style={{ fontSize: 10, marginTop: 12, letterSpacing: "0.1em" }}>
            {(lang === "en" ? "SINCE " : "DEPUIS LE ") + created.toLocaleDateString(locale)}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title={t("settings.language")}>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 12 }}>{t("settings.languageDesc")}</div>
            <LangSwitch/>
          </Card>

          <Card title={lang === "en" ? "Review load" : "Charge de révision"} meta={lang === "en" ? "ANTI-OVERLOAD" : "ANTI-SURCHARGE"}>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              {lang === "en"
                ? "Maximum number of reviews placed in your daily quests. Extra chapters are automatically pushed to the next day, most urgent first."
                : "Nombre maximum de révisions placées dans tes quêtes chaque jour. Les chapitres en trop sont automatiquement reportés au lendemain, les plus urgents d'abord."}
            </div>
            <DurationSlider
              label={lang === "en" ? "Max reviews / day" : "Révisions max / jour"}
              value={(s.settings && s.settings.reviewCap) || 8}
              max={20} unit={lang === "en" ? "ch." : "chap."}
              onChange={(v) => actions.setReviewCap(v)}
            />
            {deferredReviewCount(s) > 0 && (
              <div className="defer-hint mono" style={{ marginTop: 10 }}>
                {lang === "en"
                  ? `${deferredReviewCount(s)} review(s) currently deferred.`
                  : `${deferredReviewCount(s)} révision(s) actuellement reportée(s).`}
              </div>
            )}
          </Card>

          <Card title={lang === "en" ? "Alerts & sound" : "Alertes & son"}>
            <div className="sound-toggle" style={{ fontSize: 12, marginBottom: 12 }}>
              <span>{lang === "en" ? "Interface sounds" : "Sons de l'interface"}</span>
              <button type="button" role="switch" aria-checked={!!s.settings.sound}
                aria-label={lang === "en" ? "Interface sounds" : "Sons de l'interface"}
                className={"switch " + (s.settings.sound ? "on" : "")}
                onClick={() => actions.toggleSound()}/>
            </div>
            <div className="sound-toggle" style={{ fontSize: 12 }}>
              <span>{lang === "en" ? "Pomodoro end notifications" : "Notifications de fin de Pomodoro"}</span>
              <button type="button" role="switch" aria-checked={!!s.settings.notify}
                aria-label={lang === "en" ? "System notifications" : "Notifications système"}
                className={"switch " + (s.settings.notify ? "on" : "")}
                onClick={() => s.settings.notify ? actions.disableNotifications() : actions.enableNotifications()}/>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
              {lang === "en" ? "Notifies you even if the app is in the background." : "Te prévient même si l'application est en arrière-plan."}
            </div>
          </Card>

          <Card title={t("settings.subjects")} meta={t("settings.subjectsMeta")}>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 12 }}>{t("settings.subjectsDesc")}</div>
            <div className="row gap-2">
              <input className="input" value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && subjectInput.trim()) { actions.addSubject(subjectInput); setSubjectInput(""); } }}
                placeholder={t("settings.subjectsPlaceholder")} style={{ flex: 1 }}/>
              <button className="btn primary" disabled={!subjectInput.trim()}
                onClick={() => { actions.addSubject(subjectInput); setSubjectInput(""); }}>
                {t("common.add")}
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
                      title={t("common.delete")}>✕</button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>{t("settings.subjectsEmpty")}</div>
            )}
          </Card>

          {lockSupported && (
            <Card title={t("settings.security")} meta={t("settings.securityMeta")}>
              <div className="sound-toggle" style={{ fontSize: 12 }}>
                <span>{t("settings.biometric")}</span>
                <button type="button" role="switch" aria-checked={lockEnabled}
                  aria-label={t("settings.biometric")}
                  disabled={lockBusy}
                  className={"switch " + (lockEnabled ? "on" : "")}
                  onClick={onToggleLock}/>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
                {lang === "en"
                  ? "Re-asks Face ID, Touch ID, or your device passcode every time the app opens. Verified directly by your phone — no biometric data ever transits through or is stored by the app or Supabase."
                  : "Redemande Face ID, Touch ID ou le code de l'appareil à chaque ouverture de l'application. Vérifié directement par ton téléphone — aucune donnée biométrique ne transite ni n'est stockée par l'application ou Supabase."}
              </div>
            </Card>
          )}
        </div>
      </div>

      {c.enabled && c.user && (
        <div style={{ marginTop: 16 }}>
          <Card title={lang === "en" ? "My account" : "Mon compte"} meta={lang === "en" ? "MULTI-DEVICE SYNC" : "SYNCHRO MULTI-APPAREILS"}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13 }}>{c.user.email}</div>
                <div className="muted mono" style={{ fontSize: 10, letterSpacing: "0.12em", marginTop: 4 }}>
                  {c.status === "synced" ? (lang === "en" ? "UP TO DATE" : "À JOUR") : c.status === "syncing" ? (lang === "en" ? "SYNCING…" : "SYNCHRONISATION…") : (c.message || (lang === "en" ? "OFFLINE" : "HORS LIGNE")).toUpperCase()}
                  {c.lastSync ? " · " + new Date(c.lastSync).toLocaleTimeString(locale) : ""}
                </div>
              </div>
              <div className="row gap-2">
                <button className="btn" onClick={() => pushNow()}>{lang === "en" ? "Sync now" : "Synchroniser maintenant"}</button>
                <button className="btn ghost danger" onClick={() => setConfirmOut(true)}>{lang === "en" ? "Sign out" : "Se déconnecter"}</button>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.6 }}>
              {lang === "en"
                ? "Your data is automatically saved to your account and retrieved on every device you sign in from. No one else can access it."
                : "Tes données sont enregistrées automatiquement sur ton compte et récupérées sur chaque appareil où tu te connectes. Personne d'autre ne peut y accéder."}
            </div>
          </Card>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Card title={lang === "en" ? "Data backup" : "Sauvegarde des données"} meta={lang === "en" ? "EXPORT · IMPORT" : "EXPORT · IMPORT"}>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {lang === "en"
              ? "Your data lives only in this browser. Export a backup file regularly — it's the only protection if you switch computers, clear your cache, or reinstall the app."
              : "Tes données vivent uniquement dans ce navigateur. Exporte régulièrement un fichier de sauvegarde — c'est la seule protection si tu changes d'ordinateur, vides ton cache ou réinstalles l'application."}
          </div>
          <div className="row gap-2" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => actions.exportBackup()}>
              <Icon name="check" size={13}/>{lang === "en" ? "Export my backup" : "Exporter ma sauvegarde"}
            </button>
            <button className="btn" onClick={pickFile}>
              <Icon name="reset" size={13}/>{lang === "en" ? "Restore a file" : "Restaurer un fichier"}
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} style={{ display: "none" }}/>
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 12, letterSpacing: "0.12em" }}>
            {lang === "en"
              ? `${s.chapters.length} CHAPTERS · ${s.tasks.length} TASKS · ${s.exams.length} EXAMS · ${s.sessions.length} SESSIONS`
              : `${s.chapters.length} CHAPITRES · ${s.tasks.length} TÂCHES · ${s.exams.length} EXAMENS · ${s.sessions.length} SESSIONS`}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title={lang === "en" ? "Keyboard shortcuts" : "Raccourcis clavier"}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {(lang === "en" ? [
              ["1 – 9", "Switch page"],
              ["Space", "Start / pause Pomodoro"],
              ["R", "Reset Pomodoro"],
              ["N", "New task / chapter depending on page"],
            ] : [
              ["1 – 9", "Changer de page"],
              ["Espace", "Démarrer / mettre en pause le Pomodoro"],
              ["R", "Réinitialiser le Pomodoro"],
              ["N", "Nouvelle tâche / chapitre selon la page"],
            ]).map(([k, d]) => (
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
          title={lang === "en" ? "Restore this backup" : "Restaurer cette sauvegarde"}
          message={lang === "en"
            ? "All your current data will be replaced by the file's content. This action is irreversible."
            : "Toutes tes données actuelles seront remplacées par le contenu du fichier. Cette action est irréversible."}
          confirmLabel={lang === "en" ? "Restore" : "Restaurer"}
          onConfirm={() => actions.importBackup(confirmImport)}
          onClose={() => setConfirmImport(null)}
        />
      )}
      {confirmDeleteSubject && (
        <ConfirmModal
          title={lang === "en" ? "Delete this subject" : "Supprimer cette matière"}
          message={lang === "en"
            ? `"${confirmDeleteSubject.name}" will be removed from the list. Tasks, chapters, and exams already linked to it just keep an empty tag — nothing else is deleted.`
            : `"${confirmDeleteSubject.name}" sera retirée de la liste. Les tâches, chapitres et examens déjà associés garderont juste une étiquette vide — rien d'autre n'est supprimé.`}
          confirmLabel={t("common.delete")}
          onConfirm={() => { actions.deleteSubject(confirmDeleteSubject.id); setConfirmDeleteSubject(null); }}
          onClose={() => setConfirmDeleteSubject(null)}
        />
      )}
      {confirmOut && (
        <ConfirmModal
          title={lang === "en" ? "Sign out" : "Se déconnecter"}
          message={lang === "en"
            ? "Your data is sent to your account first, then cleared from this device. You'll get it back on your next sign-in."
            : "Tes données sont d'abord envoyées sur ton compte, puis effacées de cet appareil. Tu les retrouveras à la prochaine connexion."}
          confirmLabel={lang === "en" ? "Sign out" : "Se déconnecter"}
          onConfirm={() => cloudAuth.signOut()}
          onClose={() => setConfirmOut(false)}
        />
      )}
    </div>
  );
};

window.Settings = Settings;
