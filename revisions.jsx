/* ==========================================================
   revisions.jsx — Spaced repetition page (FSRS-lite).
   ========================================================== */

const Revisions = () => {
  const s = useStore();
  const [showAdd, setShowAdd] = React.useState(false);
  const [filter, setFilter] = React.useState("all");
  const [reviewing, setReviewing] = React.useState(null);

  const subjects = s.subjects;
  const chapters = s.chapters;

  const dueNow = chapters.filter((c) => c.nextReview <= now() + dayMs);
  const dueSoon = chapters.filter((c) => c.nextReview > now() + dayMs && c.nextReview <= now() + 7 * dayMs);
  const stable = chapters.filter((c) => c.nextReview > now() + 7 * dayMs);

  const showList = filter === "due" ? dueNow : filter === "soon" ? dueSoon : filter === "stable" ? stable : chapters;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Répétition espacée</h1>
          <div className="sub">ARBRE DE CONNAISSANCES • ALGORITHME FSRS-LITE</div>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => setShowAdd(true)}><Icon name="plus"/>Nouveau chapitre</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <KpiMini title="Chapitres" value={chapters.length} sub="actifs" tone="cyan"/>
        <KpiMini title="À réviser" value={dueNow.length} sub="aujourd'hui" tone="red" highlight={dueNow.length > 0}/>
        <KpiMini title="Cette semaine" value={dueSoon.length} sub="à venir" tone="amber"/>
        <KpiMini title="Mémoire moyenne" value={`${Math.round(chapters.reduce((a, c) => a + c.retention, 0) / Math.max(1,chapters.length) * 100)}%`} sub="rétention estimée" tone="violet"/>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Card title="Courbe de l'oubli — Ebbinghaus" meta="CHAQUE RÉVISION RALENTIT L'OUBLI">
          <EbbinghausCurve reps={6}/>
          <div className="ebb-legend mono">
            <span><i className="sw decay"/>Rétention sans révision</span>
            <span><i className="sw active"/>Avec révisions espacées</span>
            <span><i className="sw dot"/>Rappel planifié → quête automatique</span>
          </div>
        </Card>
      </div>

      <div className="row" style={{ marginBottom: 16, justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div className="tabs">
          <button className={filter==="all"?"active":""} onClick={() => setFilter("all")}>Tous <span className="count">{chapters.length}</span></button>
          <button className={filter==="due"?"active":""} onClick={() => setFilter("due")}>Urgents <span className="count">{dueNow.length}</span></button>
          <button className={filter==="soon"?"active":""} onClick={() => setFilter("soon")}>7 jours <span className="count">{dueSoon.length}</span></button>
          <button className={filter==="stable"?"active":""} onClick={() => setFilter("stable")}>Stables <span className="count">{stable.length}</span></button>
        </div>
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--fg-2)", letterSpacing: "0.12em" }}>RÉVISIONS / JOUR MAX</span>
            <select className="select" style={{ width: 70, padding: "5px 8px" }}
              value={(s.settings && s.settings.reviewCap) || 8}
              onChange={(e) => actions.setReviewCap(parseInt(e.target.value))}>
              {[3,5,6,8,10,12,15,20].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="muted mono" style={{ fontSize: 11 }}>J0 · J1 · J3 · J7 · J14 · J30 · J90 · J180</div>
        </div>
      </div>

      {deferredReviewCount(s) > 0 && (
        <div className="defer-hint mono" style={{ margin: "0 0 14px" }}>
          {dueReviewChapters(s).length} chapitres sont à réviser, mais seuls les {(s.settings && s.settings.reviewCap) || 8} plus urgents sont placés dans tes quêtes aujourd'hui. Les {deferredReviewCount(s)} autres suivront les prochains jours — tu ne croules jamais sous les révisions.
        </div>
      )}

      <div className="chapter-grid">
        {showList.map((c) => <ChapterCard key={c.id} chapter={c} subjects={subjects} onReview={() => setReviewing(c)}/>)}
      </div>

      {showAdd && <AddChapterModal subjects={subjects} onClose={() => setShowAdd(false)}/>}
      {reviewing && <ReviewModal chapter={reviewing} subjects={subjects} onClose={() => setReviewing(null)}/>}
    </div>
  );
};

