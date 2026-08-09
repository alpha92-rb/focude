/* ==========================================================
   store.jsx — global state + localStorage persistence
   Lightweight zustand-style store using React hooks.
   ========================================================== */

const STORAGE_KEY = "geii_lab_v1";

// Palette cyclique pour les matières créées par l'utilisateur (onboarding et
// Réglages) — une "matière" n'a rien d'académique par nature, ce sont juste
// des étiquettes colorées que l'utilisateur définit lui-même.
const SUBJECT_PALETTE = ["#5aa9ff", "#7ce0ff", "#b18cff", "#ffb86b", "#7cf0c2", "#ff8ec7", "#ff8c69", "#9be15d"];
function nextSubjectColor(existingCount) {
  return SUBJECT_PALETTE[existingCount % SUBJECT_PALETTE.length];
}

/* ---------- helpers ---------- */
const now = () => Date.now();
const dayMs = 24 * 60 * 60 * 1000;
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
};
const todayKey = () => dayKey(new Date());

/* ---------- Seed data — believable demo state for an engineering student ---------- */
const seedData = () => {
  const t = now();
  const d = (offset) => t + offset * dayMs;

  const subjects = [
    { id: "elec_ana", name: "Électronique analogique", color: "#5aa9ff" },
    { id: "elec_num", name: "Électronique numérique", color: "#7ce0ff" },
    { id: "auto",     name: "Automatique",            color: "#b18cff" },
    { id: "ener",     name: "Énergie & convertisseurs", color: "#ffb86b" },
    { id: "info_ind", name: "Informatique industrielle", color: "#7cf0c2" },
    { id: "math",     name: "Mathématiques",          color: "#ff8ec7" },
  ];

  const chapters = [
    { id: "c1", name: "Filtres actifs — passe-bas & passe-bande", subject: "elec_ana", createdAt: d(-21), reps: 4, stability: 14, difficulty: 5, retention: 0.82, nextReview: d(2), interval: 7, history: [d(-21), d(-20.9), d(-18), d(-14), d(-7)] },
    { id: "c2", name: "Amplificateurs opérationnels — montages",   subject: "elec_ana", createdAt: d(-45), reps: 6, stability: 28, difficulty: 4, retention: 0.91, nextReview: d(12), interval: 30, history: [d(-45), d(-44.9), d(-42), d(-38), d(-31), d(-1), d(-15)] },
    { id: "c3", name: "Bascules D & JK — chronogrammes",            subject: "elec_num", createdAt: d(-9), reps: 3, stability: 7, difficulty: 6, retention: 0.74, nextReview: d(-1), interval: 7, history: [d(-9), d(-8.9), d(-6), d(-2)] },
    { id: "c4", name: "VHDL — processus combinatoires",             subject: "elec_num", createdAt: d(-30), reps: 5, stability: 21, difficulty: 5, retention: 0.86, nextReview: d(6), interval: 14, history: [d(-30), d(-29.9), d(-27), d(-23), d(-16), d(-2)] },
    { id: "c5", name: "Asservissement — boucle fermée, BO/BF",      subject: "auto",     createdAt: d(-14), reps: 3, stability: 9, difficulty: 7, retention: 0.71, nextReview: d(0), interval: 7, history: [d(-14), d(-13.9), d(-11), d(-7)] },
    { id: "c6", name: "Transformée de Laplace — table & pôles",     subject: "math",     createdAt: d(-60), reps: 7, stability: 45, difficulty: 4, retention: 0.93, nextReview: d(25), interval: 45, history: [] },
    { id: "c7", name: "Hacheurs série & parallèle",                  subject: "ener",     createdAt: d(-7), reps: 2, stability: 4, difficulty: 6, retention: 0.65, nextReview: d(0), interval: 3, history: [d(-7), d(-6.9), d(-4)] },
    { id: "c8", name: "MLI — modulation de largeur d'impulsion",     subject: "ener",     createdAt: d(-3), reps: 1, stability: 1, difficulty: 5, retention: 0.55, nextReview: d(0), interval: 1, history: [d(-3), d(-2.9)] },
    { id: "c9", name: "Microcontrôleur STM32 — timers & interruptions", subject: "info_ind", createdAt: d(-18), reps: 4, stability: 14, difficulty: 6, retention: 0.79, nextReview: d(3), interval: 14, history: [d(-18), d(-17.9), d(-15), d(-11), d(-4)] },
    { id: "c10", name: "Diagrammes de Bode — gain & phase",          subject: "auto",     createdAt: d(-2), reps: 0, stability: 0, difficulty: 5, retention: 0.4, nextReview: d(0), interval: 0, history: [d(-2)] },
  ];

  const tasks = [
    // Daily
    { id: "t1", title: "Relire chapitre 3 d'automatique",          category: "daily", subject: "auto",     prio: "med", duration: 30, status: "todo", createdAt: d(-0.4), due: dayKey(new Date()) },
    { id: "t2", title: "Exercices Bode (3, 5, 7) du TD",            category: "daily", subject: "auto",     prio: "high", duration: 60, status: "todo", createdAt: d(-0.3), due: dayKey(new Date()) },
    { id: "t3", title: "Faire les TP4 STM32 — compte-rendu",        category: "backlog", subject: "info_ind", prio: "high", duration: 180, status: "todo", createdAt: d(-2), due: dayKey(new Date(t + 2*dayMs)) },
    { id: "t4", title: "Lecture cours hacheurs (Énergie)",          category: "daily", subject: "ener",     prio: "low", duration: 20, status: "done", createdAt: d(-0.6), completedAt: d(-0.1) },
    { id: "t5", title: "Préparer présentation SAÉ — Slide intro",   category: "backlog", subject: "info_ind", prio: "med", duration: 90, status: "todo", createdAt: d(-1) },
    { id: "t6", title: "Anki — 40 cartes maths",                    category: "daily", subject: "math",     prio: "med", duration: 25, status: "done", createdAt: d(-0.8), completedAt: d(-0.4) },
    { id: "t7", title: "Rapport SAÉ — section méthodologie",        category: "backlog", subject: "info_ind", prio: "high", duration: 120, status: "todo", createdAt: d(-3) },
    // Entreprise (alternance) — domain pro
    { id: "p1", title: "Mettre à jour le tableau de suivi (Excel)", domain: "pro", category: "daily", prio: "med", duration: 30, status: "todo", createdAt: d(-0.3), due: dayKey(new Date()) },
    { id: "p2", title: "Rédiger compte-rendu réunion d'équipe",     domain: "pro", category: "daily", prio: "high", duration: 45, status: "todo", createdAt: d(-0.5), due: dayKey(new Date()) },
    { id: "p3", title: "Classer les bons de livraison du mois",     domain: "pro", category: "backlog", prio: "low", duration: 40, status: "todo", createdAt: d(-2) },
  ];

  const contacts = [
    { id: "ct1", name: "M. Dubois", org: "Service Achats", reason: "Relancer pour le devis fournisseur", due: dayKey(new Date()), prio: "high", status: "todo", createdAt: d(-1) },
    { id: "ct2", name: "Mme Laurent", org: "RH — tutrice", reason: "Valider le planning de la semaine", due: dayKey(new Date(t + 1*dayMs)), prio: "med", status: "todo", createdAt: d(-0.5) },
    { id: "ct3", name: "Atelier maintenance", org: "Production", reason: "Confirmer l'intervention capteur", due: dayKey(new Date(t - 1*dayMs)), prio: "high", status: "todo", createdAt: d(-2) },
    { id: "ct4", name: "M. Petit", org: "Bureau d'études", reason: "Récupérer les schémas électriques", due: dayKey(new Date(t + 3*dayMs)), prio: "low", status: "done", createdAt: d(-3), completedAt: d(-0.4) },
  ];

  const deliveries = [
    { id: "dl1", label: "Commande capteurs PT100 (×12)", supplier: "RS Components", ref: "BC-2041", due: dayKey(new Date()), status: "todo", createdAt: d(-1) },
    { id: "dl2", label: "Cartes STM32 Nucleo (×5)",       supplier: "Mouser",        ref: "BC-2042", due: dayKey(new Date(t + 2*dayMs)), status: "todo", createdAt: d(-0.5) },
    { id: "dl3", label: "Câbles & connecteurs atelier",   supplier: "Legrand",       ref: "BC-2039", due: dayKey(new Date(t - 2*dayMs)), status: "todo", createdAt: d(-4) },
    { id: "dl4", label: "Multimètre de rechange",         supplier: "Conrad",        ref: "BC-2035", due: dayKey(new Date(t - 6*dayMs)), status: "received", createdAt: d(-7) },
  ];

  const exams = [
    { id: "e1", name: "DS Automatique",         subject: "auto",     date: d(2.3), coef: 3, difficulty: 4 },
    { id: "e2", name: "DS Électronique numérique", subject: "elec_num", date: d(6.5), coef: 2, difficulty: 3 },
    { id: "e3", name: "Examen Énergie",         subject: "ener",     date: d(13), coef: 3, difficulty: 5 },
    { id: "e4", name: "Partiel Mathématiques",  subject: "math",     date: d(25), coef: 2, difficulty: 3 },
    { id: "e5", name: "Soutenance SAÉ",         subject: "info_ind", date: d(40), coef: 4, difficulty: 4 },
  ];

  // Pomodoro session history (last 90 days) — generates a realistic pattern
  const sessions = [];
  for (let i = 0; i < 90; i++) {
    // skip some weekend days, vary intensity
    const dayDate = new Date(t - i * dayMs);
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
    const seed = Math.sin(i * 1.31) * 10000;
    const r = seed - Math.floor(seed);
    let count = 0;
    if (i < 7) count = Math.floor(2 + r * 6);
    else if (isWeekend) count = Math.floor(r * 3);
    else count = Math.floor(1 + r * 7);
    for (let j = 0; j < count; j++) {
      sessions.push({ at: t - i*dayMs + j * 25 * 60 * 1000, duration: 25, subject: subjects[(j+i)%subjects.length].id });
    }
  }

  // Streak: 14 days
  const streakDays = [];
  for (let i = 0; i < 14; i++) streakDays.push(dayKey(new Date(t - i * dayMs)));

  return {
    profile: {
      name: "Étudiant",
      level: 12,
      xp: 2840,
      xpForNext: 3500,
      totalXp: 28940,
      streak: 14,
      streakDays,
      rank: "Ingénieur Apprenti",
      createdAt: d(-180),
    },
    subjects,
    chapters,
    tasks,
    contacts,
    deliveries,
    exams,
    sessions,
    pomodoro: {
      mode: "focus",         // focus | short | long
      durations: { focus: 25, short: 5, long: 15 },
      goalToday: 8,
      cycle: 0,             // completed focus sessions in the current cycle (→ long break every 4)
      autoCycle: true,
    },
    timer: { remaining: 25 * 60, running: false },
    settings: { sound: true, reviewCap: 8, notify: false },
    media: [],
    activeMediaId: null,
    playerOpen: false,
    moleculeStage: 3,        // legacy field; growth now derived via growthStage()
  };
};

