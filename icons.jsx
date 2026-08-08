/* ==========================================================
   icons.jsx — Minimal stroke icons (24px viewBox).
   ========================================================== */

const Icon = ({ name, size = 16, stroke = "currentColor" }) => {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "dashboard":
      return <svg {...props}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
    case "pomodoro":
      return <svg {...props}><circle cx="12" cy="13" r="8"/><path d="M12 13V8.5"/><path d="M9 2h6"/><path d="M12 2v3"/></svg>;
    case "revisions":
      return <svg {...props}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>;
    case "tasks":
      return <svg {...props}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case "exams":
      return <svg {...props}><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v6c0 0 3 3 9 3s9-3 9-3V7"/></svg>;
    case "stats":
      return <svg {...props}><path d="M3 3v18h18"/><path d="M7 14l3-4 4 3 5-7"/></svg>;
    case "settings":
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.5 0 .98.2 1.51 1H21a2 2 0 1 1 0 4h-.09c-.53.02-1.01.2-1.51 1z"/></svg>;
    case "play":
      return <svg {...props}><polygon points="6 4 20 12 6 20 6 4"/></svg>;
    case "pause":
      return <svg {...props}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>;
    case "reset":
      return <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>;
    case "plus":
      return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "trash":
      return <svg {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
    case "check":
      return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
    case "fire":
      return <svg {...props}><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3-1 0-3 2-3 5a6 6 0 1 0 12 0c0-5-6-11-6-11z"/></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 13.5"/></svg>;
    case "brain":
      return <svg {...props}><path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 4 3 3 0 0 0 3-2"/><path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-4 4 3 3 0 0 1-3-2V5"/></svg>;
    case "search":
      return <svg {...props}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "filter":
      return <svg {...props}><polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3"/></svg>;
    case "lightning":
      return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "sparkle":
      return <svg {...props}><path d="M12 3l1.5 6L20 12l-6.5 1.5L12 21l-1.5-7.5L4 12l6.5-1.5z"/></svg>;
    case "circuit":
      return <svg {...props}><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h8M6 8v8M18 8v8M8 18h8"/></svg>;
    case "sound":
      return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>;
    case "mute":
      return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;
    case "calendar":
      return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case "warn":
      return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "drag":
      return <svg {...props}><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>;
    case "x":
      return <svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "chevron-down":
      return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>;
    case "atom":
      return <svg {...props}><circle cx="12" cy="12" r="1"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
  }
};

window.Icon = Icon;
