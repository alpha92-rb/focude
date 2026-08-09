/* ==========================================================
   logo.jsx — Focude brand mark.
   Hexagonal engineering badge + atomic orbit. Used in the
   topbar, onboarding, and as the favicon.
   ========================================================== */

const HEX = "M24 2.5 L43.6 13.75 L43.6 36.25 L24 47.5 L4.4 36.25 L4.4 13.75 Z";

const Logo = ({ size = 30, glow = true }) => {
  const id = React.useId ? React.useId().replace(/:/g, "") : "lg" + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`hexF${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f1830"/>
          <stop offset="100%" stopColor="#0a0f1e"/>
        </linearGradient>
        <linearGradient id={`hexS${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7ce0ff"/>
          <stop offset="55%" stopColor="#4f7bff"/>
          <stop offset="100%" stopColor="#a05cff"/>
        </linearGradient>
        <radialGradient id={`core${id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#bdeeff"/>
          <stop offset="55%" stopColor="#4f9bff"/>
          <stop offset="100%" stopColor="#2a4bd0"/>
        </radialGradient>
        {glow && (
          <filter id={`gl${id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.1" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        )}
      </defs>

      {/* hex badge */}
      <path d={HEX} fill={`url(#hexF${id})`} stroke={`url(#hexS${id})`} strokeWidth="2"/>

      {/* atomic orbits */}
      <g filter={glow ? `url(#gl${id})` : undefined} stroke="#7ce0ff" strokeWidth="1.4" fill="none">
        <ellipse cx="24" cy="24" rx="15" ry="6" opacity="0.85" transform="rotate(28 24 24)"/>
        <ellipse cx="24" cy="24" rx="15" ry="6" opacity="0.55" transform="rotate(-28 24 24)"/>
      </g>

      {/* electrons */}
      <circle cx="37" cy="17.5" r="1.9" fill="#7ce0ff" filter={glow ? `url(#gl${id})` : undefined}/>
      <circle cx="11" cy="30.5" r="1.6" fill="#a05cff" filter={glow ? `url(#gl${id})` : undefined}/>

      {/* nucleus */}
      <circle cx="24" cy="24" r="4.4" fill={`url(#core${id})`} filter={glow ? `url(#gl${id})` : undefined}/>
      <circle cx="22.5" cy="22.5" r="1.1" fill="#ffffff" opacity="0.9"/>
    </svg>
  );
};

window.Logo = Logo;