/* ---------- Empty starter (when user picks "fresh start") ---------- */
const emptyData = () => {
  const base = seedData();
  return {
    ...base,
    // "Démarrage propre" veut dire propre : les matières de la démo n'ont
    // rien à faire là — l'utilisateur définit les siennes à l'onboarding
    // (ou plus tard, dans Réglages).
    subjects: [],
    chapters: [],
    tasks: [],
    contacts: [],
    deliveries: [],
    exams: [],
    sessions: [],
    media: [],
    activeMediaId: null,
    playerOpen: false,
    moleculeStage: 0,
    profile: { ...base.profile, level: 1, xp: 0, xpForNext: 500, totalXp: 0, streak: 0, streakDays: [], rank: "Apprenti", createdAt: now() },
  };
};

/* ---------- Store ---------- */
// Fill in fields added by later versions so an old saved state keeps working.
function migrate(s) {
  const base = seedData();
  if (!s.pomodoro) s.pomodoro = base.pomodoro;
  if (s.pomodoro.cycle == null) s.pomodoro.cycle = 0;
  if (s.pomodoro.autoCycle == null) s.pomodoro.autoCycle = true;
  if (!s.timer) s.timer = { remaining: (s.pomodoro.durations.focus || 25) * 60, running: false };
  s.timer.running = false;   // never resume a timer across reloads
  if (!s.settings) s.settings = base.settings;
  if (s.settings.notify == null) s.settings.notify = false;
  delete s._lastXp;              // transient event: never restore from disk
  if (!Array.isArray(s.media)) s.media = [];
  if (!Array.isArray(s.contacts)) s.contacts = [];
  if (!Array.isArray(s.deliveries)) s.deliveries = [];
  if (!Array.isArray(s.subjects)) s.subjects = [];
  if (s.profile.field == null) s.profile.field = "";
  // Anciens codes d'année (BUT1/2/3), de quand l'app était encore spécifique
  // au BUT GEII — remappés pour que le sélecteur générique Année 1/2/3 les
  // reconnaisse toujours comme sélectionnés.
  const YEAR_REMAP = { BUT1: "Y1", BUT2: "Y2", BUT3: "Y3" };
  if (YEAR_REMAP[s.profile.year]) s.profile.year = YEAR_REMAP[s.profile.year];
  return s;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profile) return migrate(parsed);
    }
  } catch (e) {}
  return null; // no state yet — onboarding will create it
}

