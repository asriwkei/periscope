/* Timeline.jsx — draggable/resizable timeline bars + column grid background. */

const { useRef, useState } = React;

// GridBg renders column separators + now-week highlight inside cell-timeline.
// Column widths are fixed pixels (window.COL_W per week) so they line up
// exactly with the header cells and the bars.
function GridBg({ zoom, nowWeek }) {
  const weeks = window.TL.weeks;
  const COL_W = window.COL_W;
  if (zoom === "monthly") {
    const groups = window.monthGroups();
    return (
      <div className="tl-grid" style={{ gridTemplateColumns: groups.map(g => (g.weeks * COL_W) + "px").join(" ") }}>
        {groups.map((g, i) => <div key={i} className="col" />)}
      </div>
    );
  }
  return (
    <div className="tl-grid" style={{ gridTemplateColumns: `repeat(${weeks}, ${COL_W}px)` }}>
      {Array.from({ length: weeks }).map((_, i) =>
        <div key={i} className={"col" + (i === nowWeek ? " now" : "")} />
      )}
    </div>
  );
}

function tlBgStyle() { return {}; }

// Convert ISO date string to number of days from TL start (may be negative/out-of-range)
function isoToDay(iso) {
  const start = new Date(window.TL.startISO + "T00:00:00");
  const d = new Date(iso + "T00:00:00");
  return Math.round((d - start) / (24 * 60 * 60 * 1000));
}
// Convert day offset back to ISO date string (local-time safe)
function dayToISO(days) {
  const d = new Date(window.TL.startISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function TimelineBar({ item, kind, onChange }) {
  const ref = useRef(null);
  const lastRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const totalDays = window.TL.weeks * 7;
  const dayW = window.COL_W / 7;   // pixels per day (shared column-width derived)

  const startDay = isoToDay(item.start);
  const endDay   = isoToDay(item.end);
  const leftPx   = startDay * dayW;
  const widthPx  = (endDay - startDay + 1) * dayW;
  const resizable = kind === "epic" || kind === "initiative";

  function trackRect() {
    const el = ref.current && ref.current.parentElement; // .tl-track
    return el ? el.getBoundingClientRect() : null;
  }
  function dayAtX(clientX) {
    const r = trackRect(); if (!r) return 0;
    return ((clientX - r.left) / r.width) * totalDays;
  }

  function startDrag(mode, e) {
    if (!resizable) return;
    e.preventDefault(); e.stopPropagation();
    const startDF = dayAtX(e.clientX);
    const origStartDay = isoToDay(item.start);
    const origEndDay   = isoToDay(item.end);
    const orig = { start: item.start, end: item.end };
    lastRef.current = { ...orig };
    setDrag(mode);
    document.body.style.cursor = mode === "move" ? "grabbing" : "col-resize";

    function move(ev) {
      const df = dayAtX(ev.clientX);
      let next;
      if (mode === "left") {
        const s = Math.max(0, Math.min(Math.round(df), origEndDay));
        next = { start: dayToISO(s), end: orig.end };
      } else if (mode === "right") {
        const en = Math.max(origStartDay, Math.min(Math.round(df) - 1, totalDays - 1));
        next = { start: orig.start, end: dayToISO(en) };
      } else {
        const span = origEndDay - origStartDay;
        const delta = Math.round(df - startDF);
        const s = Math.max(0, Math.min(origStartDay + delta, totalDays - 1 - span));
        next = { start: dayToISO(s), end: dayToISO(s + span) };
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
  const hasDue = !!item.due;
  const dueLeftPx = hasDue ? Math.max(0, Math.min(totalDays, isoToDay(item.due))) * dayW : null;

  return (
    <React.Fragment>
      <div
        ref={ref}
        className={cls + (drag ? " dragging" : "")}
        style={{ left: leftPx + "px", width: widthPx + "px", cursor: resizable ? "grab" : "default" }}
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
        <div className="due-flag" style={{ left: dueLeftPx + "px" }} title={"Due: " + window.weekLabel(item.due)}>
          <Icon name="flag" size={13} />
        </div>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { GridBg, TimelineBar, tlBgStyle });
