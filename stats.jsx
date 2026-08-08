/* ==========================================================
   stats.jsx — Statistics dashboard.
   Heatmap (GitHub-style), productivity curve, subject share, history.
   ========================================================== */

const Stats = () => {
  const s = useStore();
  const subjects = s.subjects;
  const sessions = s.sessions;

  // === Heatmap data: 365 days ===
  const heatmapData = React.useMemo(() => {
    const out = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today.getTime() - i * dayMs);
      const dk = dayKey(d);
      const cnt = sessions.filter((x) => dayKey(x.at) === dk).length;
      let level = 0;
      if (cnt >= 1) level = 1;
      if (cnt >= 3) level = 2;
      if (cnt >= 5) level = 3;
      if (cnt >= 7) level = 4;
      out.push({ date: d, dk, cnt, level });
    }
    return out;
  }, [sessions]);

  // Subject distribution
  const subjMin = React.useMemo(() => {
    const totals = {};
    subjects.forEach((s) => { totals[s.id] = 0; });
    sessions.forEach((x) => { if (x.subject && totals[x.subject] !== undefined) totals[x.subject] += (x.duration || 25); });
    return totals;
  }, [sessions, subjects]);
  const totalMin = Object.values(subjMin).reduce((a, b) => a + b, 0) || 1;
  const subjRanked = [...subjects].map((s) => ({ ...s, min: subjMin[s.id] || 0 })).sort((a, b) => b.min - a.min);

  // 30-day curve
  const curve = React.useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const dk = dayKey(new Date(now() - i * dayMs));
      const m = sessions.filter((x) => dayKey(x.at) === dk).reduce((a, x) => a + (x.duration || 25), 0);
      out.push({ dk, m });
    }
    return out;
  }, [sessions]);

  const reviewRespected = React.useMemo(() => {
    if (s.chapters.length === 0) return 1;
    const total = s.chapters.length;
    const ok = s.chapters.filter((c) => c.nextReview >= now() - dayMs).length;
    return ok / total;
  }, [s.chapters]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Statistiques</h1>
          <div className="sub">PROGRESSION • HABITUDES • RÉTENTION</div>
        </div>
        <div className="actions">
          <div className="stat-chip"><span className="label">Compte</span><span className="val mono">{Math.floor((now() - s.profile.createdAt) / dayMs)} jours</span></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        <KpiMini title="Temps total" value={`${Math.floor(totalMinutes(sessions)/60)}h`} sub={`${sessions.length} sessions`} tone="cyan"/>
        <KpiMini title="Moy. quot." value={`${Math.round(totalMin / 90)} min`} sub="90 derniers jours" tone="cyan"/>
        <KpiMini title="Régularité" value={`${Math.round(reviewRespected * 100)}%`} sub="révisions respectées" tone="amber"/>
        <KpiMini title="Niveau" value={`Lv ${s.profile.level}`} sub={s.profile.rank} tone="violet"/>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Card title="Activité — 12 derniers mois" meta={`${sessions.length} sessions • style heatmap`}>
          <Heatmap data={heatmapData}/>
          <div className="heatmap-legend">
            <span>Moins</span>
            <span className="cell"/>
            <span className="cell l1"/>
            <span className="cell l2"/>
            <span className="cell l3"/>
            <span className="cell l4"/>
            <span>Plus</span>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="Courbe de productivité" meta="30 derniers jours">
          <ProductivityCurve data={curve}/>
        </Card>

        <Card title="Répartition par matière" meta={`${Math.round(totalMin/60)}h cumulées`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {subjRanked.map((s) => {
              const pct = (s.min / totalMin) * 100;
              return (
                <div key={s.id}>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 11.5 }}>
                    <span>{s.name}</span>
                    <span className="mono muted">{Math.floor(s.min/60)}h{String(s.min%60).padStart(2,"0")}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
                    <div style={{
                      height: "100%",
                      width: pct + "%",
                      background: `linear-gradient(90deg, ${s.color}aa, ${s.color}55)`,
                      boxShadow: `0 0 8px ${s.color}55`,
                      transition: "width 0.6s",
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Historique des sessions" meta="dernières activités" actions={
        <span className="muted mono" style={{ fontSize: 10 }}>30 ENTRÉES MAX</span>
      }>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sessions.slice(-30).reverse().map((x, i) => {
            const subj = subjects.find((s) => s.id === x.subject);
            return (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto auto",
                gap: 14,
                padding: "8px 14px",
                borderBottom: "1px solid var(--line)",
                alignItems: "center",
              }}>
                <span className="mono muted" style={{ fontSize: 11 }}>{new Date(x.at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })}</span>
                <span style={{ fontSize: 12 }}>{subj ? subj.name : "Session libre"}</span>
                <span className="mono muted" style={{ fontSize: 11 }}>{new Date(x.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--cyan)" }}>{x.duration} min</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const Heatmap = ({ data }) => {
  // Group into weeks. data[0] is oldest, data[last] is today.
  // We need to align so each column starts on a fixed weekday (Mon).
  const weeks = [];
  let week = [];
  data.forEach((d) => {
    const dow = (d.date.getDay() + 6) % 7; // Mon=0..Sun=6
    if (week.length === 0) {
      for (let i = 0; i < dow; i++) week.push(null);
    }
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((w, idx) => {
    const firstDay = w.find((x) => x != null);
    if (firstDay) {
      const m = firstDay.date.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ idx, label: firstDay.date.toLocaleDateString("fr-FR", { month: "short" }) });
        lastMonth = m;
      }
    }
  });

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: `auto 1fr`, gap: 8 }}>
        <div style={{ display: "grid", gridTemplateRows: "repeat(7, 14px)", gap: 3, paddingTop: 18, color: "var(--fg-3)", fontSize: 9 }}>
          <span/><span>Mar</span><span/><span>Jeu</span><span/><span>Sam</span><span/>
        </div>
        <div className="heatmap-wrap">
          <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "17px", marginBottom: 4, fontSize: 9, color: "var(--fg-3)", height: 14 }}>
            {monthLabels.map((m, i) => (
              <span key={i} style={{ gridColumnStart: m.idx + 1, whiteSpace: "nowrap" }}>{m.label}</span>
            ))}
          </div>
          <div className="heatmap">
            {weeks.flat().map((d, i) => (
              <div
                key={i}
                className={"cell " + (d ? "l" + d.level : "")}
                title={d ? `${d.date.toLocaleDateString("fr-FR")} — ${d.cnt} sessions` : ""}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductivityCurve = ({ data }) => {
  const W = 600;
  const H = 200;
  const padding = { l: 30, r: 10, t: 10, b: 24 };
  const innerW = W - padding.l - padding.r;
  const innerH = H - padding.t - padding.b;
  const max = Math.max(60, ...data.map((d) => d.m));
  const step = innerW / (data.length - 1);

  const points = data.map((d, i) => {
    const x = padding.l + i * step;
    const y = padding.t + innerH - (d.m / max) * innerH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => (i === 0 ? "M" : "L") + p.x + "," + p.y).join(" ");
  const areaD = pathD + ` L${points[points.length-1].x},${padding.t + innerH} L${points[0].x},${padding.t + innerH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const y = padding.t + innerH * (1 - p);
    return { y, label: Math.round(max * p) };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="curve-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.15 200)" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="oklch(0.85 0.15 200)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padding.l} x2={W - padding.r} y1={g.y} y2={g.y} stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4"/>
          <text x={padding.l - 6} y={g.y + 3} textAnchor="end" fontSize="8" fill="var(--fg-3)" fontFamily="IBM Plex Mono">{g.label}</text>
        </g>
      ))}
      <path d={areaD} fill="url(#curve-grad)"/>
      <path d={pathD} fill="none" stroke="oklch(0.85 0.15 200)" strokeWidth="1.5"/>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3 : 1.5} fill={i === points.length - 1 ? "var(--cyan)" : "oklch(0.85 0.15 200 / 0.6)"}/>
      ))}
      {/* x-axis labels — every ~5 days */}
      {points.filter((_, i) => i % 5 === 0 || i === points.length - 1).map((p, i) => (
        <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--fg-3)" fontFamily="IBM Plex Mono">
          {new Date(p.dk).toLocaleDateString("fr-FR", { day: "numeric", month: "numeric" })}
        </text>
      ))}
    </svg>
  );
};

window.Stats = Stats;
