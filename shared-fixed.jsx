/* ==========================================================
   shared.jsx — Small components used across pages.
   ========================================================== */

const Card = ({ title, meta, children, className = "", actions, glow }) => (
  <div className={"card " + (glow ? "glow " : "") + className}>
    {(title || actions) && (
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          {meta && <div className="meta">{meta}</div>}
        </div>
        <div className="row gap-2">{actions}</div>
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

const Sparkline = ({ values, color = "var(--accent)", width = 120, height = 28 }) => {
  if (!values || values.length === 0) return <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" />;
  const max = Math.max(1, ...values);
  const step = width / (values.length - 1 || 1);
  const points = values.map((v, i) => `${i * step},${height - (v / max) * (height - 4) - 2}`).join(" ");
  const area = `0,${height} ` + points + ` ${width},${height}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <polyline points={area} fill={color} opacity="0.12"/>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.3" vectorEffect="non-scaling-stroke"/>
      <circle cx={(values.length - 1) * step} cy={height - (values[values.length-1] / max) * (height - 4) - 2} r="2.5" fill={color}/>
    </svg>
  );
};

const ProgressRing = ({ value = 0, size = 42, stroke = 3, color = "var(--accent)", track = "rgba(255,255,255,0.08)" }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, value));
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none"/>
      <circle
        cx={size/2} cy={size/2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
};

const Particles = ({ count = 14 }) => {
  const items = React.useMemo(() => Array.from({ length: count }).map((_, i) => ({
    left: Math.random() * 100,
    duration: 10 + Math.random() * 18,
    delay: -Math.random() * 18,
    size: 1 + Math.random() * 2.5,
    opacity: 0.2 + Math.random() * 0.4,
  })), [count]);
  return (
    <div className="particle-bg">
      {items.map((p, i) => (
        <span key={i} className="p" style={{
          left: p.left + "%",
          top: "100%",
          animationDuration: p.duration + "s",
          animationDelay: p.delay + "s",
          width: p.size + "px",
          height: p.size + "px",
          opacity: p.opacity,
        }}/>
      ))}
    </div>
  );
};

const Modal = ({ title, children, onClose, actions }) => (
  <div className="modal-bg" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h3>{title}</h3>
        <button className="btn icon ghost" aria-label="Fermer" onClick={onClose}><Icon name="x"/></button>
      </div>
      <div className="modal-body">{children}</div>
      {actions && <div className="modal-actions">{actions}</div>}
    </div>
  </div>
);

const ConfirmModal = ({ title = "Confirmer", message, confirmLabel = "Confirmer", danger = true, onConfirm, onClose }) => (
  <Modal title={title} onClose={onClose} actions={
    <>
      <button className="btn ghost" onClick={onClose}>Annuler</button>
      <button className={"btn " + (danger ? "danger" : "primary")} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
    </>
  }>
    <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{message}</div>
  </Modal>
);

const SubjectTag = ({ subjectId, subjects }) => {
  const subj = subjects.find((s) => s.id === subjectId);
  if (!subj) return null;
  return (
    <span className="tag" style={{ color: subj.color, borderColor: subj.color + "55", background: subj.color + "12" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: subj.color }}/>
      {subj.name}
    </span>
  );
};

Object.assign(window, { Card, Sparkline, ProgressRing, Particles, Modal, ConfirmModal, SubjectTag });
