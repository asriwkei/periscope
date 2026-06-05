/* Portfolio.jsx — initiative portfolio dashboard.
   Reactive filters drive the metric cards, the card list, the status breakdown,
   and the pie chart simultaneously. Data comes from the live `inits` (same source
   as the Initiative Details page); the "Team" cell shows the owning team's NAME
   (from the Capacity page), not individual people. Reuses shell tokens, the shared
   Icon primitive, the FilterDropdown from Overview.jsx, and the modal/pill classes. */

const { useState: useStateP } = React;

/* ---- status colour system, derived live from the user-configured status list
   (window.STATUSES). Soft/ink shades are computed from each status' base colour,
   so adding/editing/removing statuses in Settings flows through here. Order
   follows the configured list everywhere: legend, list, pie, filter. */
function pfStatuses() {
  return (window.STATUSES || []).map(s => ({
    id: s.id, label: s.label, color: s.color,
    soft: window.statusSoft(s.color), ink: window.statusInk(s.color),
  }));
}
function pfStatusBy(id) {
  const s = window.statusById(id);
  if (!s) return null;
  return { id: s.id, label: s.label, color: s.color, soft: window.statusSoft(s.color), ink: window.statusInk(s.color) };
}

/* ---- derive the target/status note from a live initiative ---- */
function pfNote(i) {
  if (i.status === "done") return { note: "Released", noteType: "done" };
  if (i.due) {
    const d = new Date(i.due + "T00:00:00");
    return { note: "Target " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), noteType: "target" };
  }
  return { note: "No target", noteType: "muted" };
}

/* ---- small pieces ---- */
function PfPill({ status }) {
  const s = pfStatusBy(status);
  if (!s) return null;
  return (
    <span className="pf-pill" style={{ background: s.soft, color: s.ink }}>
      <span className="dot" style={{ background: s.color }} />{s.label}
    </span>
  );
}

function Metric({ label, num, color }) {
  return (
    <div className="pf-metric">
      <div className="m-lbl">{color && <span className="m-dot" style={{ background: color }} />}{label}</div>
      <div className="m-num" style={color ? { color } : undefined}>{num}</div>
    </div>
  );
}

/* Team cell — shows the owning team's name + colour dot (not people). */
function PfTeam({ teamId, teams }) {
  const team = window.teamById(teams, teamId);
  if (!team) return <div className="pf-team empty">—</div>;
  return (
    <div className="pf-team">
      <span className="team-dot" style={{ background: team.color }} />{team.name}
    </div>
  );
}

