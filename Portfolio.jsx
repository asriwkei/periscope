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

/* ---- executive detail modal (view + inline edit) ----
   Bound to the LIVE initiative object: saving calls onSave(id, patch) which
   updates the shared `inits` source, so edits propagate to the Roadmap page
   (timeline bars, initiative-detail completed/next/discussion), the cards,
   metric tiles, status breakdown, pie chart, and filters simultaneously. */
function ExecPanel({ kind, title, items, marker, emptyText, full }) {
  const list = items || [];
  return (
    <div className={"exec-panel " + kind + (full ? " full" : "")}>
      <div className="exec-panel-h">
        {title}
        <span className="eph-count">{list.length}</span>
      </div>
      <div className="exec-panel-body">
        {list.length ? (
          <ul>
            {list.map((c, i) => (
              <li key={i}>
                <span className={"emk" + (marker.icon ? "" : " glyph")}>
                  {marker.icon ? <Icon name="check" size={14} /> : marker.glyph}
                </span>{c}
              </li>
            ))}
          </ul>
        ) : <div className="exec-empty">{emptyText}</div>}
      </div>
    </div>
  );
}

function pfStatusOpts() {
  return (window.STATUSES || []).map(s => ({ v: s.id, l: s.label }));
}

function buildPfForm(p) {
  return {
    name: p.name || "",
    status: p.status || "",
    objective: p.objective || "",
    impactType: p.impactType || "",
    estImpact: p.estImpact || "",
    teamId: p.teamId || "",
    due: p.due || "",
    completedText: (p.completed || []).join("\n"),
    nextText: (p.next || []).join("\n"),
    discussionText: (p.discussion || []).join("\n"),
  };
}

function PortfolioModal({ p, teams, onClose, onSave }) {
  const [mode, setMode] = useStateP("view");
  const [form, setForm] = useStateP(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function enterEdit() { setForm(buildPfForm(p)); setMode("edit"); }
  function save() {
    onSave(p.id, {
      name: form.name.trim() || p.name,
      status: form.status,
      objective: form.objective.trim(),
      impactType: form.impactType.trim(),
      estImpact: form.estImpact.trim(),
      teamId: form.teamId,
      due: form.due,
      completed: form.completedText.split("\n").map(s => s.trim()).filter(Boolean),
      next: form.nextText.split("\n").map(s => s.trim()).filter(Boolean),
      discussion: form.discussionText.split("\n").map(s => s.trim()).filter(Boolean),
    });
    setMode("view");
  }

  const n = p.epics ? p.epics.length : 0;
  const { note, noteType } = pfNote(p);
  const targetTone = noteType === "done" ? "tone-done" : noteType === "muted" ? "tone-muted" : "";
  const hasImpact = (p.estImpact || "").trim().length > 0;
  const teamList = teams || [];

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal exec">
        <div className="modal-head">
          <div className="mh-main">
            {mode === "edit"
              ? <input className="input" style={{ fontSize: 18, fontWeight: 500 }} value={form.name} onChange={(e) => set("name", e.target.value)} />
              : <div className="modal-title">{p.name}</div>}
            <div className="modal-sub">
              <span className="asg-sub">{n} epic{n === 1 ? "" : "s"}</span>
              <PfPill status={mode === "edit" ? form.status : p.status} />
            </div>
          </div>
          <div className="exec-head-actions">
            {mode === "view" && (
              <button className="exec-edit-btn" onClick={enterEdit}><Icon name="edit" size={13} />Edit</button>
            )}
            <button className="modal-x" onClick={onClose}><Icon name="x" size={14} /></button>
          </div>
        </div>

        <div className="modal-body">
          {mode === "view" ? (
            <React.Fragment>
              <p className="exec-desc">{(p.objective || "").trim() || "No objective set yet."}</p>

              <div className="exec-strip">
                <div className="exec-stat">
                  <div className="es-lbl">Impact area</div>
                  <div className={"es-val" + (p.impactType ? "" : " impact-none")}>{p.impactType || "—"}</div>
                </div>
                <div className="exec-stat">
                  <div className="es-lbl">Estimated impact</div>
                  <div className={"es-val" + (hasImpact ? "" : " impact-none")}>{hasImpact ? p.estImpact : "TBD"}</div>
                </div>
                <div className="exec-stat">
                  <div className="es-lbl">Target release</div>
                  <div className={"es-val " + targetTone}>{note}</div>
                </div>
                <div className="exec-stat">
                  <div className="es-lbl">Team</div>
                  <PfTeam teamId={p.teamId} teams={teams} />
                </div>
              </div>

              <div className="exec-cols">
                <ExecPanel kind="completed" title="Completed" items={p.completed}
                  marker={{ icon: true }} emptyText="Nothing logged yet." />
                <ExecPanel kind="next" title="Next steps" items={p.next}
                  marker={{ glyph: "→" }} emptyText="Nothing planned yet." />
              </div>
              <ExecPanel kind="disc" title="Discussion points" items={p.discussion}
                marker={{ glyph: "•" }} emptyText="No open questions." full />
            </React.Fragment>
          ) : (
            <div className="exec-form">
              <div className="row2" style={{ marginTop: 14 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Impact area</label>
                  <input className="input" value={form.impactType} onChange={(e) => set("impactType", e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Status</label>
                  <select className="select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="">No status</option>
                    {pfStatusOpts().map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="textarea" style={{ minHeight: 60 }} value={form.objective} onChange={(e) => set("objective", e.target.value)} />
              </div>
              <div className="row2">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Estimated impact</label>
                  <input className="input" placeholder="e.g. +8% conversion" value={form.estImpact} onChange={(e) => set("estImpact", e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Team</label>
                  <select className="select" value={form.teamId} onChange={(e) => set("teamId", e.target.value)}>
                    <option value="">Unassigned</option>
                    {teamList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Target release date</label>
                <input className="input" type="date" value={form.due} onChange={(e) => set("due", e.target.value)} />
              </div>
              <div className="field">
                <label>Completed — one per line</label>
                <textarea className="textarea" value={form.completedText} onChange={(e) => set("completedText", e.target.value)} />
              </div>
              <div className="field">
                <label>Next steps — one per line</label>
                <textarea className="textarea" value={form.nextText} onChange={(e) => set("nextText", e.target.value)} />
              </div>
              <div className="field">
                <label>Discussion points — one per line</label>
                <textarea className="textarea" value={form.discussionText} onChange={(e) => set("discussionText", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {mode === "view" ? (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={enterEdit}><Icon name="edit" size={14} />Edit overview</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setMode("view")}>Cancel</button>
              <button className="btn btn-primary" onClick={save}><Icon name="check" size={14} />Save changes</button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- page ---- */
function PortfolioPage({ inits, teams, onSaveInitiative }) {
  const [initF, setInitF] = useStateP([]);
  const [statF, setStatF] = useStateP([]);
  const [areaF, setAreaF] = useStateP([]);
  const [view, setView] = useStateP("list");
  const [openId, setOpenId] = useStateP(null);

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
  const openItem = list.find(p => p.id === openId) || null;

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
              : filtered.map(p => <PfCard key={p.id} i={p} teams={teams} onOpen={() => setOpenId(p.id)} />)}
          </div>
          <PfSidebar counts={counts} />
        </div>
      ) : (
        <PfKanban filtered={filtered} teams={teams} onOpenInitiative={setOpenId} />
      )}

      {openItem && (
        <PortfolioModal p={openItem} teams={teams}
          onClose={() => setOpenId(null)} onSave={onSaveInitiative} />
      )}
    </div>
  );
}

Object.assign(window, { PortfolioPage });
