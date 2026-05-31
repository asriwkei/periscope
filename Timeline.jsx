/* Timeline.jsx — draggable/resizable timeline bars + column grid background. */

const { useRef, useState } = React;

// Background gridlines for a row's timeline cell (weekly or monthly columns).
function GridBg({ zoom, nowWeek }) {
  const weeks = window.TL.weeks;
  if (zoom === "monthly") {
    const groups = window.monthGroups();
    return (
      <div className="tl-grid" style={{ gridTemplateColumns: groups.map(g => g.weeks + "fr").join(" ") }}>
        {groups.map((g, i) => <div key={i} className="col" />)}
      </div>
    );
  }
  return (
    <div className="tl-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
      {Array.from({ length: weeks }).map((_, i) =>
        <div key={i} className={"col" + (i === nowWeek ? " now" : "")} />
      )}
    </div>
  );
}

function TimelineBar({ item, kind, onChange }) {
  const ref = useRef(null);
  const lastRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const weeks = window.TL.weeks;

  const leftPct = (item.start / weeks) * 100;
  const widthPct = ((item.end - item.start + 1) / weeks) * 100;
  const resizable = kind === "epic" || kind === "initiative";

  function trackRect() {
    const el = ref.current && ref.current.parentElement; // .tl-track
    return el ? el.getBoundingClientRect() : null;
  }
  function weekAtX(clientX) {
    const r = trackRect(); if (!r) return 0;
    return ((clientX - r.left) / r.width) * weeks;
  }

  function startDrag(mode, e) {
    if (!resizable) return;
    e.preventDefault(); e.stopPropagation();
    const startWF = weekAtX(e.clientX);
    const orig = { start: item.start, end: item.end };
    lastRef.current = { ...orig };
    setDrag(mode);
    document.body.style.cursor = mode === "move" ? "grabbing" : "col-resize";

    function move(ev) {
      const wf = weekAtX(ev.clientX);
      let next;
      if (mode === "left") {
        let s = Math.max(0, Math.min(Math.round(wf), orig.end));
        next = { start: s, end: orig.end };
      } else if (mode === "right") {
        let en = Math.max(orig.start, Math.min(Math.round(wf) - 1, weeks - 1));
        next = { start: orig.start, end: en };
      } else {
        const span = orig.end - orig.start;
        const delta = Math.round(wf - startWF);
        let s = Math.max(0, Math.min(orig.start + delta, weeks - 1 - span));
        next = { start: s, end: s + span };
      }
      const l = lastRef.current;
      if (!l || l.start !== next.start || l.end !== next.end) {
        lastRef.current = next;
        onChange(next);
      }
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      setDrag(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const cls = kind === "epic" ? "bar " + item.status : "bar init-bar";
  const hasDue = item.due != null;
  const duePct = hasDue ? ((item.due + 0.5) / weeks) * 100 : null;

  return (
    <React.Fragment>
      <div
        ref={ref}
        className={cls + (drag ? " dragging" : "")}
        style={{ left: leftPct + "%", width: widthPct + "%", cursor: resizable ? "grab" : "default" }}
        onPointerDown={resizable ? (e) => startDrag("move", e) : undefined}
      >
        {resizable && <div className="handle l" onPointerDown={(e) => { e.stopPropagation(); startDrag("left", e); }} />}
        {resizable && <div className="handle r" onPointerDown={(e) => { e.stopPropagation(); startDrag("right", e); }} />}
        {drag && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 7px)", left: "50%", transform: "translateX(-50%)",
            background: "var(--ink-1)", color: "#fff", fontSize: 11, fontWeight: 500,
            padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap", pointerEvents: "none",
            boxShadow: "var(--shadow-pop)", fontVariantNumeric: "tabular-nums",
          }}>
            {window.periodLabel(item.start, item.end)}
          </div>
        )}
      </div>
      {hasDue && (
        <div className="due-flag" style={{ left: duePct + "%" }} title={"Due: " + window.weekLabel(item.due)}>
          <Icon name="flag" size={13} />
        </div>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { GridBg, TimelineBar });