/* ---- status pie chart ---- */
function piePath(cx, cy, r, a0, a1) {
  const p0 = (a0 - 90) * Math.PI / 180, p1 = (a1 - 90) * Math.PI / 180;
  const x0 = cx + r * Math.cos(p0), y0 = cy + r * Math.sin(p0);
  const x1 = cx + r * Math.cos(p1), y1 = cy + r * Math.sin(p1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

function PfPie({ counts }) {
  const segs = pfStatuses().map(s => ({ ...s, v: counts[s.id] })).filter(s => s.v > 0);
  const total = segs.reduce((a, s) => a + s.v, 0);
  const size = 184, r = 84, cx = 92, cy = 92;
  if (total === 0) return <div className="pf-pie-empty">No initiatives to chart</div>;
  let angle = 0;
  return (
    <div className="pf-pie-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segs.length === 1
          ? <circle cx={cx} cy={cy} r={r} fill={segs[0].color} stroke="var(--win)" strokeWidth="2" />
          : segs.map(s => {
              const start = angle, sweep = s.v / total * 360;
              angle += sweep;
              return <path key={s.id} d={piePath(cx, cy, r, start, start + sweep)}
                fill={s.color} stroke="var(--win)" strokeWidth="2" />;
            })}
      </svg>
    </div>
  );
}

function PfCard({ i, teams, onOpen }) {
  const n = i.epics ? i.epics.length : 0;
  const { note, noteType } = pfNote(i);
  const hasImpact = (i.estImpact || "").trim().length > 0;
  return (
    <button className="pf-card" onClick={onOpen}>
      <div className="pf-card-head">
        <div className="pf-card-id">
          <div className="pf-card-name">{i.name}</div>
          <div className="pf-card-area">{n} epic{n === 1 ? "" : "s"}</div>
        </div>
        <PfPill status={i.status} />
      </div>
      <div className="pf-card-desc">{(i.objective || "").trim() || "No objective set yet."}</div>
      <div className="pf-card-meta">
        <div className="pf-cell">
          <div className="c-lbl">Impact area</div>
          <div className={"c-val" + (i.impactType ? "" : " impact-none")}>{i.impactType || "—"}</div>
        </div>
        <div className="pf-cell">
          <div className="c-lbl">Est. impact</div>
          <div className={"c-val" + (hasImpact ? "" : " impact-none")}>{hasImpact ? i.estImpact : "TBD"}</div>
        </div>
        <div className="pf-cell">
          <div className="c-lbl">Team</div>
          <PfTeam teamId={i.teamId} teams={teams} />
        </div>
        <span className={"pf-foot-note" + (noteType !== "target" ? " " + noteType : "")}>{note}</span>
      </div>
    </button>
  );
}

/* ---- kanban: one column per configured status, in order ---- */
function PfKCard({ i, teams, onOpen }) {
  const n = i.epics ? i.epics.length : 0;
  const { note, noteType } = pfNote(i);
  const hasImpact = (i.estImpact || "").trim().length > 0;
  const team = window.teamById(teams, i.teamId);
  return (
    <button className="pf-kcard" onClick={onOpen}>
      <div className="pf-kcard-name">{i.name}</div>
      <div className="pf-kcard-area">{n} epic{n === 1 ? "" : "s"}</div>
      <div className="pf-kcard-foot">
        <span className={"pf-kcard-impact" + (hasImpact ? "" : " none")}>{hasImpact ? i.estImpact : "TBD"}</span>
        {team ? <span className="pf-kcard-team"><span className="team-dot" style={{ background: team.color }} />{team.name}</span> : null}
      </div>
      <div className={"pf-kcard-target" + (noteType !== "target" ? " " + noteType : "")}>{note}</div>
    </button>
  );
}

function PfKanban({ filtered, teams, onOpenInitiative }) {
  const statuses = pfStatuses();
  return (
    <div className="pf-board">
      {statuses.map(s => {
        const items = filtered.filter(p => p.status === s.id);
        return (
          <div key={s.id} className="pf-col" style={{ borderTopColor: s.color }}>
            <div className="pf-col-head">
              <div className="pf-col-id">
                <span className="pf-col-dot" style={{ background: s.color }} />
                <span className="pf-col-title">{s.label}</span>
              </div>
              <span className="pf-col-badge">{items.length}</span>
            </div>
            <div className="pf-col-body">
              {items.length === 0
                ? <div className="pf-col-empty">No items</div>
                : items.map(p => <PfKCard key={p.id} i={p} teams={teams} onOpen={() => onOpenInitiative(p.id)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PfSidebar({ counts }) {
  return (
    <div className="pf-side">
      <div className="pf-side-h">Status breakdown</div>
      <div className="pf-status-list">
        {pfStatuses().map(s => (
          <div key={s.id} className={"pf-status-row" + (counts[s.id] ? "" : " zero")}>
            <span className="s-dot" style={{ background: s.color }} />
            <span className="s-lbl">{s.label}</span>
            <span className="s-cnt">{counts[s.id]}</span>
          </div>
        ))}
      </div>
      <div className="pf-chart">
        <div className="pf-side-h">By status</div>
        <PfPie counts={counts} />
      </div>
    </div>
  );
}

/* ---- page ---- */
function PortfolioPage({ inits, teams, onOpenInitiative }) {
  const [initF, setInitF] = useStateP([]);
  const [statF, setStatF] = useStateP([]);
  const [areaF, setAreaF] = useStateP([]);
  const [view, setView] = useStateP("list");

  const list = inits || [];
  const areas = [...new Set(list.map(p => p.impactType).filter(Boolean))];
  const filtered = list.filter(p =>
    (initF.length === 0 || initF.includes(p.id)) &&
    (statF.length === 0 || statF.includes(p.status)) &&
    (areaF.length === 0 || areaF.includes(p.impactType)));

  const statuses = pfStatuses();
  const counts = {};
  statuses.forEach(s => { counts[s.id] = 0; });
  filtered.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
  const anyFilter = initF.length || statF.length || areaF.length;
  // metric cards: Total + the first three configured statuses (dynamic)
  const metricStatuses = statuses.slice(0, 3);

  return (
    <div className="portfolio">
      <div className="pf-health">
        <Metric label="Total initiatives" num={filtered.length} />
        {metricStatuses.map(s => (
          <Metric key={s.id} label={s.label} num={counts[s.id] || 0} color={s.color} />
        ))}
      </div>

      <div className="pf-filterbar">
        <span className="fbar-lbl">Filter</span>
        <FilterDropdown label="Initiative" items={list.map(p => ({ id: p.id, name: p.name }))} value={initF} setValue={setInitF} />
        <FilterDropdown label="Status" items={statuses.map(s => ({ id: s.id, name: s.label, color: s.color }))} value={statF} setValue={setStatF} />
        <FilterDropdown label="Impact area" items={areas.map(a => ({ id: a, name: a }))} value={areaF} setValue={setAreaF} />
        {anyFilter ? (
          <button className="pf-clear-all" onClick={() => { setInitF([]); setStatF([]); setAreaF([]); }}>Clear all</button>
        ) : null}
        <div className="pf-viewtoggle">
          <button className={"pf-view-btn" + (view === "list" ? " on" : "")} onClick={() => setView("list")}>List</button>
          <button className={"pf-view-btn" + (view === "kanban" ? " on" : "")} onClick={() => setView("kanban")}>Kanban</button>
        </div>
      </div>

      {view === "list" ? (
        <div className="pf-body">
          <div className="pf-cards">
            {filtered.length === 0
              ? <div className="pf-empty"><b>No initiatives match</b>Try clearing a filter to see more.</div>
              : filtered.map(p => <PfCard key={p.id} i={p} teams={teams} onOpen={() => onOpenInitiative(p.id)} />)}
          </div>
          <PfSidebar counts={counts} />
        </div>
      ) : (
        <PfKanban filtered={filtered} teams={teams} onOpenInitiative={onOpenInitiative} />
      )}
    </div>
  );
}

Object.assign(window, { PortfolioPage });
