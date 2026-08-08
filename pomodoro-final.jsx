/* ==========================================================
   pomodoro.jsx — Pomodoro timer with circular dial.
   ========================================================== */

const Pomodoro = () => {
  const s = useStore();
  const { mode, durations } = s.pomodoro;
  const totalSec = durations[mode] * 60;
  const remaining = s.timer ? s.timer.remaining : totalSec;
  const running = s.timer ? s.timer.running : false;
  const [pulse, setPulse] = React.useState(false);
  const prevSessions = React.useRef(s.sessions.length);

  // celebratory pulse whenever a focus session lands
  React.useEffect(() => {
    if (s.sessions.length > prevSessions.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1200);
      prevSessions.current = s.sessions.length;
      return () => clearTimeout(t);
    }
    prevSessions.current = s.sessions.length;
  }, [s.sessions.length]);

  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const progress = 1 - remaining / totalSec;
  const r = 180;
  const c = 2 * Math.PI * r;

  const todayCount = todaySessions(s).length;

  // history this week
  const weekHist = React.useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const dk = dayKey(new Date(now() - i * dayMs));
      const cnt = s.sessions.filter((x) => dayKey(x.at) === dk).length;
      out.push({ dk, cnt, day: new Date(now() - i * dayMs).toLocaleDateString("fr-FR", { weekday: "short" }) });
    }
    return out;
  }, [s.sessions]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Pomodoro</h1>
          <div className="sub">FOCUS PROFOND • CYCLES STRUCTURÉS • CONCENTRATION MAXIMALE</div>
        </div>
        <div className="actions">
          <div className="stat-chip"><span className="label">Sessions auj.</span><span className="val mono">{todayCount}/{s.pomodoro.goalToday}</span></div>
        </div>
      </div>

      <div className="pomo-stage">
        <Card glow>
          <div className="pomo-dial" style={pulse ? { animation: "pulseUrgent 1.2s ease-in-out" } : {}}>
            <svg viewBox="0 0 400 400">
              <defs>
                <linearGradient id="dial-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.85 0.15 200)"/>
                  <stop offset="100%" stopColor="oklch(0.55 0.18 270)"/>
                </linearGradient>
                <filter id="dial-glow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {/* outer tick marks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
                const inner = i % 5 === 0 ? 185 : 192;
                const outer = 198;
                const x1 = 200 + Math.cos(a) * inner;
                const y1 = 200 + Math.sin(a) * inner;
                const x2 = 200 + Math.cos(a) * outer;
                const y2 = 200 + Math.sin(a) * outer;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(180,210,255,0.18)" strokeWidth={i%5===0?1.2:0.6}/>;
              })}
              {/* track */}
              <circle cx="200" cy="200" r="180" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none"/>
              {/* progress */}
              <circle
                cx="200" cy="200" r="180"
                stroke="url(#dial-grad)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${c * progress} ${c}`}
                transform="rotate(-90 200 200)"
                filter="url(#dial-glow)"
                style={{ transition: "stroke-dasharray 0.7s linear" }}
              />
              {/* center disc */}
              <circle cx="200" cy="200" r="150" fill="rgba(10,15,30,0.4)" stroke="rgba(255,255,255,0.04)"/>
              {/* inner circle decorative */}
              <circle cx="200" cy="200" r="118" fill="none" stroke="rgba(124,224,255,0.12)" strokeDasharray="3 6"/>
            </svg>
            <div className="time-readout">
              <div className="state">{mode === "focus" ? "Focus profond" : mode === "short" ? "Pause courte" : "Pause longue"}</div>
              <div className="clock">{String(min).padStart(2,"0")}:{String(sec).padStart(2,"0")}</div>
              <div className="session">SESSION #{todayCount + 1} / OBJ {s.pomodoro.goalToday} · CYCLE {(s.pomodoro.cycle || 0) % 4}/4</div>
            </div>
          </div>

          <div className="pomo-controls">
            {!running ? (
              <button className="btn primary" onClick={() => { actions.timerStart(); sfx.tick(); }}><Icon name="play"/>Démarrer</button>
            ) : (
              <button className="btn" onClick={() => actions.timerPause()}><Icon name="pause"/>Pause</button>
            )}
            <button className="btn ghost" onClick={() => actions.timerReset()}>
              <Icon name="reset"/>Réinitialiser
            </button>
          </div>

          <div className="pomo-presets">
            <button className={mode==="focus"?"active":""} onClick={() => actions.setPomodoroMode("focus")}>
              <span className="lbl">FOCUS</span><span className="v">{durations.focus} min</span>
            </button>
            <button className={mode==="short"?"active":""} onClick={() => actions.setPomodoroMode("short")}>
              <span className="lbl">PAUSE COURTE</span><span className="v">{durations.short} min</span>
            </button>
            <button className={mode==="long"?"active":""} onClick={() => actions.setPomodoroMode("long")}>
              <span className="lbl">PAUSE LONGUE</span><span className="v">{durations.long} min</span>
            </button>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Durées" meta="CLIQUE POUR AJUSTER">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <DurationSlider label="Focus" value={durations.focus} max={90} onChange={(v) => actions.setPomodoroDurations({ focus: v })}/>
              <DurationSlider label="Pause courte" value={durations.short} max={30} onChange={(v) => actions.setPomodoroDurations({ short: v })}/>
              <DurationSlider label="Pause longue" value={durations.long} max={60} onChange={(v) => actions.setPomodoroDurations({ long: v })}/>
              <DurationSlider label="Objectif du jour" value={s.pomodoro.goalToday} max={16} unit="sessions" onChange={(v) => actions.setGoalToday(v)}/>
            </div>
            <hr className="div"/>
            <div className="sound-toggle" style={{ fontSize: 12 }}>
              <span>Enchaîner automatiquement les phases</span>
              <button type="button" role="switch" aria-checked={!!s.pomodoro.autoCycle}
                aria-label="Enchaînement automatique"
                className={"switch " + (s.pomodoro.autoCycle ? "on" : "")}
                onClick={() => actions.toggleAutoCycle()}/>
            </div>
          </Card>

          <Card title="Concentration" meta="7 DERNIERS JOURS">
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100 }}>
              {weekHist.map((d) => {
                const h = Math.min(100, d.cnt * 14);
                return (
                  <div key={d.dk} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div style={{
                        width: "100%", height: `${h}%`, minHeight: 2,
                        background: "linear-gradient(180deg, var(--cyan), oklch(0.55 0.18 245))",
                        boxShadow: h > 50 ? "0 0 8px var(--cyan)" : "none",
                        borderRadius: "3px 3px 0 0",
                      }}/>
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: "var(--fg-2)" }}>{d.day}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Temps cumulés">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Stat lbl="Aujourd'hui" val={`${Math.floor(totalMinutes(todaySessions(s))/60)}h${String(totalMinutes(todaySessions(s))%60).padStart(2,"0")}`}/>
              <Stat lbl="Cette semaine" val={`${Math.floor(totalMinutes(weekSessions(s))/60)}h`}/>
              <Stat lbl="Ce mois" val={`${Math.floor(totalMinutes(monthSessions(s))/60)}h`}/>
              <Stat lbl="Total" val={`${Math.floor(totalMinutes(s.sessions)/60)}h`}/>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ lbl, val }) => (
  <div>
    <div className="mono" style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{lbl}</div>
    <div className="mono" style={{ fontSize: 22, marginTop: 4 }}>{val}</div>
  </div>
);

const DurationSlider = ({ label, value, max, unit = "min", onChange }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-2)" }}>
      <span>{label}</span>
      <span className="mono" style={{ color: "var(--cyan)" }}>{value} {unit}</span>
    </div>
    <input
      type="range" min="1" max={max} step="1"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      style={{ width: "100%", marginTop: 4, accentColor: "oklch(0.72 0.18 240)" }}
    />
  </div>
);

Object.assign(window, { Pomodoro, Stat, DurationSlider });
