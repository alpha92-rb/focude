/* ==========================================================
   onboarding.jsx — First-launch profile creation.
   ========================================================== */

const Onboarding = () => {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [year, setYear] = React.useState("BUT2");
  const [mode, setMode] = React.useState("fresh");

  const submit = () => {
    actions.initProfile({ name, year, mode });
    sfx.levelUp();
    pushToast({ kind: "levelup", text: `Bienvenue ${name || "ingénieur"} — votre molécule est calibrée.`, duration: 4500 });
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
            <div className="line"><b>SYSTEM</b> GEII · LAB v1.0</div>
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
              <div style={{ fontSize: 15, letterSpacing: "0.04em" }}>GEII · LAB</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.28em", color: "var(--fg-3)", marginTop: 2 }}>SYSTÈME DE PROGRESSION INTELLECTUELLE</div>
            </div>
          </div>

          <div className="onb-steps">
            <span className={step >= 0 ? "on" : ""}>01</span>
            <span className={step >= 1 ? "on" : ""}>02</span>
            <span className={step >= 2 ? "on" : ""}>03</span>
          </div>

          {step === 0 && (
            <div className="onb-step">
              <h2>Bienvenue, ingénieur.</h2>
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
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>ÉTAPE 1 / 3</span>
                <button className="btn primary" disabled={!name.trim()} onClick={() => setStep(1)}>
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onb-step">
              <h2>Année d'étude.</h2>
              <p>Permet d'adapter la complexité initiale de l'arbre de connaissances et la suggestion d'intervalles de révision.</p>
              <div className="year-grid">
                {[
                  { id: "BUT1", lbl: "BUT 1", sub: "Fondamentaux" },
                  { id: "BUT2", lbl: "BUT 2", sub: "Approfondissement" },
                  { id: "BUT3", lbl: "BUT 3", sub: "Spécialisation + SAÉ" },
                  { id: "OTHER", lbl: "Autre", sub: "Prépa, école d'ingé…" },
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
                <button className="btn ghost" onClick={() => setStep(0)}>← Retour</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>ÉTAPE 2 / 3</span>
                <button className="btn primary" onClick={() => setStep(2)}>Continuer →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onb-step">
              <h2>Mode de démarrage.</h2>
              <p>Commencer avec des chapitres et tâches d'exemple, ou repartir d'une page blanche.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className={"mode-card " + (mode === "fresh" ? "active" : "")} onClick={() => setMode("fresh")}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>Démarrage propre</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Aucune donnée. Niveau 1, XP zéro, molécule minimale. Vous construisez tout.</div>
                    </div>
                    <span className="tag blue">RECOMMANDÉ</span>
                  </div>
                </button>
                <button className={"mode-card " + (mode === "demo" ? "active" : "")} onClick={() => setMode("demo")}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>Avec données d'exemple</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>10 chapitres, 7 tâches, 5 DS, 90 jours de Pomodoro simulés. Pour explorer le système avant de l'utiliser.</div>
                    </div>
                    <span className="tag dim">DÉMO</span>
                  </div>
                </button>
              </div>
              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(1)}>← Retour</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>ÉTAPE 3 / 3</span>
                <button className="btn primary" onClick={submit}>
                  <Icon name="lightning" size={12}/>
                  Initialiser le système
                </button>
              </div>
            </div>
          )}

          <div className="onb-footer mono">
            <span>SAUVEGARDE LOCALE · AUCUNE DONNÉE ENVOYÉE</span>
            <span>BUT GEII · ÉLECTRONIQUE / ÉNERGIE / INFO. INDUSTRIELLE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Onboarding = Onboarding;
