/* ==========================================================
   onboarding.jsx — First-launch profile creation.
   ========================================================== */

const STEP_COUNT = 6;

const LangSwitch = () => {
  const [lang, setL] = useLang();
  return (
    <div className="lang-switch">
      {LANGS.map((l) => (
        <button key={l} type="button" className={lang === l ? "on" : ""} onClick={() => setL(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const Onboarding = () => {
  const [lang] = useLang();
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [avatar, setAvatar] = React.useState(null);
  const [field, setField] = React.useState("");
  const [year, setYear] = React.useState("Y2");
  const [subjects, setSubjects] = React.useState([]);
  const [subjectInput, setSubjectInput] = React.useState("");
  const [worksJob, setWorksJob] = React.useState(false);
  const [mode, setMode] = React.useState("fresh");
  const fileRef = React.useRef(null);

  const addSubjectChip = (raw) => {
    const trimmed = (raw || subjectInput).trim();
    if (!trimmed) return;
    if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) { setSubjectInput(""); return; }
    setSubjects((prev) => [...prev, { id: "sub" + Date.now() + prev.length, name: trimmed, color: SUBJECT_PALETTE[prev.length % SUBJECT_PALETTE.length] }]);
    setSubjectInput("");
  };
  const removeSubjectChip = (id) => setSubjects((prev) => prev.filter((s) => s.id !== id));

  const onAvatarPick = () => fileRef.current && fileRef.current.click();
  const onAvatarFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try { setAvatar(await compressAvatar(f)); } catch {}
  };

  const submit = () => {
    actions.initProfile({ name, field, year, subjects, worksJob, avatar, mode });
    sfx.levelUp();
    pushToast({ kind: "levelup", text: t("onb.welcomeToast", { name: name || (lang === "en" ? "there" : "à toi") }), duration: 4500 });
  };

  const stepLabel = (n) => `${t("onb.step")} ${n} / ${STEP_COUNT}`;

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
            <div className="line"><b>{lang === "en" ? "MIND" : "ESPRIT"}</b> <span style={{ color: "var(--cyan)" }}>{lang === "en" ? "AWAITING AWAKENING" : "EN ATTENTE D'ÉVEIL"}</span></div>
            <div className="line"><b>NODE</b> CORE-0 · {(Math.random()*999999|0).toString(16).toUpperCase().padStart(6,"0")}</div>
            <div className="line"><b>BUILD</b> {new Date().toISOString().slice(0,10)}</div>
          </div>
        </div>

        {/* Right: form */}
        <div className="onb-form">
          <div className="onb-brand">
            <Logo size={40}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, letterSpacing: "0.04em" }}>{t("onb.title")}</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.28em", color: "var(--fg-3)", marginTop: 2 }}>{t("onb.subtitle").toUpperCase()}</div>
            </div>
            <LangSwitch/>
          </div>

          <div className="onb-steps">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <span key={i} className={step >= i ? "on" : ""}>{String(i + 1).padStart(2, "0")}</span>
            ))}
          </div>

          {step === 0 && (
            <div className="onb-step">
              <h2>{t("onb.welcome.h")}</h2>
              <p>{t("onb.welcome.p")}</p>

              <div className="row gap-2" style={{ alignItems: "center", marginBottom: 4 }}>
                <Avatar src={avatar} name={name} size={56} onClick={onAvatarPick}/>
                <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarFile} style={{ display: "none" }}/>
                <div>
                  <label className="field-label" style={{ marginBottom: 6, display: "block" }}>{t("onb.avatar.label")}</label>
                  <button className="btn" type="button" onClick={onAvatarPick}>
                    {avatar ? t("onb.avatar.change") : t("onb.avatar.add")}
                  </button>
                </div>
              </div>

              <label className="field-label" style={{ marginTop: 14 }}>{t("onb.name.label")}</label>
              <input
                className="input lg" autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setStep(1)}
                placeholder={lang === "en" ? "E.g. Alex" : "Ex. Lucas"}
              />
              <div className="onb-actions">
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>{stepLabel(1)}</span>
                <button className="btn primary" disabled={!name.trim()} onClick={() => setStep(1)}>
                  {t("common.continue")}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onb-step">
              <h2>{t("onb.field.h")}</h2>
              <p>{t("onb.field.p")}</p>
              <label className="field-label">{t("onb.field.label")}</label>
              <input
                className="input lg" autoFocus
                value={field}
                onChange={(e) => setField(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setStep(2)}
                placeholder={lang === "en" ? "E.g. Electronics, Law, Medicine, Self-taught…" : "Ex. GEII, Droit, Médecine, Autoformation…"}
              />
              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(0)}>{t("common.back")}</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>{stepLabel(2)}</span>
                <button className="btn primary" onClick={() => setStep(2)}>{t("common.continue")}</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onb-step">
              <h2>{t("onb.year.h")}</h2>
              <p>{t("onb.year.p")}</p>
              <div className="year-grid">
                {[
                  { id: "Y1", lbl: t("onb.year1"), sub: t("onb.year1sub") },
                  { id: "Y2", lbl: t("onb.year2"), sub: t("onb.year2sub") },
                  { id: "Y3", lbl: t("onb.year3"), sub: t("onb.year3sub") },
                  { id: "OTHER", lbl: t("onb.yearOther"), sub: t("onb.yearOtherSub") },
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
                <button className="btn ghost" onClick={() => setStep(1)}>{t("common.back")}</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>{stepLabel(3)}</span>
                <button className="btn primary" onClick={() => setStep(3)}>{t("common.continue")}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onb-step">
              <h2>{t("onb.subjects.h")}</h2>
              <p>{t("onb.subjects.p")}</p>
              <label className="field-label">{t("onb.subjects.addLabel")}</label>
              <div className="row gap-2">
                <input
                  className="input" autoFocus
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubjectChip()}
                  placeholder={t("onb.subjects.placeholder")}
                  style={{ flex: 1 }}
                />
                <button className="btn" disabled={!subjectInput.trim()} onClick={() => addSubjectChip()}>{t("common.add")}</button>
              </div>

              {subjects.length > 0 && (
                <div className="row gap-2" style={{ flexWrap: "wrap", marginTop: 14 }}>
                  {subjects.map((s) => (
                    <span key={s.id} className="tag" style={{ color: s.color, borderColor: s.color + "55", background: s.color + "12", cursor: "pointer" }}
                      onClick={() => removeSubjectChip(s.id)} title={lang === "en" ? "Remove" : "Retirer"}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }}/>
                      {s.name} ✕
                    </span>
                  ))}
                </div>
              )}

              <div className="muted" style={{ fontSize: 11, marginTop: 14 }}>{t("onb.subjects.hint")}</div>

              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(2)}>{t("common.back")}</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>{stepLabel(4)}</span>
                <button className="btn primary" onClick={() => setStep(4)}>{t("common.continue")}</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="onb-step">
              <h2>{t("onb.work.h")}</h2>
              <p>{t("onb.work.p")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className={"mode-card " + (worksJob ? "active" : "")} onClick={() => setWorksJob(true)}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t("onb.work.yes")}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{t("onb.work.yesSub")}</div>
                  </div>
                </button>
                <button className={"mode-card " + (!worksJob ? "active" : "")} onClick={() => setWorksJob(false)}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t("onb.work.no")}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{t("onb.work.noSub")}</div>
                  </div>
                </button>
              </div>
              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(3)}>{t("common.back")}</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>{stepLabel(5)}</span>
                <button className="btn primary" onClick={() => setStep(5)}>{t("common.continue")}</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="onb-step">
              <h2>{t("onb.mode.h")}</h2>
              <p>{t("onb.mode.p")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className={"mode-card " + (mode === "fresh" ? "active" : "")} onClick={() => setMode("fresh")}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{t("onb.mode.fresh")}</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{t("onb.mode.freshSub")}</div>
                    </div>
                    <span className="tag blue">{t("onb.mode.recommended")}</span>
                  </div>
                </button>
                <button className={"mode-card " + (mode === "demo" ? "active" : "")} onClick={() => setMode("demo")}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{t("onb.mode.demo")}</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{t("onb.mode.demoSub")}</div>
                    </div>
                    <span className="tag dim">{t("onb.mode.demoTag")}</span>
                  </div>
                </button>
              </div>
              <div className="onb-actions">
                <button className="btn ghost" onClick={() => setStep(4)}>{t("common.back")}</button>
                <span className="muted mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>{stepLabel(6)}</span>
                <button className="btn primary" onClick={submit}>
                  <Icon name="lightning" size={12}/>
                  {t("onb.init")}
                </button>
              </div>
            </div>
          )}

          <div className="onb-footer mono">
            <span>{t("onb.footer1")}</span>
            <span>{t("onb.footer2")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Onboarding = Onboarding;
