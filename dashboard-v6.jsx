/* ==========================================================
   dashboard.jsx — Main page. Molecule + KPIs + today's focus.
   ========================================================== */

const Dashboard = ({ onNav }) => {
  const s = useStore();

  const today = todaySessions(s);
  const week = weekSessions(s);
  const month = monthSessions(s);

  const todayMin = totalMinutes(today);
  const weekMin = totalMinutes(week);
  const monthMin = totalMinutes(month);

  const due = dueChapters(s);
  const exams = urgentExams(s);
  const nextExam = exams[0];

  const gStage = growthStage(s);
  const gb = growthBreakdown(s);
  const ti = tierInfo(s);
  const streak = computeStreak(s);
  const last14 = last14Days(s);

  // weekly sparkline data
  const weeklySpark = React.useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const dk = dayKey(new Date(now() - i * dayMs));
      const m = s.sessions.filter((x) => dayKey(x.at) === dk).reduce((a, x) => a + (x.duration || 25), 0);
      out.push(m);
    }
    return out;
  }, [s.sessions]);

  // today's tasks — Ebbinghaus reviews + pro quests (alternance) first, then daily tasks
  const todayTasks = [...reviewQuests(s), ...proQuests(s), ...s.tasks.filter((t) => t.category === "daily" || dayKey(t.due || now()) === todayKey())].slice(0, 8);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tableau de bord</h1>
          <div className="sub">SESSION • {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => onNav("pomodoro")}><Icon name="pomodoro"/>Démarrer un Pomodoro</button>
          <button className="btn primary" onClick={() => onNav("revisions")}><Icon name="brain"/>Réviser maintenant</button>
        </div>
      </div>

      <div className="dash-grid">
        <Card title="Structure cognitive"
          meta={`PALIER ${ti.roman} / ${ti.max} • ${ti.name.toUpperCase()}`}
          className="molecule-card" glow>
          <div className="molecule-stage">
            <div className="corners"><i className="tl"/><i className="tr"/><i className="bl"/><i className="br"/></div>
            <Molecule3D stage={gStage} onTouch={() => { sfx.touch(); }}/>
            {/* Le geste n'est pas le même selon l'appareil : parler de souris sur
                un téléphone décrit une interaction qui n'existe pas. */}
            <div className="molecule-hint mono">
              {matchMedia("(hover: none)").matches ? "GLISSEZ · TOUCHEZ" : "SURVOLEZ · DÉPLACEZ LA SOURIS"}
            </div>

            <div className="tier-panel">
              <div className="tier-head">
                <span className="tier-roman mono">{ti.roman}</span>
                <div className="tier-name-wrap">
                  <div className="tier-name">{ti.name}</div>
                  <div className="tier-next mono">
                    {ti.atoms} ATOMES
                    {ti.nextName ? <span className="dim"> · SUIVANT {ti.nextName.toUpperCase()}</span> : <span className="dim"> · PALIER MAXIMAL</span>}
                  </div>
                </div>
                <span className="tier-pts mono">
                  {gb.points.toLocaleString("fr-FR")}
                  {ti.nextName ? <span className="dim"> / {ti.nextThreshold.toLocaleString("fr-FR")}</span> : null}
                </span>
              </div>
              <div className="tier-track">
                <i style={{ width: `${Math.round(ti.progress * 100)}%` }}/>
              </div>
              <div className="tier-ticks">
                {MOLECULE_TIERS.map((t, i) => (
                  <span key={i} className={"tier-tick" + (i <= ti.tier ? " on" : "")} title={t.name}/>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="stats-row">
          <Card>
            <div className="kpi">
              <div className="lbl">Aujourd'hui</div>
              <div className="val tnum">{Math.floor(todayMin/60)}h{String(todayMin%60).padStart(2,"0")}</div>
              <div className="delta">+{today.length} sessions</div>
              <Sparkline values={weeklySpark} color="var(--cyan)" width={200}/>
              <div className="axis-row"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
            </div>
          </Card>
          <Card>
            <div className="kpi">
              <div className="lbl">Streak</div>
              <div className="val tnum" style={{ color: "var(--amber)" }}>{streak}<span style={{ fontSize: 14, color: "var(--fg-2)", marginLeft: 6 }}>jours</span></div>
              <div className="delta">{streak > 0 ? "discipline active" : "reprends aujourd'hui"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 3, marginTop: 12 }}>
                {last14.map((d) => (
                  <div key={d.key} style={{
                    width: "100%", height: 22,
                    borderRadius: 2,
                    background: d.active ? "oklch(0.82 0.14 75)" : "rgba(255,255,255,0.06)",
                    boxShadow: d.active ? "0 0 8px oklch(0.82 0.14 75 / 0.5)" : "none",
                  }}/>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <div className="kpi">
              <div className="lbl">Mémoire</div>
              <div className="val tnum">{s.chapters.length ? Math.round(s.chapters.reduce((a, c) => a + c.retention, 0) / s.chapters.length * 100) : 0}<span style={{ fontSize: 14, color: "var(--fg-2)" }}>%</span></div>
              <div className="delta">{s.chapters.length} chapitres actifs</div>
              <div style={{ marginTop: 10 }}>
                <div className="muted" style={{ fontSize: 11 }}>Rétention moyenne</div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginTop: 4, overflow: "hidden" }}>
                  <div style={{
                    width: (s.chapters.length ? Math.round(s.chapters.reduce((a, c) => a + c.retention, 0) / s.chapters.length * 100) : 0) + "%",
                    height: "100%",
                    background: "linear-gradient(90deg, var(--cyan), var(--violet))",
                    boxShadow: "0 0 8px var(--cyan)",
                  }}/>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Focus du jour" meta={`${todayTasks.filter(t=>t.status!=="done").length} restantes`} actions={
          <button className="btn sm ghost" onClick={() => onNav("tasks")}>Voir tout →</button>
        }>
          <div className="task-list" style={{ marginInline: -16 }}>
            {todayTasks.map((t) => (
              <TaskRow key={t.id} task={t} subjects={s.subjects} compact/>
            ))}
            {todayTasks.length === 0 && <div className="muted" style={{ padding: 16 }}>Aucune tâche prévue. Profitez-en pour réviser.</div>}
            {deferredReviewCount(s) > 0 && (
              <div className="defer-hint mono">
                +{deferredReviewCount(s)} révision{deferredReviewCount(s)>1?"s":""} reportée{deferredReviewCount(s)>1?"s":""} à demain — charge du jour plafonnée pour ne pas te surcharger.
              </div>
            )}
          </div>
        </Card>

        <Card title="Prochaines révisions" meta={`${due.length} à faire`} actions={
          <button className="btn sm ghost" onClick={() => onNav("revisions")}>Voir tout →</button>
        }>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {due.slice(0, 4).map((c) => {
              const subj = s.subjects.find((x) => x.id === c.subject);
              const overdue = c.nextReview < now();
              const days = Math.ceil((c.nextReview - now()) / dayMs);
              return (
                <div key={c.id} style={{
                  padding: "10px 12px",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: overdue ? "oklch(0.68 0.22 25 / 0.05)" : "rgba(0,0,0,0.15)",
                  borderColor: overdue ? "oklch(0.68 0.22 25 / 0.3)" : "var(--line)",
                }}>
                  <div>
                    <div style={{ fontSize: 12.5 }}>{c.name}</div>
                    <div className="row gap-2" style={{ marginTop: 4 }}>
                      <span className="mono" style={{ fontSize: 10, color: subj?.color }}>{subj?.name}</span>
                      <span className="dot" style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--fg-3)" }}/>
                      <span className="mono" style={{ fontSize: 10, color: "var(--fg-2)" }}>RÉV. #{c.reps}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontSize: 13, color: overdue ? "oklch(0.85 0.15 25)" : "var(--fg-0)" }}>
                      {overdue ? `+${Math.abs(days)}j` : `J-${days}`}
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.2em" }}>{Math.round(c.retention * 100)}% MEM</div>
                  </div>
                </div>
              );
            })}
            {due.length === 0 && <div className="muted">Aucune révision urgente.</div>}
          </div>
        </Card>

        <Card title="Examens à venir" meta={`${exams.length} programmés`} actions={
          <button className="btn sm ghost" onClick={() => onNav("exams")}>Voir tout →</button>
        }>
          {nextExam ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{nextExam.name}</div>
                  <div className="muted mono" style={{ fontSize: 10, letterSpacing: "0.1em", marginTop: 2 }}>
                    {s.subjects.find(x => x.id === nextExam.subject)?.name.toUpperCase()} • COEF {nextExam.coef}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono tnum" style={{ fontSize: 28, fontWeight: 300, color: nextExam.daysLeft <= 7 ? "oklch(0.85 0.15 25)" : "var(--fg-0)" }}>
                    J–{nextExam.daysLeft}
                  </div>
                </div>
              </div>
              {exams.slice(1, 4).map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-2)", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                  <span>{e.name}</span>
                  <span className="mono">J–{e.daysLeft}</span>
                </div>
              ))}
            </div>
          ) : <div className="muted">Aucun examen programmé.</div>}
        </Card>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
