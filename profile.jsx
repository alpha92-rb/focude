/* ==========================================================
   profile.jsx — Page Profil : photo, assiduité, progression.
   Photo de profil + heatmap (style GitHub), courbe de productivité,
   répartition par matière, historique des sessions.
   ========================================================== */

// Redimensionne et compresse une image côté client avant de la stocker :
// une photo de téléphone fait plusieurs Mo, alors qu'un avatar affiché à
// ~80px n'a besoin que de quelques dizaines de Ko — sinon chaque sync
// Supabase traînerait un JSON obèse.
function compressAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onerror = reject;
      img.onload = () => {
        const SIZE = 256;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        // Recadrage carré centré, quel que soit le ratio d'origine.
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const Avatar = ({ src, name, size = 64, onClick }) => {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: src ? `center/cover no-repeat url(${src})` : "linear-gradient(135deg, oklch(0.72 0.18 240), oklch(0.55 0.18 270))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 600, color: "#fff",
      border: "1px solid var(--line-strong)", boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset",
      cursor: onClick ? "pointer" : "default",
    }}>
      {!src && initial}
    </div>
  );
};

const ProfilePage = () => {
  const s = useStore();
  const [lang] = useLang();
  const subjects = s.subjects;
  const sessions = s.sessions;
  const fileRef = React.useRef(null);
  const locale = lang === "en" ? "en-US" : "fr-FR";

  const onAvatarPick = () => fileRef.current && fileRef.current.click();
  const onAvatarFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      const dataUrl = await compressAvatar(f);
      actions.updateProfile({ avatar: dataUrl });
      pushToast({ kind: "default", text: t("profile.changePhoto") + " ✓" });
    } catch {
      pushToast({ kind: "default", text: "…" });
    }
  };

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
          <h1>{t("profile.title")}</h1>
          <div className="sub">{t("profile.subtitle")}</div>
        </div>
        <div className="actions">
          <div className="stat-chip"><span className="label">{t("profile.account")}</span><span className="val mono">{Math.floor((now() - s.profile.createdAt) / dayMs)} {lang === "en" ? "days" : "jours"}</span></div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Card>
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <Avatar src={s.profile.avatar} name={s.profile.name} size={72} onClick={onAvatarPick}/>
            <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarFile} style={{ display: "none" }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 500 }}>{s.profile.name}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {[s.profile.field, s.profile.rank].filter(Boolean).join(" · ")}
              </div>
              <button className="btn" style={{ marginTop: 10 }} onClick={onAvatarPick}>
                {s.profile.avatar ? t("profile.changePhoto") : t("profile.addPhoto")}
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        <KpiMini title={t("profile.totalTime")} value={`${Math.floor(totalMinutes(sessions)/60)}h`} sub={`${sessions.length} sessions`} tone="cyan"/>
        <KpiMini title={t("profile.dailyAvg")} value={`${Math.round(totalMin / 90)} min`} sub={t("profile.last90")} tone="cyan"/>
        <KpiMini title={t("profile.regularity")} value={`${Math.round(reviewRespected * 100)}%`} sub={t("profile.reviewsRespected")} tone="amber"/>
        <KpiMini title={t("profile.level")} value={`Lv ${s.profile.level}`} sub={s.profile.rank} tone="violet"/>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Card title={t("profile.activity")} meta={`${sessions.length} sessions • ${t("profile.heatmapStyle")}`}>
          <Heatmap data={heatmapData} locale={locale}/>
          <div className="heatmap-legend">
            <span>{t("profile.less")}</span>
            <span className="cell"/>
            <span className="cell l1"/>
            <span className="cell l2"/>
            <span className="cell l3"/>
            <span className="cell l4"/>
            <span>{t("profile.more")}</span>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title={t("profile.productivityCurve")} meta={t("profile.last30")}>
          <ProductivityCurve data={curve} locale={locale}/>
        </Card>

        <Card title={t("profile.bySubject")} meta={`${Math.round(totalMin/60)}h ${t("profile.cumulated")}`}>
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

      <Card title={t("profile.history")} meta={t("profile.recent")} actions={
        <span className="muted mono" style={{ fontSize: 10 }}>{t("profile.max30")}</span>
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
                <span className="mono muted" style={{ fontSize: 11 }}>{new Date(x.at).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" })}</span>
                <span style={{ fontSize: 12 }}>{subj ? subj.name : t("profile.freeSession")}</span>
                <span className="mono muted" style={{ fontSize: 11 }}>{new Date(x.at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--cyan)" }}>{x.duration} min</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const Heatmap = ({ data, locale }) => {
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
        monthLabels.push({ idx, label: firstDay.date.toLocaleDateString(locale, { month: "short" }) });
        lastMonth = m;
      }
    }
  });

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: `auto 1fr`, gap: 8 }}>
        <div style={{ display: "grid", gridTemplateRows: "repeat(7, 14px)", gap: 3, paddingTop: 18, color: "var(--fg-3)", fontSize: 9 }}>
          <span/><span>{locale === "en-US" ? "Tue" : "Mar"}</span><span/><span>{locale === "en-US" ? "Thu" : "Jeu"}</span><span/><span>{locale === "en-US" ? "Sat" : "Sam"}</span><span/>
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
                title={d ? `${d.date.toLocaleDateString(locale)} — ${d.cnt} sessions` : ""}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductivityCurve = ({ data, locale }) => {
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
          {new Date(p.dk).toLocaleDateString(locale, { day: "numeric", month: "numeric" })}
        </text>
      ))}
    </svg>
  );
};

Object.assign(window, { ProfilePage, Avatar });
