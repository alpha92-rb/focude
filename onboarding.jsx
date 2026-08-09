/* ==========================================================
   onboarding.jsx — First-launch profile creation.
   ========================================================== */

const STEP_COUNT = 5;

const Onboarding = () => {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [field, setField] = React.useState("");
  const [year, setYear] = React.useState("Y2");
  const [subjects, setSubjects] = React.useState([]);
  const [subjectInput, setSubjectInput] = React.useState("");
  const [mode, setMode] = React.useState("fresh");

  const addSubjectChip = (raw) => {
    const trimmed = (raw || subjectInput).trim();
    if (!trimmed) return;
    if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) { setSubjectInput(""); return; }
    setSubjects((prev) => [...prev, { id: "sub" + Date.now() + prev.length, name: trimmed, color: SUBJECT_PALETTE[prev.length % SUBJECT_PALETTE.length] }]);
    setSubjectInput("");
  };
  const removeSubjectChip = (id) => setSubjects((prev) => prev.filter((s) => s.id !== id));

  const submit = () => {
    actions.initProfile({ name, field, year, subjects, mode });
    sfx.levelUp();
    pushToast({ kind: "levelup", text: `Bienvenue ${name || "à toi"} — ta molécule est calibrée.`, duration: 4500 });
  };

  return (
    <div className="onboarding-shell">
      <div className="app-bg"/>
      <Particles count={28}/>

      <div className="onb-stage">
        {/* Left: visual */}
        <div className="onb-visual">
          <div className="onb-molecule">
            <Molecule3D stage={1}/>
            <div className="corners"><i className="tl"/><i className="tr"/><i className="bl"/><i className="br"/></div>
          </div>
          <div className="onb-readout">
            <div className="line"><b>SYSTEM</b> FOCUDE v1.0</div>
            <div className="line"><b>ESPRIT</b> <span style={{ color: "var(--cyan)" }}>EN ATTENTE D'ÉVEIL</span></div>
            <div className="line"><b>NODE</b> CORE-0 · {(Math.random()*999999|0).toString(16).toUpperCase().padStart(6,"0")}</div>
            <div className="line"><b>BUILD</b> {new Date().toISOString().slice(0,10)}</div>
          </div>
        </div>

        {/* Right: form */}
        <div className="onb-form">
          <div className="onb-brand">
            <Logo size={40}/>
            <div>
              <div style={{ fontSize: 15, letterSpacing: "0.04em" }}>FOCUDE</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.28em", color: "var(--fg-3)", marginTop: 2 }}>SYSTÈME DE PROGRESSION INTELLECTUELLE</div>
            </div>
          </div>

          <div className="onb-steps">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <span key={i} className={step >= i ? "on" : ""}>{String(i + 1).padStart(2, "0")}</span>
            ))}
          </div>

          {step === 0 && (
            <div className="onb-step">
              <h2>Bienvenue.</h2>
              <p>Avant l'initialisation, le système a besoin de connaître son utilisateur. Toutes les données restent en local sur cette machine.</p>
              <label className="field-label">Prénom ou pseudonyme</label>
              <input
                className="input lg" autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setStep(1)}
                placeholder="Ex. Lucas"
              />
              <div className="onb-actions">
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>ÉTAPE 1 / {STEP_COUNT}</span>
                <button className="btn primary" disabled={!name.trim()} onClick={() => setStep(1)}>
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onb-step">
              <h2>Ton domaine.</h2>
              <p>Filière, études, métier, passion — ce que tu veux. Ça sert juste à personnaliser l'appli, jamais à en limiter l'usage.</p>
              <label className="field-label">Domaine (facultatif)</label>
              <input
                className="input lg" autoFocus
                value={field}
                onChange={(e) => setField(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setStep(2)}
                placeholder="Ex. GEII, Droit, Médecine, Autoformation…"
              />
              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(0)}>← Retour</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>ÉTAPE 2 / {STEP_COUNT}</span>
                <button className="btn primary" onClick={() => setStep(2)}>Continuer →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onb-step">
              <h2>Année / niveau.</h2>
              <p>Permet d'adapter la complexité initiale de l'arbre de connaissances et la suggestion d'intervalles de révision.</p>
              <div className="year-grid">
                {[
                  { id: "Y1", lbl: "Année 1", sub: "Fondamentaux" },
                  { id: "Y2", lbl: "Année 2", sub: "Approfondissement" },
                  { id: "Y3", lbl: "Année 3", sub: "Spécialisation" },
                  { id: "OTHER", lbl: "Autre", sub: "Pas d'année précise" },
                ].map((y) => (
                  <button key={y.id}
                    className={"year-card " + (year === y.id ? "active" : "")}
                    onClick={() => setYear(y.id)}>
                    <div className="lbl">{y.lbl}</div>
                    <div className="sub">{y.sub}</div>
                  </button>
                ))}
              </div>
              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(1)}>← Retour</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>ÉTAPE 3 / {STEP_COUNT}</span>
                <button className="btn primary" onClick={() => setStep(3)}>Continuer →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onb-step">
              <h2>Tes matières.</h2>
              <p>
                Ce que tu veux suivre séparément — pas forcément scolaire : un cours,
                un sport, un projet perso, ta vie pro… Tu pourras en ajouter, renommer
                ou supprimer à tout moment depuis les Réglages.
              </p>
              <label className="field-label">Ajouter une matière</label>
              <div className="row gap-2">
                <input
                  className="input" autoFocus
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubjectChip()}
                  placeholder="Ex. Électronique, Sport, Perso…"
                  style={{ flex: 1 }}
                />
                <button className="btn" disabled={!subjectInput.trim()} onClick={() => addSubjectChip()}>Ajouter</button>
              </div>

              {subjects.length > 0 && (
                <div className="row gap-2" style={{ flexWrap: "wrap", marginTop: 14 }}>
                  {subjects.map((s) => (
                    <span key={s.id} className="tag" style={{ color: s.color, borderColor: s.color + "55", background: s.color + "12", cursor: "pointer" }}
                      onClick={() => removeSubjectChip(s.id)} title="Retirer">
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }}/>
                      {s.name} ✕
                    </span>
                  ))}
                </div>
              )}

              <div className="muted" style={{ fontSize: 11, marginTop: 14 }}>Rien d'obligatoire ici — tu peux continuer sans matière et en ajouter plus tard.</div>

              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(2)}>← Retour</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>ÉTAPE 4 / {STEP_COUNT}</span>
                <button className="btn primary" onClick={() => setStep(4)}>Continuer →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="onb-step">
              <h2>Mode de démarrage.</h2>
              <p>Commencer avec des chapitres et tâches d'exemple, ou repartir d'une page blanche.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className={"mode-card " + (mode === "fresh" ? "active" : "")} onClick={() => setMode("fresh")}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>Démarrage propre</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Tes matières, niveau 1, XP zéro, molécule minimale. Tu construis tout.</div>
                    </div>
                    <span className="tag blue">RECOMMANDÉ</span>
                  </div>
                </button>
                <button className={"mode-card " + (mode === "demo" ? "active" : "")} onClick={() => setMode("demo")}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>Avec données d'exemple</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>10 chapitres, 7 tâches, 5 DS, 90 jours de Pomodoro simulés (exemple type études d'ingénieur). Pour explorer le système avant de l'utiliser.</div>
                    </div>
                    <span className="tag dim">DÉMO</span>
                  </div>
                </button>
              </div>
              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(3)}>← Retour</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>ÉTAPE 5 / {STEP_COUNT}</span>
                <button className="btn primary" onClick={submit}>
                  <Icon name="lightning" size={12}/>
                  Initialiser le système
                </button>
              </div>
            </div>
          )}

          <div className="onb-footer mono">
            <span>SAUVEGARDE LOCALE · AUCUNE DONNÉE ENVOYÉE</span>
            <span>MULTI-DOMAINE · MATIÈRES PERSONNALISABLES</span>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Onboarding = Onboarding;