const KpiMini = ({ title, value, sub, tone = "cyan", highlight }) => {
  const colors = {
    cyan: "var(--cyan)", red: "oklch(0.85 0.15 25)",
    amber: "oklch(0.88 0.14 75)", violet: "oklch(0.78 0.16 290)",
  };
  return (
    <div className="card" style={highlight ? { borderColor: "oklch(0.68 0.22 25 / 0.4)", boxShadow: "0 0 24px oklch(0.68 0.22 25 / 0.15)" } : {}}>
      <div style={{ padding: 14 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: "var(--fg-3)", textTransform: "uppercase" }}>{title}</div>
        <div className="mono tnum" style={{ fontSize: 28, fontWeight: 300, color: colors[tone], marginTop: 4 }}>{value}</div>
        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
};

const ChapterCard = ({ chapter: c, subjects, onReview }) => {
  const subj = subjects.find((x) => x.id === c.subject);
  const overdue = c.nextReview < now();
  const days = Math.ceil((c.nextReview - now()) / dayMs);
  const intervalLabels = ["J0", "J0s", "J3", "J7", "J14", "J30", "J90", "J180"];
  const steps = Math.min(8, c.reps + 1);
  const [confirmDel, setConfirmDel] = React.useState(false);

  return (
    <div className="chapter">
      <div className="head">
        <div style={{ flex: 1 }}>
          <div className="name">{c.name}</div>
          <div className="subj" style={{ color: subj?.color }}>{subj?.name}</div>
        </div>
        <div className="progress-ring">
          <svg width="42" height="42">
            <circle cx="21" cy="21" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
            <circle cx="21" cy="21" r="18" fill="none"
              stroke={subj?.color || "var(--accent)"}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 18 * c.retention} ${2 * Math.PI * 18}`}
              transform="rotate(-90 21 21)"
            />
          </svg>
          <div className="pct">{Math.round(c.retention * 100)}%</div>
        </div>
      </div>

      <div className="timeline">
        {Array.from({ length: 8 }).map((_, i) => {
          let cls = "";
          if (i < c.reps) cls = "done";
          else if (i === c.reps) cls = overdue ? "overdue" : "current";
          return <i key={i} className={cls} title={intervalLabels[i]}/>;
        })}
      </div>

      <div className="footer">
        <div className="muted">
          <span style={{ color: "var(--fg-1)" }}>{c.reps}</span> révisions • diff. {c.difficulty.toFixed(1)}
        </div>
        <div className="row gap-2">
          {overdue ? (
            <span className="tag red">+{Math.abs(days)}j retard</span>
          ) : (
            <span className="mono next">J–{days}</span>
          )}
          <button className="btn sm icon ghost" aria-label="Supprimer le chapitre" onClick={() => setConfirmDel(true)}><Icon name="trash" size={12}/></button>
          <button className="btn sm primary" onClick={onReview}>Réviser</button>
        </div>
      </div>
      {confirmDel && (
        <ConfirmModal
          title="Supprimer ce chapitre"
          message={`« ${c.name} » et tout son historique de révision seront définitivement supprimés.`}
          confirmLabel="Supprimer"
          onConfirm={() => actions.deleteChapter(c.id)}
          onClose={() => setConfirmDel(false)}
        />
      )}
    </div>
  );
};

const AddChapterModal = ({ subjects, onClose }) => {
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState(subjects[0]?.id);
  const [difficulty, setDifficulty] = React.useState(5);

  const submit = () => {
    if (!name.trim()) return;
    actions.addChapter({ name, subject, difficulty: parseInt(difficulty) });
    pushToast({ kind: "default", text: `Chapitre créé. Première révision : ce soir (J0).` });
    onClose();
  };

  return (
    <Modal title="Nouveau chapitre" onClose={onClose} actions={
      <>
        <button className="btn ghost" onClick={onClose}>Annuler</button>
        <button className="btn primary" onClick={submit}>Créer</button>
      </>
    }>
      <div>
        <label className="field-label">Intitulé du chapitre</label>
        <input
          className="input" autoFocus
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Électronique analogique — filtres actifs"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="field-label">Matière</label>
          <select className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Difficulté perçue (1–10)</label>
          <input className="input" type="number" min="1" max="10" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}/>
        </div>
      </div>
      <div style={{ padding: 12, background: "rgba(124,224,255,0.05)", border: "1px solid oklch(0.85 0.15 200 / 0.18)", borderRadius: 8, fontSize: 11.5, color: "var(--fg-1)" }}>
        <div className="mono" style={{ fontSize: 9, color: "var(--cyan)", letterSpacing: "0.2em", marginBottom: 8 }}>SCHÉMA DE RÉVISION GÉNÉRÉ (EBBINGHAUS)</div>
        <EbbinghausCurve reps={6} compact/>
        <div style={{ marginTop: 8 }}>Apprentissage → Soir même → J+3 → J+7 → J+14 → J+30 → J+90 → J+180 → adaptatif. Chaque rappel devient une <b style={{ color: "var(--fg-0)" }}>quête automatique</b> le jour prévu.</div>
      </div>
    </Modal>
  );
};

/* ---------- Ebbinghaus forgetting curve visualization ----------
   Sawtooth: retention decays exponentially, each scheduled review
   resets it to ~100% and flattens subsequent decay (stability ↑).
*/
const EbbinghausCurve = ({ reps = 6, compact = false }) => {
  const W = 640, H = compact ? 120 : 200;
  const pad = { l: 34, r: 14, t: 14, b: compact ? 22 : 30 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

  // Ebbinghaus J-intervals (days). Total horizontal span uses a sqrt scale so
  // early reviews are readable and later ones compress.
  const days = [0, 1, 3, 7, 14, 30, 90, 180].slice(0, reps + 1);
  const maxDay = days[days.length - 1];
  const sx = (d) => pad.l + (Math.sqrt(d) / Math.sqrt(maxDay)) * iw;
  const sy = (r) => pad.t + ih - r * ih; // r in 0..1

  // build the "with reviews" sawtooth + the "no review" single decay
  const stabilities = [0.6, 1.4, 3, 6, 13, 30, 70]; // memory strength after each review
  let withPath = "", dots = [];
  for (let i = 0; i < days.length - 1; i++) {
    const d0 = days[i], d1 = days[i + 1];
    const S = stabilities[Math.min(i, stabilities.length - 1)];
    const seg = [];
    const steps = 16;
    for (let k = 0; k <= steps; k++) {
      const d = d0 + (d1 - d0) * (k / steps);
      const r = Math.exp(-(d - d0) / S);
      seg.push(`${k === 0 && i === 0 ? "M" : "L"}${sx(d).toFixed(1)},${sy(Math.max(0.02, r)).toFixed(1)}`);
    }
    withPath += seg.join(" ") + " ";
    // jump back to 100% at the review point (vertical reset)
    withPath += `L${sx(d1).toFixed(1)},${sy(1).toFixed(1)} `;
    dots.push({ x: sx(d1), y: sy(1), day: d1 });
  }
  dots.unshift({ x: sx(0), y: sy(1), day: 0 });

  // "no review" curve — keeps decaying from day 0 with weak stability
  let decayPath = "";
  for (let k = 0; k <= 60; k++) {
    const d = (k / 60) * maxDay;
    const r = Math.exp(-d / 1.2);
    decayPath += `${k === 0 ? "M" : "L"}${sx(d).toFixed(1)},${sy(Math.max(0.02, r)).toFixed(1)} `;
  }

  const gridR = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ebbFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.18 290 / 0.35)"/>
          <stop offset="100%" stopColor="oklch(0.72 0.18 290 / 0)"/>
        </linearGradient>
      </defs>
      {gridR.map((r, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(r)} y2={sy(r)} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4"/>
          <text x={pad.l - 6} y={sy(r) + 3} textAnchor="end" fontSize="8" fill="var(--fg-3)" fontFamily="IBM Plex Mono">{Math.round(r*100)}%</text>
        </g>
      ))}
      {/* no-review decay */}
      <path d={decayPath} fill="none" stroke="oklch(0.68 0.22 25 / 0.7)" strokeWidth="1.4" strokeDasharray="4 3"/>
      {/* with-reviews sawtooth */}
      <path d={withPath + `L${sx(maxDay).toFixed(1)},${sy(1).toFixed(1)} L${sx(maxDay).toFixed(1)},${sy(0).toFixed(1)} L${pad.l},${sy(0).toFixed(1)} Z`} fill="url(#ebbFill)" opacity="0.5"/>
      <path d={withPath} fill="none" stroke="oklch(0.78 0.16 290)" strokeWidth="2" strokeLinejoin="round"/>
      {/* review dots + day labels */}
      {dots.map((p, i) => (
        <g key={i}>
          <line x1={p.x} x2={p.x} y1={p.y} y2={pad.t + ih} stroke="oklch(0.78 0.16 290 / 0.25)" strokeWidth="1"/>
          <circle cx={p.x} cy={p.y} r="3.5" fill="oklch(0.85 0.15 200)" stroke="#0a0f1e" strokeWidth="1.5"/>
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize="8.5" fill="var(--fg-2)" fontFamily="IBM Plex Mono">J{p.day}</text>
        </g>
      ))}
    </svg>
  );
};

const ReviewModal = ({ chapter, subjects, onClose }) => {
  const subj = subjects.find((s) => s.id === chapter.subject);
  const [phase, setPhase] = React.useState("question"); // question | grade

  const handleGrade = (g) => {
    actions.reviewChapter(chapter.id, g);
    const labels = { 1: "Oublié", 2: "Difficile", 3: "Correct", 4: "Facile" };
    pushToast({ kind: "xp", text: `${labels[g]} — +${g>=3?50:30} XP. Prochaine révision recalculée.` });
    onClose();
  };

  return (
    <Modal title="Session de révision" onClose={onClose}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: subj?.color }}>{subj?.name.toUpperCase()}</div>
          <div style={{ fontSize: 17, marginTop: 4 }}>{chapter.name}</div>
        </div>
        <div className="mono muted" style={{ fontSize: 11 }}>RÉV. #{chapter.reps + 1}</div>
      </div>

      {phase === "question" ? (
        <>
          <div style={{ padding: 24, background: "rgba(0,0,0,0.3)", border: "1px solid var(--line)", borderRadius: 10, textAlign: "center", marginTop: 8 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--cyan)", marginBottom: 12 }}>POSEZ-VOUS LA QUESTION</div>
            <div style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6 }}>
              Pouvez-vous reformuler les concepts clés de « <span style={{ color: "var(--fg-0)" }}>{chapter.name}</span> » ?
              <br/>Schéma, formule, application typique.
            </div>
          </div>
          <button className="btn primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setPhase("grade")}>
            Montrer la réponse
          </button>
        </>
      ) : (
        <>
          <div className="muted" style={{ textAlign: "center", fontSize: 12 }}>Notez votre rappel :</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <button className="btn" onClick={() => handleGrade(1)} style={{ flexDirection: "column", height: 70, borderColor: "oklch(0.68 0.22 25 / 0.4)" }}>
              <div style={{ fontSize: 16, color: "oklch(0.85 0.15 25)" }}>1</div>
              <div style={{ fontSize: 10, color: "var(--fg-2)" }}>Oublié</div>
            </button>
            <button className="btn" onClick={() => handleGrade(2)} style={{ flexDirection: "column", height: 70 }}>
              <div style={{ fontSize: 16, color: "oklch(0.88 0.14 75)" }}>2</div>
              <div style={{ fontSize: 10, color: "var(--fg-2)" }}>Difficile</div>
            </button>
            <button className="btn" onClick={() => handleGrade(3)} style={{ flexDirection: "column", height: 70 }}>
              <div style={{ fontSize: 16, color: "var(--cyan)" }}>3</div>
              <div style={{ fontSize: 10, color: "var(--fg-2)" }}>Correct</div>
            </button>
            <button className="btn" onClick={() => handleGrade(4)} style={{ flexDirection: "column", height: 70 }}>
              <div style={{ fontSize: 16, color: "oklch(0.85 0.16 155)" }}>4</div>
              <div style={{ fontSize: 10, color: "var(--fg-2)" }}>Facile</div>
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

Object.assign(window, { Revisions, EbbinghausCurve, KpiMini });
