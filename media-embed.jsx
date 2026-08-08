/* ==========================================================
   media.jsx — Ambiance page + global docked player.
   Paste a YouTube / Spotify / SoundCloud link and listen
   while revising. The DockedPlayer stays mounted across
   page switches so playback never stops.
   ========================================================== */

const MediaPage = () => {
  const s = useStore();
  const [url, setUrl] = React.useState("");
  const [err, setErr] = React.useState("");
  const inputRef = React.useRef(null);

  const current = activeMedia(s);
  const library = (s.media || []).filter((m) => m.id !== s.activeMediaId);

  const play = (raw) => {
    const v = (raw !== undefined ? raw : url).trim();
    if (!v) return;
    const ok = parseMediaUrl(v);
    if (!ok) { setErr("Lien non reconnu — colle un lien https:// (YouTube, Spotify, Vimeo, SoundCloud, Dailymotion, ou autre)."); return; }
    actions.addMedia(v);
    setUrl(""); setErr("");
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setUrl(text); setErr(""); inputRef.current && inputRef.current.focus(); }
    } catch (e) {
      setErr("Impossible de lire le presse-papiers — colle le lien manuellement (Ctrl/Cmd+V).");
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Vidéo / Musique</h1>
          <div className="sub">COLLE N'IMPORTE QUEL LIEN VIDÉO POUR L'ÉCOUTER EN RÉVISANT</div>
        </div>
      </div>

      <Card title="Lien" meta="YOUTUBE · SPOTIFY · VIMEO · SOUNDCLOUD · AUTRE">
        <div className="row gap-2">
          <input
            ref={inputRef}
            className="input"
            placeholder="Colle ton lien ici  —  ex. https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && play()}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (text && /^https?:\/\//.test(text.trim())) { setTimeout(() => play(text), 0); }
            }}
            style={{ flex: 1 }}
            autoFocus
          />
          <button className="btn ghost" onClick={pasteFromClipboard} title="Coller depuis le presse-papiers"><Icon name="plus" size={13}/>Coller</button>
          <button className="btn primary" onClick={() => play()}><Icon name="play" size={13}/>Lancer</button>
        </div>
        {err && <div style={{ color: "oklch(0.78 0.16 25)", fontSize: 12, marginTop: 8 }}>{err}</div>}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Card title="Lecture" meta={current ? current.title : "RIEN EN COURS"}>
          {current ? (
            <div style={{ position: "relative" }}>
              <MediaEmbed item={current} big/>
              <div className="row gap-2" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                <button className="btn sm ghost danger" onClick={() => { actions.setActiveMedia(null); actions.setPlayerOpen(false); }}>
                  <Icon name="x" size={12}/>Arrêter
                </button>
              </div>
            </div>
          ) : (
            <div className="muted center" style={{ height: 260, flexDirection: "column", gap: 10, textAlign: "center" }}>
              <Icon name="play" size={28}/>
              <div style={{ fontSize: 13 }}>Colle un lien ci-dessus et clique sur <b style={{ color: "var(--fg-1)" }}>Lancer</b>.<br/>La lecture continue même quand tu changes de page.</div>
            </div>
          )}
        </Card>
      </div>

      {library.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Card title="Historique" meta={`${library.length} lien${library.length>1?"s":""}`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {library.map((m) => (
                <div key={m.id} className="media-tile">
                  <div className="media-thumb" style={m.thumb ? { backgroundImage: `url(${m.thumb})` } : {}}>
                    {!m.thumb && <Icon name="play" size={18}/>}
                    <span className="media-kind-badge">{m.kind}</span>
                  </div>
                  <div className="media-title" title={m.title}>{m.title}</div>
                  <div className="row gap-2">
                    <button className="btn sm primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => actions.setActiveMedia(m.id)}>
                      <Icon name="play" size={12}/>Lire
                    </button>
                    <button className="btn sm icon ghost" aria-label="Retirer" onClick={() => actions.removeMedia(m.id)}><Icon name="trash" size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

function activeMedia(s) {
  return (s.media || []).find((m) => m.id === s.activeMediaId) || null;
}

const MediaEmbed = ({ item, compact, big }) => {
  // Click-to-play facade: the iframe is only created after a real user gesture.
  // This is what makes in-page playback reliable — YouTube refuses autoplay
  // (and often renders a black/error frame) when the page origin is null,
  // e.g. when the app is opened as a local file.
  const [live, setLive] = React.useState(false);
  React.useEffect(() => { setLive(false); }, [item && item.id]);

  if (!item) return null;
  let h = 200;
  if (item.kind === "spotify") h = (item.sType === "track" || item.sType === "episode") ? 152 : 352;
  else if (big) h = 420;
  if (compact) h = 80;

  // Spotify/SoundCloud embed fine without a gesture — show them straight away.
  const needsGesture = item.kind === "youtube" || item.kind === "vimeo" || item.kind === "dailymotion";
  const showPoster = needsGesture && !live;

  let src = item.embed;
  if (item.kind === "youtube") {
    src = src.replace("www.youtube.com", "www.youtube-nocookie.com");
    src += (src.includes("?") ? "&" : "?") + "playsinline=1" + (live ? "&autoplay=1" : "");
  } else if (live) {
    src += (src.includes("?") ? "&" : "?") + "autoplay=1";
  }

  return (
    <div>
      {showPoster ? (
        <button className="media-poster" style={{ height: h }} onClick={() => setLive(true)}>
          {item.thumb
            ? <img src={item.thumb} alt="" className="media-poster-thumb"/>
            : <span className="media-poster-thumb placeholder"/>}
          <span className="media-poster-overlay">
            <span className="media-poster-play"><Icon name="play" size={22}/></span>
            <span className="media-poster-title">{item.title}</span>
            <span className="media-poster-sub mono">LIRE ICI</span>
          </span>
        </button>
      ) : (
        <iframe
          title={item.title}
          src={src}
          style={{ width: "100%", height: h, border: "none", borderRadius: 10, background: "#000", display: "block" }}
          allow="autoplay; encrypted-media; clipboard-write; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
      {!compact && (
        <div className="row gap-2" style={{ marginTop: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{item.url || item.embed}</span>
          <a className="btn sm ghost" href={item.url || item.embed} target="_blank" rel="noopener noreferrer">
            Ne s'affiche pas ? Ouvrir dans un onglet ↗
          </a>
        </div>
      )}
    </div>
  );
};

/* ---------- Global docked player (always mounted in App) ---------- */
const DockedPlayer = () => {
  const s = useStore();
  const item = activeMedia(s);
  if (!item || !s.playerOpen) return null;

  return (
    <div className="docked-player">
      <div className="docked-head">
        <div className="row gap-2" style={{ minWidth: 0 }}>
          <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)", flexShrink: 0 }}/>
          <span className="docked-title">{item.title}</span>
        </div>
        <div className="row gap-2">
          <button className="btn sm icon ghost" title="Réduire" aria-label="Réduire le lecteur" onClick={() => actions.setPlayerOpen(false)}><Icon name="chevron-down" size={13}/></button>
          <button className="btn sm icon ghost" title="Arrêter" aria-label="Arrêter la lecture" onClick={() => { actions.setActiveMedia(null); actions.setPlayerOpen(false); }}><Icon name="x" size={13}/></button>
        </div>
      </div>
      <MediaEmbed item={item}/>
    </div>
  );
};

/* Minimized pill that re-opens the dock */
const PlayerPill = () => {
  const s = useStore();
  const item = activeMedia(s);
  if (!item || s.playerOpen) return null;
  return (
    <button className="player-pill" onClick={() => actions.setPlayerOpen(true)}>
      <span className="eq"><i/><i/><i/></span>
      <span className="player-pill-title">{item.title}</span>
      <Icon name="sound" size={13}/>
    </button>
  );
};

Object.assign(window, { MediaPage, DockedPlayer, PlayerPill, MediaEmbed, activeMedia });
