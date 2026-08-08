/* ==========================================================
   exams.jsx — DS / Examens module.
   ========================================================== */

const Exams = () => {
  const s = useStore();
  const [showAdd, setShowAdd] = React.useState(false);

  const exams = urgentExams(s);
  const urgent = exams.filter((e) => e.daysLeft <= 7);
  const upcoming = exams.filter((e) => e.daysLeft > 7);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Examens & DS</h1>
          <div className="sub">ANTICIPATION • PLANIFICATION • ALERTES PROGRESSIVES</div>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => setShowAdd(true)}><Icon name="plus"/>Programmer un DS</button>
        </div>
      </div>

      {urgent.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "oklch(0.85 0.15 25)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="warn" size={13}/>
            ALERTE — ÉCHÉANCE PROCHE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {urgent.map((e) => <ExamCard key={e.id} exam={e} subjects={s.subjects} urgent/>)}
          </div>
        </div>
      )}

      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--fg-3)", marginBottom: 10 }}>
        À VENIR
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {upcoming.map((e) => <ExamCard key={e.id} exam={e} subjects={s.subjects}/>)}
        {upcoming.length === 0 && urgent.length === 0 && (
          <div className="card"><div className="card-body muted center" style={{ padding: 40 }}>Aucun examen programmé pour l'instant.</div></div>
        )}
      </div>

      {showAdd && <AddExamModal subjects={s.subjects} onClose={() => setShowAdd(false)}/>}
    </div>
  );
};

const ExamCard = ({ exam, subjects, urgent }) => {
  const subj = subjects.find((s) => s.id === exam.subject);
  const examDate = new Date(exam.date);
  const dateStr = examDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  let phase = "lointain";
  if (exam.daysLeft <= 3) phase = "critique";
  else if (exam.daysLeft <= 7) phase = "urgent";
  else if (exam.daysLeft <= 14) phase = "préparation";

  return (
    <div className={"exam-card" + (urgent || phase === "critique" ? " urgent" : "")}>
      <div className="exam-countdown">
        <div className="num tnum">{exam.daysLeft}</div>
        <div className="unit">{exam.daysLeft === 1 ? "jour" : "jours"}</div>
      </div>
      <div className="exam-info">
        <div className="name">{exam.name}</div>
        <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 11, color: subj?.color }} className="mono">{subj?.name?.toUpperCase()}</span>
          <span style={{ width: 1, height: 12, background: "var(--line)" }}/>
          <span className="muted" style={{ fontSize: 11 }}>{dateStr}</span>
          <span style={{ width: 1, height: 12, background: "var(--line)" }}/>
          <span className="muted" style={{ fontSize: 11 }}>Coef. <b style={{ color: "var(--fg-0)" }}>{exam.coef}</b></span>
          <span style={{ width: 1, height: 12, background: "var(--line)" }}/>
          <span className="row gap-2 muted" style={{ fontSize: 11 }}>
            Difficulté
            <span className="difficulty">
              {Array.from({ length: 5 }).map((_, i) => (
                <i key={i} className={i < exam.difficulty ? "on" : ""}/>
              ))}
            </span>
          </span>
        </div>

        {phase !== "lointain" && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {phase === "critique" && <span className="tag red">URGENT — RÉVISION INTENSIVE</span>}
            {phase === "urgent" && <span className="tag amber">FENÊTRE 7 JOURS</span>}
            {phase === "préparation" && <span className="tag blue">PHASE PRÉPARATION</span>}
            <span className="tag dim">PLAN ANCRÉ DANS LES TÂCHES</span>
          </div>
        )}
      </div>
      <div className="exam-actions">
        <button className="btn sm" onClick={() => actions.generateExamPrepTasks(exam.id)}>Plan de révision</button>
        <button className="btn sm ghost danger" aria-label="Supprimer l'examen" onClick={() => actions.deleteExam(exam.id)}><Icon name="trash" size={12}/></button>
      </div>
    </div>
  );
};

const AddExamModal = ({ subjects, onClose }) => {
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState(subjects[0]?.id);
  const [date, setDate] = React.useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [coef, setCoef] = React.useState(2);
  const [difficulty, setDifficulty] = React.useState(3);

  const submit = () => {
    if (!name.trim()) return;
    actions.addExam({ name, subject, date: new Date(date).getTime(), coef: parseInt(coef), difficulty: parseInt(difficulty) });
    pushToast({ kind: "default", text: `Examen ajouté. Le système vous alertera à J–7 et J–3.` });
    onClose();
  };

  return (
    <Modal title="Programmer un DS / Examen" onClose={onClose} actions={
      <>
        <button className="btn ghost" onClick={onClose}>Annuler</button>
        <button className="btn primary" onClick={submit}>Programmer</button>
      </>
    }>
      <div>
        <label className="field-label">Nom de l'évaluation</label>
        <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. DS d'électronique numérique"/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="field-label">Matière</label>
          <select className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Coefficient</label>
          <input className="input" type="number" min="1" max="10" value={coef} onChange={(e) => setCoef(e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Difficulté estimée (1–5)</label>
          <input className="input" type="number" min="1" max="5" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}/>
        </div>
      </div>
    </Modal>
  );
};

window.Exams = Exams;
