/* Modals.jsx — StatusModal (view + inline edit), AddEpicModal, DeleteConfirm. */

const { useState: useStateM } = React;

const STATUS_OPTS = [
  { v: "todo", l: "To Do" },
  { v: "on-track", l: "On track" },
  { v: "at-risk", l: "Needs attention" },
  { v: "blocked", l: "Blocked" },
  { v: "done", l: "Done" },
];

// Format a local Date as YYYY-MM-DD (avoids UTC timezone shift from toISOString)
function localISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
// ISO string for Monday of week i (used for defaults in Add modals)
function weekToISO(weekIdx) {
  return localISO(window.weekMonday(weekIdx));
}

// Plain date picker — start/end are now ISO date strings, no week snapping.
function DateSelect({ value, onChange }) {
  const minISO = weekToISO(0);
  const maxISO = weekToISO(window.TL.weeks - 1);
  return (
    <input
      className="input"
      type="date"
      min={minISO}
      max={maxISO}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function AssigneesToggle({ value, onChange }) {
  const set = new Set(value);
  return (
    <div className="toggle-list" style={{ maxHeight: 168 }}>
      {window.TEAM.map(p => {
        const on = set.has(p.id);
        return (
          <button key={p.id} type="button" className={"asg-item" + (on ? " on" : "")}
            onClick={() => {
              const n = new Set(set);
              on ? n.delete(p.id) : n.add(p.id);
              onChange([...n]);
            }}>
            <Avatar person={p} size={26} />
            <span className="asg-meta">
              <div className="asg-name">{p.name}</div>
              <div className="asg-sub">{p.role}</div>
            </span>
            <span className="asg-check"><Icon name="check" size={11} /></span>
          </button>
        );
      })}
    </div>
  );
}

function buildForm(item) {
  return {
    name: item.name,
    status: item.status,
    objective: item.objective || "",
    start: item.start,
    end: item.end,
    assignees: [...(item.assignees || [])],
    completedText: (item.completed || []).join("\n"),
    nextText: (item.next || []).join("\n"),
    discussionText: (item.discussion || []).join("\n"),
    docs: (item.docs || []).map(d => ({ ...d })),
    due: item.due || "",
    ticketUrl: item.ticketUrl || "",
  };
}

function StatusModal({ item, kind, startInEdit, onClose, onSave }) {
  const [mode, setMode] = useStateM(startInEdit ? "edit" : "view");
  const [form, setForm] = useStateM(startInEdit ? buildForm(item) : null);
  const isEpic = kind === "epic";

  function enterEdit() {
    setForm(buildForm(item));
    setMode("edit");
  }
  function save() {
    const [s, e] = form.start <= form.end ? [form.start, form.end] : [form.end, form.start];
    const upd = {
      name: form.name.trim() || item.name,
      status: form.status,
      objective: form.objective.trim(),
      start: s,
      end: e,
      completed: form.completedText.split("\n").map(s => s.trim()).filter(Boolean),
      next: form.nextText.split("\n").map(s => s.trim()).filter(Boolean),
      discussion: form.discussionText.split("\n").map(s => s.trim()).filter(Boolean),
      docs: form.docs.map(d => ({ ...d, label: d.label.trim() })).filter(d => d.label),
      due: form.due || null,
    };
    if (isEpic) { upd.assignees = form.assignees; upd.ticketUrl = form.ticketUrl.trim(); }
    onSave(upd);
    setMode("view");
  }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const completed = item.completed || [];
  const next = item.next || [];
  const discussion = item.discussion || [];
  const docs = item.docs || [];

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal wide">
        <div className="modal-head">
          <div className="mh-main">
            {mode === "edit"
              ? <input className="input" style={{ fontSize: 16, fontWeight: 500 }} value={form.name} onChange={(e) => set("name", e.target.value)} />
              : <div className="modal-title">{item.name}</div>}
            <div className="modal-sub">
              {isEpic && (
                <a className="ticket" href="#" onClick={(e) => { e.preventDefault(); window.openUrl(item.ticketUrl); }} style={{ opacity: item.ticketUrl ? 1 : 0.5 }}>
                  <Icon name="external" size={11} />{item.ticket}
                </a>
              )}
              <Pill status={mode === "edit" ? form.status : item.status} isStatic />
            </div>
          </div>
          <button className="modal-x" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        <div className="modal-body">
          {mode === "view" ? (
            <React.Fragment>
              {item.objective && (
                <div className="sec">
                  <div className="sec-h">Objective</div>
                  <div className="objective-view">{item.objective}</div>
                </div>
              )}
              <div className="sec">
                <div className="sec-h">Completed items</div>
                {completed.length ? (
                  <ul>{completed.map((c, i) => <li key={i}><span className="mk"><Icon name="check" size={14} /></span>{c}</li>)}</ul>
                ) : <div className="cd-empty" style={{ padding: 0 }}>Nothing logged yet.</div>}
              </div>
              <div className="sec">
                <div className="sec-h">Next steps</div>
                {next.length ? (
                  <ul>{next.map((c, i) => <li key={i} className="next"><span className="mk">→</span>{c}</li>)}</ul>
                ) : <div className="cd-empty" style={{ padding: 0 }}>Nothing planned yet.</div>}
              </div>
              <div className="sec">
                <div className="sec-h">Discussion points</div>
                {discussion.length ? (
                  <ul>{discussion.map((c, i) => <li key={i} className="disc"><span className="mk">•</span>{c}</li>)}</ul>
                ) : <div className="cd-empty" style={{ padding: 0 }}>No open questions.</div>}
              </div>
              <div className="sec">
                <div className="sec-h">Documentation</div>
                <div className="doc-links">
                  {docs.map((d, i) => (
                    <a key={i} className="doc-link" href="#" onClick={(e) => { e.preventDefault(); window.openUrl(d.url); }}>
                      <Icon name="link" size={13} />{d.label}
                    </a>
                  ))}
                </div>
              </div>
              {item.due && (
                <div className="sec">
                  <div className="sec-h">Due date</div>
                  <div className="due-view"><Icon name="flag" size={14} />{new Date(item.due + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                </div>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="field" style={{ marginTop: 14 }}>
                <label>Status</label>
                <select className="select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Objective</label>
                <textarea className="textarea" rows={3} placeholder="What does success look like for this?" value={form.objective} onChange={(e) => set("objective", e.target.value)} />
              </div>
              <div className="row2">
                <div className="field"><label>Timeline start</label><DateSelect value={form.start} onChange={(v) => set("start", v)} /></div>
                <div className="field"><label>Timeline end</label><DateSelect value={form.end} onChange={(v) => set("end", v)} /></div>
              </div>
              <div className="field">
                <label>Due date (shows flag on timeline)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input className="input" type="date" value={form.due} onChange={(e) => set("due", e.target.value)} style={{ flex: 1 }} />
                  {form.due && (
                    <button type="button" onClick={() => set("due", "")}
                      style={{ flexShrink: 0, border: "none", background: "none", cursor: "pointer", color: "var(--ink-3)", padding: "4px", borderRadius: 4, display: "flex", alignItems: "center" }}
                      title="Remove due date">
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>
              </div>
              {isEpic && (
                <div className="field">
                  <label>Ticket URL</label>
                  <input className="input" type="url" placeholder="https://linear.app/..." value={form.ticketUrl} onChange={(e) => set("ticketUrl", e.target.value)} />
                </div>
              )}
              {isEpic && (
                <div className="field">
                  <label>Assignees</label>
                  <AssigneesToggle value={form.assignees} onChange={(v) => set("assignees", v)} />
                </div>
              )}
              <div className="field">
                <label>Completed items — one per line</label>
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
              <div className="field" style={{ marginBottom: 4 }}>
                <label>Documentation links</label>
                <div className="doc-edit">
                  {form.docs.map((d, i) => (
                    <div className="doc-edit-row" key={i}>
                      <span className="doc-edit-ic"><Icon name="link" size={13} /></span>
                      <input
                        className="input" placeholder="Label (e.g. Design spec)"
                        value={d.label}
                        onChange={(e) => set("docs", form.docs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      />
                      <input
                        className="input" placeholder="URL (e.g. https://...)"
                        value={d.url || ""}
                        onChange={(e) => set("docs", form.docs.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                      />
                      <button type="button" className="doc-edit-del" aria-label="Remove link"
                        onClick={() => set("docs", form.docs.filter((_, j) => j !== i))}>
                        <Icon name="x" size={13} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="doc-edit-add"
                    onClick={() => set("docs", [...form.docs, { label: "", kind: "Doc" }])}>
                    <Icon name="plus" size={13} />Add link
                  </button>
                </div>
              </div>
            </React.Fragment>
          )}
        </div>

        <div className="modal-foot">
          {mode === "view" ? (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={enterEdit}><Icon name="edit" size={14} />Edit</button>
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

function AddEpicModal({ initiative, onClose, onCreate }) {
  const [f, setF] = useStateM({ name: "", ticket: "", start: weekToISO(0), end: weekToISO(2), status: "on-track", assignees: [] });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim().length > 0;

  function create() {
    if (!valid) return;
    const [s, e] = f.start <= f.end ? [f.start, f.end] : [f.end, f.start];
    onCreate({
      id: "e" + Date.now(),
      name: f.name.trim(),
      ticket: f.ticket.trim() || "NEW-000",
      status: f.status,
      start: s,
      end: e,
      assignees: f.assignees,
      completed: [], next: [], discussion: [],
      docs: [{ label: "PRD", kind: "PRD" }],
    });
  }

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <div className="mh-main">
            <div className="modal-title">New epic</div>
            <div className="modal-sub"><span className="asg-sub">in {initiative.name}</span></div>
          </div>
          <button className="modal-x" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="field" style={{ marginTop: 14 }}>
            <label>Epic name</label>
            <input className="input" autoFocus placeholder="e.g. Session timeout handling" value={f.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="row2">
            <div className="field"><label>Ticket ID</label><input className="input" placeholder="AUTH-000" value={f.ticket} onChange={(e) => set("ticket", e.target.value)} /></div>
            <div className="field">
              <label>Status</label>
              <select className="select" value={f.status} onChange={(e) => set("status", e.target.value)}>
                {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>
          <div className="row2">
            <div className="field"><label>Timeline start</label><DateSelect value={f.start} onChange={(v) => set("start", v)} /></div>
            <div className="field"><label>Timeline end</label><DateSelect value={f.end} onChange={(v) => set("end", v)} /></div>
          </div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Assignees</label>
            <AssigneesToggle value={f.assignees} onChange={(v) => set("assignees", v)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} style={!valid ? { opacity: 0.5, cursor: "default" } : undefined} onClick={create}>
            <Icon name="plus" size={14} />Add epic
          </button>
        </div>
      </div>
    </div>
  );
}

function AddInitiativeModal({ onClose, onCreate }) {
  const [f, setF] = useStateM({ name: "", status: "on-track", start: weekToISO(0), end: weekToISO(6) });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim().length > 0;

  function create() {
    if (!valid) return;
    const [s, e] = f.start <= f.end ? [f.start, f.end] : [f.end, f.start];
    onCreate({
      id: "init" + Date.now(),
      name: f.name.trim(),
      status: f.status,
      start: s,
      end: e,
      open: true,
      completed: [], next: [], discussion: [],
      docs: [{ label: "Initiative brief", kind: "Doc" }],
      epics: [],
    });
  }

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <div className="mh-main">
            <div className="modal-title">New initiative</div>
            <div className="modal-sub"><span className="asg-sub">Add epics once it’s created</span></div>
          </div>
          <button className="modal-x" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="field" style={{ marginTop: 14 }}>
            <label>Initiative name</label>
            <input className="input" autoFocus placeholder="e.g. Mobile app parity" value={f.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" value={f.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="row2" style={{ marginBottom: 4 }}>
            <div className="field" style={{ marginBottom: 0 }}><label>Timeline start</label><DateSelect value={f.start} onChange={(v) => set("start", v)} /></div>
            <div className="field" style={{ marginBottom: 0 }}><label>Timeline end</label><DateSelect value={f.end} onChange={(v) => set("end", v)} /></div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} style={!valid ? { opacity: 0.5, cursor: "default" } : undefined} onClick={create}>
            <Icon name="plus" size={14} />Add initiative
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ target, onCancel, onConfirm }) {
  const isInit = target.kind === "init";
  const isPerson = target.kind === "person";
  const noun = isInit ? "initiative" : isPerson ? "person" : "epic";
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="mh-main"><div className="modal-title">{isPerson ? "Remove person" : isInit ? "Delete initiative" : "Delete epic"}</div></div>
          <button className="modal-x" onClick={onCancel}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body" style={{ paddingTop: 16 }}>
          <div className="warn-box">
            <Icon name="alert" size={20} />
            <div className="wt">
              {isInit && (
                <React.Fragment>Deleting <b>{target.name}</b> will also remove all <b>{target.childCount} child epic{target.childCount === 1 ? "" : "s"}</b> beneath it. This can’t be undone.</React.Fragment>
              )}
              {isPerson && (
                <React.Fragment>Removing <b>{target.name}</b> will unassign them from <b>{target.epicCount} epic{target.epicCount === 1 ? "" : "s"}</b>. This can’t be undone.</React.Fragment>
              )}
              {!isInit && !isPerson && (
                <React.Fragment>Delete <b>{target.name}</b>? This can’t be undone.</React.Fragment>
              )}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}><Icon name="trash" size={14} />{isPerson ? "Remove person" : isInit ? "Delete initiative" : "Delete epic"}</button>
        </div>
      </div>
    </div>
  );
}

function PersonModal({ mode, person, onClose, onSave }) {
  const [f, setF] = useStateM({ name: person ? person.name : "", role: person ? person.role : "" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim().length > 0;
  const isAdd = mode === "add";
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="mh-main">
            <div className="modal-title">{isAdd ? "Add person" : "Edit person"}</div>
          </div>
          <button className="modal-x" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="field" style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
            <span className="avatar" style={{ background: person ? person.color : "var(--ink-3)", "--sz": "46px", flexShrink: 0 }}>
              {window.makeInitials(f.name || "?")}
            </span>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "10.5px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 7 }}>Name</label>
              <input className="input" autoFocus placeholder="e.g. Jordan Lee" value={f.name} onChange={(e) => set("name", e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Role</label>
            <input className="input" placeholder="e.g. Backend engineer" value={f.role} onChange={(e) => set("role", e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} style={!valid ? { opacity: 0.5, cursor: "default" } : undefined} onClick={() => onSave(f)}>
            <Icon name={isAdd ? "plus" : "check"} size={14} />{isAdd ? "Add person" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StatusModal, AddEpicModal, AddInitiativeModal, PersonModal, DeleteConfirm });
