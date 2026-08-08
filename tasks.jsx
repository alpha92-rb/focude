/* ==========================================================
   tasks.jsx — TaskRow + TasksPage (daily + backlog).
   ========================================================== */

const TaskRow = ({ task, subjects, compact, onToggle, onDelete, draggable }) => {
  const subj = subjects.find((s) => s.id === task.subject);
  const isReview = !!task.review;
  const isExam = !!task.exam;
  const classes = ["task"];
  if (task.status === "done") classes.push("done");
  if (isReview) classes.push("review-task");
  if (isExam) classes.push("exam-task");

  const handleToggle = () => {
    sfx.check();
    if (task.virtual && task.review) { actions.completeReviewQuest(task.chapterId); return; }
    if (task.virtual && task.kind === "contact") { actions.toggleContact(task.refId); return; }
    if (task.virtual && task.kind === "delivery") { actions.toggleDelivery(task.refId); return; }
    (onToggle || actions.toggleTask)(task.id);
  };

  const isPro = task.domain === "pro" || task.pro;
  const classes2 = classes.concat(isPro ? ["pro-task"] : []);

  return (
    <div className={classes2.join(" ")}>
      <div
        className={"checkbox" + (task.status === "done" ? " checked" : "")}
        onClick={handleToggle}
      >
        {task.status === "done" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      <div>
        <div className="title">{task.title}</div>
        {!compact && task.description && <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{task.description}</div>}
        <div className="meta">
          {isReview && <span className="tag violet">RÉVISION</span>}
          {isPro && <span className="tag amber">ENTREPRISE</span>}
          {task.virtual && task.overdueDays > 0 && <span className="tag red">+{task.overdueDays}J RETARD</span>}
          {isExam && <span className="tag red">EXAMEN</span>}
          {subj && (
            <span className="matter" style={{ color: subj.color }}>{subj.name}</span>
          )}
          {subj && <span className="dot"/>}
          <span className={"prio " + task.prio}>{task.prio === "high" ? "Priorité haute" : task.prio === "med" ? "Moyenne" : "Basse"}</span>
          <span className="dot"/>
          <span className="time">{task.duration} min</span>
        </div>
      </div>
      <div className="right">
        {!compact && !task.virtual && (
          <button className="btn icon sm ghost" aria-label="Supprimer la tâche" onClick={() => (onDelete || actions.deleteTask)(task.id)}>
            <Icon name="trash" size={13}/>
          </button>
        )}
        {task.virtual && (
          <span className="mono" style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.14em", alignSelf: "center" }}>AUTO</span>
        )}
      </div>
    </div>
  );
};

const TasksPage = () => {
  const s = useStore();
  const [tab, setTab] = React.useState("daily");
  const [query, setQuery] = React.useState("");
  const [filterSubj, setFilterSubj] = React.useState("all");
  const [domain, setDomain] = React.useState("all");
  const [showAdd, setShowAdd] = React.useState(false);

  const allTasks = s.tasks;
  const quests = reviewQuests(s);   // auto Ebbinghaus review quests
  const pquests = proQuests(s);     // auto pro quests (alternance)
  const dailyTasks = [...quests, ...pquests, ...allTasks.filter((t) => t.category === "daily")];
  const backlogTasks = allTasks.filter((t) => t.category === "backlog");
  const doneTasks = allTasks.filter((t) => t.status === "done");

  const baseList = tab === "daily" ? dailyTasks : tab === "backlog" ? backlogTasks : doneTasks;

  const filtered = baseList.filter((t) => {
    if (domain !== "all") {
      const isPro = t.domain === "pro" || t.pro;
      if (domain === "pro" && !isPro) return false;
      if (domain === "study" && isPro) return false;
    }
    if (filterSubj !== "all" && t.subject !== filterSubj) return false;
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const groups = {
    todo: filtered.filter((t) => t.status !== "done"),
    done: filtered.filter((t) => t.status === "done"),
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tâches</h1>
          <div className="sub">FOCUS QUOTIDIEN • BACKLOG • PROJETS</div>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => setShowAdd(true)}><Icon name="plus"/>Nouvelle tâche</button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 16, gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="tabs">
          <button className={tab==="daily" ? "active" : ""} onClick={() => setTab("daily")}>Quotidien <span className="count">{dailyTasks.filter(x=>x.status!=="done").length}</span></button>
          <button className={tab==="backlog" ? "active" : ""} onClick={() => setTab("backlog")}>Backlog <span className="count">{backlogTasks.filter(x=>x.status!=="done").length}</span></button>
          <button className={tab==="done" ? "active" : ""} onClick={() => setTab("done")}>Terminées <span className="count">{doneTasks.length}</span></button>
        </div>
        <div className="row gap-2">
          <div className="tabs">
            <button className={domain==="all"?"active":""} onClick={() => setDomain("all")}>Tout</button>
            <button className={domain==="study"?"active":""} onClick={() => setDomain("study")}>Études</button>
            <button className={domain==="pro"?"active":""} onClick={() => setDomain("pro")}>Entreprise</button>
          </div>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 30, width: 220 }}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--fg-3)", pointerEvents: "none" }}>
              <Icon name="search" size={13}/>
            </span>
          </div>
          <select className="select" value={filterSubj} onChange={(e) => setFilterSubj(e.target.value)} style={{ width: 200 }}>
            <option value="all">Toutes les matières</option>
            {s.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <Card title="À FAIRE" meta={`${groups.todo.length} tâches`}>
        <div className="task-list" style={{ marginInline: -16 }}>
          {groups.todo.map((t) => <TaskRow key={t.id} task={t} subjects={s.subjects}/>)}
          {groups.todo.length === 0 && <div className="muted" style={{ padding: 16 }}>Aucune tâche en attente dans ce filtre.</div>}
        </div>
      </Card>

      {tab !== "done" && groups.done.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Card title="TERMINÉES" meta={`${groups.done.length}`}>
            <div className="task-list" style={{ marginInline: -16 }}>
              {groups.done.map((t) => <TaskRow key={t.id} task={t} subjects={s.subjects}/>)}
            </div>
          </Card>
        </div>
      )}

      {showAdd && <AddTaskModal subjects={s.subjects} onClose={() => setShowAdd(false)}/>}
    </div>
  );
};