function saveState(s) {
  try {
    // _lastXp is a transient UI event, never persist it (it would replay on reload)
    const { _lastXp, ...persist } = s;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
  } catch (e) {}
}

const listeners = new Set();
let state = loadState();

function hasProfile() { return !!state; }

function setState(updater) {
  if (!state) state = seedData();
  const next = typeof updater === "function" ? updater(state) : { ...state, ...updater };
  next.updatedAt = now();          // horodatage utilisé par la synchro cloud
  state = next;
  saveState(state);
  listeners.forEach((l) => l());
}

/* ---------- Accès pour la couche de synchronisation ---------- */
function subscribeStore(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function getSnapshot() {
  if (!state) return null;
  const { _lastXp, ...doc } = state;
  return doc;
}
// Remplace l'état local par un document distant SANS re-horodater
// (sinon l'appareil paraîtrait toujours plus récent que le serveur).
function hydrateStore(doc) {
  if (!doc || !doc.profile) return false;
  state = migrate(doc);
  saveState(state);
  listeners.forEach((l) => l());
  return true;
}

function useStore() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    return () => listeners.delete(force);
  }, []);
  return state;
}

/* ---------- Actions ---------- */
const actions = {
  initProfile({ name, field, year, subjects, mode }) {
    const base = mode === "fresh" ? emptyData() : seedData();
    if (mode === "fresh" && Array.isArray(subjects)) base.subjects = subjects;
    base.profile = {
      ...base.profile,
      name: (name || "").trim() || "Étudiant",
      field: (field || "").trim(),
      year: year || "",
      onboarded: true,
      createdAt: now(),
    };
    base.updatedAt = now();
    state = base;
    saveState(state);
    listeners.forEach((l) => l());
  },

  updateProfile(patch) {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  },

  /* Matières — libres, pas forcément académiques : l'utilisateur les nomme
     comme il veut (une matière d'étude, un sport, un projet perso…). */
  addSubject(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setState((s) => {
      if (s.subjects.some((sub) => sub.name.toLowerCase() === trimmed.toLowerCase())) return s;
      const subj = { id: "sub" + now(), name: trimmed, color: nextSubjectColor(s.subjects.length) };
      return { ...s, subjects: [...s.subjects, subj] };
    });
  },
  deleteSubject(id) {
    // Les tâches/chapitres/examens qui référençaient cette matière gardent
    // leur id orphelin ; SubjectTag l'ignore silencieusement (pas de purge
    // en cascade nécessaire pour un simple tag descriptif).
    setState((s) => ({ ...s, subjects: s.subjects.filter((sub) => sub.id !== id) }));
  },
  renameSubject(id, name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setState((s) => ({ ...s, subjects: s.subjects.map((sub) => sub.id === id ? { ...sub, name: trimmed } : sub) }));
  },

  addXp(amount, reason) {
    setState((s) => {
      let xp = s.profile.xp + amount;
      let level = s.profile.level;
      let xpForNext = s.profile.xpForNext;
      let leveled = false;
      while (xp >= xpForNext) {
        xp -= xpForNext;
        level += 1;
        xpForNext = Math.round(xpForNext * 1.15);
        leveled = true;
      }
      return {
        ...s,
        profile: { ...s.profile, xp, xpForNext, level, totalXp: s.profile.totalXp + amount },
        _lastXp: { amount, reason, at: now(), leveled },
      };
    });
  },

  toggleSound() {
    setState((s) => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }));
  },
  setReviewCap(n) {
    setState((s) => ({ ...s, settings: { ...s.settings, reviewCap: Math.max(3, Math.min(20, n)) } }));
  },

  /* Tasks */
  addTask(t) {
    setState((s) => ({
      ...s,
      tasks: [{ id: "t" + now(), createdAt: now(), status: "todo", category: "daily", prio: "med", duration: 30, ...t }, ...s.tasks],
    }));
  },
  toggleTask(id) {
    setState((s) => {
      const task = s.tasks.find((t) => t.id === id);
      if (!task) return s;
      const done = task.status !== "done";
      return {
        ...s,
        tasks: s.tasks.map((t) => t.id === id ? { ...t, status: done ? "done" : "todo", completedAt: done ? now() : undefined } : t),
      };
    });
    const t = state.tasks.find((x) => x.id === id);
    if (t && t.status === "done") {
      actions.addXp(t.review ? 50 : 25, t.review ? "Révision validée" : "Tâche terminée");
    }
  },
  deleteTask(id) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  /* Entreprise — contacts à relancer */
  addContact(c) {
    setState((s) => ({ ...s, contacts: [{ id: "ct" + now(), createdAt: now(), status: "todo", prio: "med", ...c }, ...(s.contacts || [])] }));
  },
  toggleContact(id) {
    let done = false;
    setState((s) => ({
      ...s,
      contacts: (s.contacts || []).map((c) => {
        if (c.id !== id) return c;
        done = c.status !== "done";
        return { ...c, status: done ? "done" : "todo", completedAt: done ? now() : undefined };
      }),
    }));
    if (done) actions.addXp(15, "Contact relancé");
  },
  deleteContact(id) {
    setState((s) => ({ ...s, contacts: (s.contacts || []).filter((c) => c.id !== id) }));
  },

  /* Entreprise — livraisons / commandes */
  addDelivery(d) {
    setState((s) => ({ ...s, deliveries: [{ id: "dl" + now(), createdAt: now(), status: "todo", ...d }, ...(s.deliveries || [])] }));
  },
  toggleDelivery(id) {
    let done = false;
    setState((s) => ({
      ...s,
      deliveries: (s.deliveries || []).map((d) => {
        if (d.id !== id) return d;
        done = d.status !== "received";
        return { ...d, status: done ? "received" : "todo", completedAt: done ? now() : undefined };
      }),
    }));
    if (done) actions.addXp(15, "Livraison traitée");
  },
  deleteDelivery(id) {
    setState((s) => ({ ...s, deliveries: (s.deliveries || []).filter((d) => d.id !== id) }));
  },

  /* Chapters / spaced repetition — Ebbinghaus forgetting curve + FSRS-lite */
  addChapter(payload) {
    // Ebbinghaus schedule: first review the SAME evening (J0 soir), then J1.
    // nextReview is set to today so the very first revision quest appears now.
    const c = {
      id: "c" + now(),
      createdAt: now(),
      reps: 0,
      stability: 0,
      difficulty: 5,
      retention: 0.4,
      interval: 0,
      nextReview: now(),          // due immediately → becomes a quest today
      history: [now()],
      ...payload,
    };
    setState((s) => ({ ...s, chapters: [c, ...s.chapters] }));
    pushToast({ kind: "default", text: `Chapitre placé sur la courbe d'Ebbinghaus — 1\u02b3\u1d49 révision aujourd'hui.` });
  },
  reviewChapter(id, grade /* 1..4 */) {
    setState((s) => ({
      ...s,
      chapters: s.chapters.map((c) => c.id === id ? fsrsLite(c, grade) : c),
    }));
    actions.addXp(grade >= 3 ? 50 : 30, "Révision");
  },
  // Complete a review straight from a quest checkbox (default grade = "correct").
  completeReviewQuest(chapterId, grade = 3) {
    const c = state.chapters.find((x) => x.id === chapterId);
    if (!c) return;
    actions.reviewChapter(chapterId, grade);
    const next = state.chapters.find((x) => x.id === chapterId);
    const days = next ? Math.max(0, Math.round((next.nextReview - now()) / dayMs)) : 0;
    pushToast({ kind: "xp", text: `Révision validée — prochaine dans ${days} j (courbe de l'oubli).` });
  },
  deleteChapter(id) {
    setState((s) => ({ ...s, chapters: s.chapters.filter((c) => c.id !== id) }));
  },

  /* Exams */
  addExam(payload) {
    setState((s) => ({ ...s, exams: [...s.exams, { id: "e" + now(), ...payload }] }));
  },
  deleteExam(id) {
    setState((s) => ({ ...s, exams: s.exams.filter((e) => e.id !== id) }));
  },
  generateExamPrepTasks(examId) {
    const exam = state.exams.find((e) => e.id === examId);
    if (!exam) return;
    const daysLeft = Math.max(1, Math.ceil((exam.date - now()) / dayMs));
    const count = daysLeft <= 7 ? 3 : 2;
    const titles = [
      `Révision ${exam.name} — relire le cours`,
      `Révision ${exam.name} — exercices types`,
      `Révision ${exam.name} — annales / auto-évaluation`,
    ].slice(0, count);
    setState((s) => ({
      ...s,
      tasks: [
        ...titles.map((title, i) => ({
          id: "pt" + now() + i, title, exam: true, examId,
          category: "backlog", subject: exam.subject,
          prio: daysLeft <= 7 ? "high" : "med", duration: 45,
          status: "todo", createdAt: now(),
        })),
        ...s.tasks,
      ],
    }));
    pushToast({ kind: "default", text: `${titles.length} tâche(s) de révision ajoutées pour ${exam.name}.` });
  },

  /* Pomodoro */
  completePomodoro(duration) {
    setState((s) => ({
      ...s,
      sessions: [...s.sessions, { at: now(), duration, subject: null }],
    }));
    actions.addXp(40, "Pomodoro terminé");
  },

  /* ---- Global timer (keeps running while you browse other pages) ---- */
  timerStart() { setState((s) => ({ ...s, timer: { ...s.timer, running: true } })); },
  timerPause() { setState((s) => ({ ...s, timer: { ...s.timer, running: false } })); },
  timerReset() {
    setState((s) => ({ ...s, timer: { running: false, remaining: s.pomodoro.durations[s.pomodoro.mode] * 60 } }));
  },
  timerTick() {
    setState((s) => ({ ...s, timer: { ...s.timer, remaining: Math.max(0, (s.timer.remaining || 0) - 1) } }));
  },
  // Called when the countdown hits zero. Handles XP, the 4-focus→long-break
  // cycle, the notification and the automatic switch to the next phase.
  timerComplete() {
    const s = state;
    const wasFocus = s.pomodoro.mode === "focus";
    if (wasFocus) {
      actions.completePomodoro(s.pomodoro.durations.focus);
      sfx.pomoEnd();
      notify("Pomodoro terminé", "Bien joué — prends ta pause. +40 XP");
    } else {
      sfx.tick();
      notify("Pause terminée", "Retour au focus.");
    }
    const cycle = wasFocus ? (s.pomodoro.cycle || 0) + 1 : s.pomodoro.cycle || 0;
    const nextMode = wasFocus ? (cycle % 4 === 0 ? "long" : "short") : "focus";
    setState((st) => ({
      ...st,
      pomodoro: { ...st.pomodoro, mode: nextMode, cycle: nextMode === "focus" && cycle % 4 === 0 ? 0 : cycle },
      timer: { running: !!st.pomodoro.autoCycle, remaining: st.pomodoro.durations[nextMode] * 60 },
    }));
    pushToast({
      kind: wasFocus ? "xp" : "default",
      text: wasFocus
        ? `Pomodoro terminé — +40 XP · ${nextMode === "long" ? "pause longue" : "pause courte"} lancée.`
        : "Pause terminée — nouveau focus lancé.",
    });
  },
  toggleAutoCycle() {
    setState((s) => ({ ...s, pomodoro: { ...s.pomodoro, autoCycle: !s.pomodoro.autoCycle } }));
  },
  async enableNotifications() {
    try {
      if (!("Notification" in window)) { pushToast({ kind: "warn", text: "Notifications non supportées par ce navigateur." }); return; }
      const p = await Notification.requestPermission();
      const ok = p === "granted";
      setState((s) => ({ ...s, settings: { ...s.settings, notify: ok } }));
      pushToast({ kind: ok ? "default" : "warn", text: ok ? "Notifications activées." : "Notifications refusées." });
    } catch (e) {}
  },
  disableNotifications() {
    setState((s) => ({ ...s, settings: { ...s.settings, notify: false } }));
  },

  /* ---- Backup: export / import the whole workspace ---- */
  exportBackup() {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `geii-lab-sauvegarde-${todayKey()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      pushToast({ kind: "default", text: "Sauvegarde téléchargée." });
    } catch (e) { pushToast({ kind: "warn", text: "Échec de l'export." }); }
  },
  importBackup(json) {
    try {
      const parsed = typeof json === "string" ? JSON.parse(json) : json;
      if (!parsed || !parsed.profile) throw new Error("invalide");
      state = migrate(parsed);
      saveState(state);
      listeners.forEach((l) => l());
      pushToast({ kind: "default", text: "Sauvegarde restaurée." });
      return true;
    } catch (e) {
      pushToast({ kind: "warn", text: "Fichier de sauvegarde invalide." });
      return false;
    }
  },

  /* Media / ambiance player */
  addMedia(url) {
    const parsed = parseMediaUrl(url);
    if (!parsed) return false;
    const id = "m" + now();
    setState((s) => {
      const existing = (s.media || []).find((m) => m.url === url);
      if (existing) return { ...s, activeMediaId: existing.id, playerOpen: true };
      return {
        ...s,
        media: [{ id, url, ...parsed }, ...(s.media || [])].slice(0, 30),
        activeMediaId: id,
        playerOpen: true,
      };
    });
    // best-effort: fetch a real title/thumbnail via oEmbed, non-blocking
    fetchMediaMeta(url, parsed).then((meta) => {
      if (!meta) return;
      setState((s) => ({ ...s, media: (s.media || []).map((m) => (m.url === url ? { ...m, ...meta } : m)) }));
    });
    return true;
  },
  removeMedia(id) {
    setState((s) => ({
      ...s,
      media: (s.media || []).filter((m) => m.id !== id),
      activeMediaId: s.activeMediaId === id ? null : s.activeMediaId,
    }));
  },
  setActiveMedia(id) {
    setState((s) => ({ ...s, activeMediaId: id, playerOpen: true }));
  },
  setPlayerOpen(open) {
    setState((s) => ({ ...s, playerOpen: open }));
  },
  setPomodoroMode(mode) {
    setState((s) => ({ ...s, pomodoro: { ...s.pomodoro, mode }, timer: { running: false, remaining: s.pomodoro.durations[mode] * 60 } }));
  },
  setPomodoroDurations(durations) {
    setState((s) => {
      const next = { ...s.pomodoro.durations, ...durations };
      return {
        ...s,
        pomodoro: { ...s.pomodoro, durations: next },
        timer: s.timer.running ? s.timer : { running: false, remaining: next[s.pomodoro.mode] * 60 },
      };
    });
  },
  setGoalToday(n) {
    setState((s) => ({ ...s, pomodoro: { ...s.pomodoro, goalToday: Math.max(1, Math.min(20, n)) } }));
  },

  resetAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state = null;
    listeners.forEach((l) => l());
  },
};

/* ---------- FSRS-lite ----------
   Lightweight Anki/FSRS-inspired algorithm. Grade 1..4.
*/
function fsrsLite(c, grade) {
  let stability = c.stability || 1;
  let difficulty = c.difficulty || 5;

  // Adjust difficulty (1..10)
  difficulty = Math.max(1, Math.min(10, difficulty + (3 - grade) * 0.6));

  let interval;
  if (grade === 1) {
    // forgot — reset
    stability = Math.max(1, stability * 0.3);
    interval = 1;
  } else {
    const factor = grade === 2 ? 1.2 : grade === 3 ? 2.2 : 3.0;
    stability = Math.max(1, stability * factor / (difficulty / 5));
    interval = Math.round(stability);
  }

  const retention = Math.min(0.98, 0.55 + Math.log10(1 + c.reps) * 0.18 + (grade - 2) * 0.04);

  return {
    ...c,
    reps: c.reps + 1,
    stability,
    difficulty,
    interval,
    retention,
    nextReview: now() + interval * dayMs,
    history: [...(c.history || []), now()],
  };
}

/* ---------- Toast queue ---------- */
const toasts = [];
const toastListeners = new Set();
function pushToast(t) {
  const id = Math.random().toString(36).slice(2);
  const obj = { id, kind: "default", ...t };
  toasts.push(obj);
  toastListeners.forEach((l) => l());
  setTimeout(() => {
    const idx = toasts.findIndex((x) => x.id === id);
    if (idx >= 0) toasts.splice(idx, 1);
    toastListeners.forEach((l) => l());
  }, t.duration || 3200);
}
function useToasts() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    toastListeners.add(force);
    return () => toastListeners.delete(force);
  }, []);
  return toasts;
}

/* ---------- Audio engine — futuristic discrete sounds ---------- */
let audioCtx;
function playTone({ freq = 440, type = "sine", dur = 0.18, gain = 0.06, slide = 0 }) {
  if (!state.settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + 0.01);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + dur);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur + 0.02);
  } catch (e) {}
}
const sfx = {
  tick: () => playTone({ freq: 880, type: "sine", dur: 0.06, gain: 0.03 }),
  check: () => { playTone({ freq: 660, type: "sine", dur: 0.08, gain: 0.05 }); setTimeout(() => playTone({ freq: 990, type: "sine", dur: 0.10, gain: 0.05 }), 70); },
  pomoEnd: () => { playTone({ freq: 523, type: "sine", dur: 0.18, gain: 0.06 }); setTimeout(() => playTone({ freq: 784, type: "sine", dur: 0.18, gain: 0.06 }), 180); setTimeout(() => playTone({ freq: 1047, type: "sine", dur: 0.4, gain: 0.06 }), 360); },
  levelUp: () => { playTone({ freq: 523, type: "triangle", dur: 0.1, gain: 0.06 }); setTimeout(() => playTone({ freq: 659, type: "triangle", dur: 0.1, gain: 0.06 }), 100); setTimeout(() => playTone({ freq: 880, type: "triangle", dur: 0.3, gain: 0.07 }), 200); },
  touch: () => playTone({ freq: 1320, type: "sine", dur: 0.06, gain: 0.025, slide: -200 }),
};

/* ---------- Desktop notification (silent no-op if not allowed) ---------- */
function notify(title, body) {
  try {
    if (!state.settings.notify || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    new Notification(title, { body, silent: true });
  } catch (e) {}
}

/* ---------- Rank — evolves with level ---------- */
const RANKS = [
  { min: 1,  label: "Apprenti" },
  { min: 5,  label: "Technicien" },
  { min: 10, label: "Technicien Supérieur" },
  { min: 16, label: "Ingénieur Junior" },
  { min: 24, label: "Ingénieur" },
  { min: 34, label: "Ingénieur Confirmé" },
  { min: 46, label: "Expert Système" },
  { min: 60, label: "Architecte" },
];
function rankFor(level) {
  let r = RANKS[0].label;
  for (const x of RANKS) if (level >= x.min) r = x.label;
  return r;
}

/* ---------- Derived selectors ---------- */
function todaySessions(s) {
  const today = todayKey();
  return s.sessions.filter((x) => dayKey(x.at) === today);
}
function weekSessions(s) {
  const cutoff = now() - 7 * dayMs;
  return s.sessions.filter((x) => x.at >= cutoff);
}
function monthSessions(s) {
  const cutoff = now() - 30 * dayMs;
  return s.sessions.filter((x) => x.at >= cutoff);
}
function totalMinutes(sessions) {
  return sessions.reduce((acc, s) => acc + (s.duration || 25), 0);
}
function dueChapters(s) {
  return s.chapters.filter((c) => c.nextReview <= now() + dayMs).sort((a, b) => a.nextReview - b.nextReview);
}

/* ---------- Auto review quests (Ebbinghaus) ----------
   Every chapter whose scheduled review date has arrived becomes a
   virtual "quête de révision" that shows up automatically in the
   daily tasks + dashboard focus. No manual task creation needed.
   Completing it reschedules the chapter further along the curve.
*/
const EBBINGHAUS = [0, 1, 3, 7, 14, 30, 90, 180]; // reference J-intervals
const REVIEW_DAILY_CAP = 8;   // never surface more than this many reviews/day

// urgency score: overdue chapters first, then those closest to being forgotten
function reviewUrgency(c) {
  const overdueDays = Math.max(0, (now() - c.nextReview) / dayMs);
  return overdueDays * 10 + (1 - (c.retention || 0)) * 5;
}

// full list of chapters due today/overdue (uncapped)
function dueReviewChapters(s) {
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  const cutoff = endToday.getTime();
  return (s.chapters || [])
    .filter((c) => c.nextReview <= cutoff)
    .sort((a, b) => reviewUrgency(b) - reviewUrgency(a));
}

function reviewQuests(s) {
  const cap = (s.settings && s.settings.reviewCap) || REVIEW_DAILY_CAP;
  return dueReviewChapters(s)
    .slice(0, cap)               // only the most urgent fit today — rest deferred
    .map((c) => {
      const overdueDays = Math.floor((now() - c.nextReview) / dayMs);
      const prio = overdueDays >= 2 ? "high" : overdueDays >= 0 ? "med" : "low";
      return {
        id: "rev_" + c.id,
        title: `Réviser : ${c.name}`,
        review: true,
        chapterId: c.id,
        subject: c.subject,
        prio,
        duration: 15,
        category: "daily",
        status: "todo",
        overdueDays,
        retention: c.retention,
        reps: c.reps,
        virtual: true,
      };
    });
}
function urgentExams(s) {
  return s.exams.filter((e) => e.date > now()).map((e) => ({ ...e, daysLeft: Math.max(0, Math.ceil((e.date - now()) / dayMs)) })).sort((a, b) => a.daysLeft - b.daysLeft);
}

/* ---------- Streak — derived from REAL activity (not a manual counter) ----------
   A day counts as "active" if the student did at least one Pomodoro, completed
   a task/contact/delivery, or reviewed a chapter that day. The streak counts
   consecutive active days ending today (or yesterday, so it doesn't drop to
   zero the instant a new day starts before anything has been done yet).
*/
function dayKeysWithActivity(s) {
  const set = new Set();
  (s.sessions || []).forEach((x) => set.add(dayKey(x.at)));
  (s.tasks || []).forEach((t) => { if (t.status === "done" && t.completedAt) set.add(dayKey(t.completedAt)); });
  (s.contacts || []).forEach((c) => { if (c.status === "done" && c.completedAt) set.add(dayKey(c.completedAt)); });
  (s.deliveries || []).forEach((d) => { if (d.status === "received" && d.completedAt) set.add(dayKey(d.completedAt)); });
  (s.chapters || []).forEach((c) => (c.history || []).forEach((h) => set.add(dayKey(h))));
  return set;
}
function computeStreak(s) {
  const active = dayKeysWithActivity(s);
  let cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  if (!active.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - dayMs);
  let streak = 0;
  while (active.has(dayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - dayMs);
  }
  return streak;
}
function last14Days(s) {
  const active = dayKeysWithActivity(s);
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now() - i * dayMs);
    out.push({ key: dayKey(d), active: active.has(dayKey(d)) });
  }
  return out;
}

// how many due reviews are deferred beyond today's cap
function deferredReviewCount(s) {
  const cap = (s.settings && s.settings.reviewCap) || REVIEW_DAILY_CAP;
  return Math.max(0, dueReviewChapters(s).length - cap);
}

/* ---------- Molecule growth — REAL metric ----------
   Continuous 0..15 value derived from the student's actual effort:
   completed Pomodoros, completed tasks, reviews done, and total XP.

   16 named "paliers" instead of a handful of stages: the structure has
   somewhere to go for years. Thresholds are geometric — each palier costs
   roughly 1.4× the previous one — so the first ones land within days while
   the last ones take seasons. Nothing here is awarded for time passing:
   only real work moves it.
*/
const MOLECULE_TIERS = [
  { name: "Germe",          atoms: 3,   at: 0 },
  { name: "Dimère",         atoms: 5,   at: 30 },
  { name: "Chaîne",         atoms: 7,   at: 80 },
  { name: "Ramification",   atoms: 10,  at: 170 },
  { name: "Cycle",          atoms: 13,  at: 320 },
  { name: "Hétérocycle",    atoms: 17,  at: 550 },
  { name: "Polymère",       atoms: 22,  at: 900 },
  { name: "Réseau",         atoms: 28,  at: 1400 },
  { name: "Maille",         atoms: 35,  at: 2100 },
  { name: "Cristal",        atoms: 44,  at: 3100 },
  { name: "Fullerène",      atoms: 54,  at: 4500 },
  { name: "Hélice",         atoms: 66,  at: 6500 },
  { name: "Superstructure", atoms: 80,  at: 9200 },
  { name: "Lattice",        atoms: 96,  at: 13000 },
  { name: "Organisme",      atoms: 115, at: 19000 },
  { name: "Singularité",    atoms: 140, at: 28000 },
];
const MAX_TIER = MOLECULE_TIERS.length - 1;
const ROMAN = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];

function growthPoints(s) {
  const pomodoros = (s.sessions || []).length;          // each focus session
  const tasksDone = (s.tasks || []).filter((t) => t.status === "done").length;
  const reviews = (s.chapters || []).reduce((a, c) => a + (c.reps || 0), 0);
  const xp = s.profile ? s.profile.totalXp : 0;
  // weighted contribution
  return pomodoros * 4 + tasksDone * 3 + reviews * 2 + xp / 80;
}
// Continuous 0..15 — the fractional part is real progress inside the palier.
function growthStage(s) {
  const gp = growthPoints(s);
  for (let i = MAX_TIER; i >= 0; i--) {
    const lo = MOLECULE_TIERS[i].at;
    if (gp >= lo) {
      if (i === MAX_TIER) return MAX_TIER;
      const hi = MOLECULE_TIERS[i + 1].at;
      return i + (gp - lo) / (hi - lo);
    }
  }
  return 0;
}
function tierInfo(s) {
  const stage = growthStage(s);
  const tier = Math.min(MAX_TIER, Math.floor(stage));
  const next = MOLECULE_TIERS[Math.min(MAX_TIER, tier + 1)];
  return {
    stage,
    tier,
    roman: ROMAN[tier],
    name: MOLECULE_TIERS[tier].name,
    nextName: tier < MAX_TIER ? next.name : null,
    atoms: MOLECULE_TIERS[tier].atoms,
    progress: stage - tier,                       // 0..1 inside the palier
    threshold: MOLECULE_TIERS[tier].at,
    nextThreshold: tier < MAX_TIER ? next.at : MOLECULE_TIERS[MAX_TIER].at,
    max: MAX_TIER,
  };
}
function growthBreakdown(s) {
  const t = tierInfo(s);
  return {
    pomodoros: (s.sessions || []).length,
    tasksDone: (s.tasks || []).filter((t2) => t2.status === "done").length,
    reviews: (s.chapters || []).reduce((a, c) => a + (c.reps || 0), 0),
    xp: s.profile ? s.profile.totalXp : 0,
    points: Math.round(growthPoints(s)),
    nextThreshold: t.nextThreshold,
    tier: t.tier, tierName: t.name, roman: t.roman, progress: t.progress,
  };
}

/* ---------- Media link parsing (YouTube / Spotify) ---------- */
function parseMediaUrl(raw) {
  if (!raw) return null;
  const url = raw.trim();
  try {
    // YouTube
    let m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
    if (m) return { kind: "youtube", videoId: m[1], embed: `https://www.youtube.com/embed/${m[1]}?rel=0`, title: "Vidéo YouTube", thumb: `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` };
    m = url.match(/[?&]list=([\w-]+)/);
    if (m && /youtu/.test(url)) return { kind: "youtube", embed: `https://www.youtube.com/embed/videoseries?list=${m[1]}`, title: "Playlist YouTube" };
    // Spotify
    m = url.match(/open\.spotify\.com\/(?:intl-\w+\/)?(track|playlist|album|episode|show|artist)\/(\w+)/);
    if (m) return { kind: "spotify", sType: m[1], embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, title: `Spotify · ${m[1]}` };
    // SoundCloud
    if (/soundcloud\.com\//.test(url)) return { kind: "soundcloud", embed: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%237ce0ff`, title: "SoundCloud" };
    // Vimeo
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return { kind: "vimeo", embed: `https://player.vimeo.com/video/${m[1]}`, title: "Vimeo" };
    // Dailymotion
    m = url.match(/dailymotion\.com\/video\/(\w+)/) || url.match(/dai\.ly\/(\w+)/);
    if (m) return { kind: "dailymotion", embed: `https://www.dailymotion.com/embed/video/${m[1]}`, title: "Dailymotion" };
    // Any other URL → try to embed it directly
    if (/^https?:\/\//.test(url)) {
      let host = ""; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch (e) {}
      return { kind: "link", embed: url, title: host || "Lien vidéo" };
    }
  } catch (e) {}
  return null;
}

/* ---------- Pro quests (alternance / entreprise) ----------
   Contacts to follow up + deliveries due today/overdue become
   virtual quests in the daily focus, same as Ebbinghaus reviews.
*/
function proQuests(s) {
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  const cut = endToday.getTime();
  const out = [];
  (s.contacts || []).filter((c) => c.status !== "done" && new Date(c.due).getTime() <= cut)
    .forEach((c) => {
      const overdueDays = Math.floor((now() - new Date(c.due).getTime()) / dayMs);
      out.push({ id: "ctq_" + c.id, refId: c.id, kind: "contact", title: `Relancer : ${c.name}${c.org ? " (" + c.org + ")" : ""}`,
        pro: true, domain: "pro", prio: c.prio || "med", duration: 10, category: "daily", status: "todo", overdueDays, virtual: true });
    });
  (s.deliveries || []).filter((d) => d.status !== "received" && new Date(d.due).getTime() <= cut)
    .forEach((d) => {
      const overdueDays = Math.floor((now() - new Date(d.due).getTime()) / dayMs);
      out.push({ id: "dlq_" + d.id, refId: d.id, kind: "delivery", title: `Livraison : ${d.label}`,
        pro: true, domain: "pro", prio: overdueDays >= 0 ? "high" : "med", duration: 10, category: "daily", status: "todo", overdueDays, virtual: true });
    });
  return out.sort((a, b) => b.overdueDays - a.overdueDays);
}

/* ---------- Best-effort metadata fetch (real titles / thumbnails) ----------
   Uses the public noembed.com proxy (CORS-friendly, no key needed) so pasted
   links show their actual video/track title instead of a generic label.
   Fails silently (offline, blocked, unsupported host) — the generic title stays.
*/
async function fetchMediaMeta(url, parsed) {
  try {
    const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.error) return null;
    return {
      title: j.title ? (j.author_name ? `${j.title} — ${j.author_name}` : j.title) : undefined,
      thumb: j.thumbnail_url || parsed.thumb,
    };
  } catch (e) { return null; }
}

/* expose globals */
Object.assign(window, {
  useStore, actions, sfx, pushToast, useToasts, hasProfile,
  todaySessions, weekSessions, monthSessions, totalMinutes,
  dueChapters, urgentExams, dayKey, todayKey, dayMs, now,
  growthStage, growthBreakdown, tierInfo, MOLECULE_TIERS, parseMediaUrl, reviewQuests, proQuests,
  deferredReviewCount, dueReviewChapters, computeStreak, last14Days, rankFor,
  subscribeStore, getSnapshot, hydrateStore,
  SUBJECT_PALETTE,
});