const AddTaskModal = ({ subjects, onClose }) => {
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [category, setCategory] = React.useState("daily");
  const [prio, setPrio] = React.useState("med");
  const [subject, setSubject] = React.useState(subjects[0]?.id);
  const [duration, setDuration] = React.useState(30);

  const submit = () => {
    if (!title.trim()) return;
    actions.addTask({ title, description: desc, category, prio, subject, duration: parseInt(duration) || 30 });
    pushToast({ kind: "default", text: `Tâche ajoutée — +25 XP à la complétion` });
    onClose();
  };

  return (
    <Modal title="Nouvelle tâche" onClose={onClose} actions={
      <>
        <button className="btn ghost" onClick={onClose}>Annuler</button>
        <button className="btn primary" onClick={submit}>Créer</button>
      </>
    }>
      <div>
        <label className="field-label">Titre</label>
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Relire chapitre 3 d'automatique"/>
      </div>
      <div>
        <label className="field-label">Description</label>
        <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Notes, sous-tâches, références…"/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="field-label">Catégorie</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="daily">Quotidien</option>
            <option value="backlog">Backlog</option>
          </select>
        </div>
        <div>
          <label className="field-label">Priorité</label>
          <select className="select" value={prio} onChange={(e) => setPrio(e.target.value)}>
            <option value="low">Basse</option>
            <option value="med">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </div>
        <div>
          <label className="field-label">Matière</label>
          <select className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Durée estimée (min)</label>
          <input className="input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)}/>
        </div>
      </div>
    </Modal>
  );
};

Object.assign(window, { TaskRow, TasksPage, AddTaskModal });
