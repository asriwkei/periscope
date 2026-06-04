/* Popovers.jsx — ContextMenu, AssigneePicker, WeekTooltip + anchored-popover layer. */

function anchorPos(rect, w, opts = {}) {
  const m = 8;
  let left = opts.alignRight ? rect.right - w : rect.left;
  let top = (opts.above ? rect.top - (opts.h || 0) - 6 : rect.bottom + 6);
  left = Math.max(m, Math.min(left, window.innerWidth - w - m));
  if (opts.h) top = Math.max(m, Math.min(top, window.innerHeight - opts.h - m));
  return { left, top };
}

function PopLayer({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={onClose}>
      {children}
    </div>
  );
}

function ContextMenu({ rect, kind, onEdit, onDelete, onClose }) {
  const w = 176;
  const pos = anchorPos(rect, w);
  const noun = kind === "init" ? "initiative" : "epic";
  return (
    <PopLayer onClose={onClose}>
      <div className="pop ctx" style={{ left: pos.left, top: pos.top, width: w }} onClick={(e) => e.stopPropagation()}>
        <button className="ctx-item" onClick={() => { onEdit(); onClose(); }}>
          <Icon name="edit" size={14} />{`Edit ${noun}`}
        </button>
        <div className="ctx-div" />
        <button className="ctx-item danger" onClick={() => { onDelete(); onClose(); }}>
          <Icon name="trash" size={14} />{`Delete ${noun}`}
        </button>
      </div>
    </PopLayer>
  );
}

function AssigneePicker({ rect, epic, allEpics, onToggle, onClose }) {
  const w = 268;
  const pos = anchorPos(rect, w, { h: 320 });
  const assignedSet = new Set(epic.assignees);
  // count epics each person is on, across the whole roadmap
  const counts = {};
  allEpics.forEach(e => e.assignees.forEach(pid => { counts[pid] = (counts[pid] || 0) + 1; }));

  return (
    <PopLayer onClose={onClose}>
      <div className="pop asg" style={{ left: pos.left, top: pos.top, width: w }} onClick={(e) => e.stopPropagation()}>
        <div className="asg-head">Assign people</div>
        <div className="toggle-list">
          {window.TEAM.map(p => {
            const on = assignedSet.has(p.id);
            const others = (counts[p.id] || 0) - (on ? 1 : 0);
            const sub = others > 0 ? `${p.role} · ${others} other epic${others > 1 ? "s" : ""}` : p.role;
            return (
              <button key={p.id} className={"asg-item" + (on ? " on" : "")} onClick={() => onToggle(p.id)}>
                <Avatar person={p} size={28} />
                <span className="asg-meta">
                  <div className="asg-name">{p.name}</div>
                  <div className="asg-sub">{sub}</div>
                </span>
                <span className="asg-check"><Icon name="check" size={11} /></span>
              </button>
            );
          })}
        </div>
      </div>
    </PopLayer>
  );
}

function WeekTooltip({ rect, week, epics }) {
  const w = 200;
  const left = Math.max(8, Math.min(rect.left + rect.width / 2 - w / 2, window.innerWidth - w - 8));
  const top = rect.bottom + 8;
  const byId = Object.fromEntries(window.TEAM.map(p => [p.id, p]));
  const rows = [];
  epics.forEach(e => {
    if (e.start <= week && week <= e.end) {
      e.assignees.forEach(pid => rows.push({ person: byId[pid], epic: e.name }));
    }
  });
  return (
    <div className="wk-tip" style={{ left, top, width: w }}>
      <div className="tt-h">{window.weekLabel(week)} · week {week + 1}</div>
      {rows.length === 0 && <div className="tt-empty">No one assigned this week</div>}
      {rows.map((r, i) => (
        <div className="tt-row" key={i}>
          <Avatar person={r.person} size={18} />
          <div style={{ minWidth: 0 }}>
            <div className="tt-name">{r.person.name}</div>
            <div className="tt-epic" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.epic}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddMemberPopover({ rect, team, people, memberships, onAdd, onCreateNew, onClose }) {
  const w = 268;
  const pos = anchorPos(rect, w, { h: 360 });
  const [role, setRole] = React.useState("");
  const onTeam = new Set((memberships || []).filter(m => m.teamId === team.id).map(m => m.personId));
  const avail = (people || []).filter(p => !onTeam.has(p.id));
  const r = role.trim();
  return (
    <PopLayer onClose={onClose}>
      <div className="pop asg" style={{ left: pos.left, top: pos.top, width: w }} onClick={(e) => e.stopPropagation()}>
        <div className="asg-head">Add to {team.name}</div>
        <div style={{ padding: "0 6px 8px" }}>
          <input className="input" placeholder="Role on this team (optional)" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div className="toggle-list">
          {avail.length === 0 && <div className="cd-empty" style={{ padding: "8px 8px" }}>Everyone’s already on this team.</div>}
          {avail.map(p => (
            <button key={p.id} className="asg-item" onClick={() => onAdd(p.id, r || p.role)}>
              <Avatar person={p} size={28} />
              <span className="asg-meta">
                <div className="asg-name">{p.name}</div>
                <div className="asg-sub">{p.role}</div>
              </span>
              <span className="asg-check"><Icon name="plus" size={12} /></span>
            </button>
          ))}
          <button className="asg-item" onClick={() => onCreateNew(r)}>
            <span className="avatar" style={{ background: "var(--ink-3)", "--sz": "28px" }}><Icon name="plus" size={14} /></span>
            <span className="asg-meta">
              <div className="asg-name">Create new person</div>
              <div className="asg-sub">Add someone new to this team</div>
            </span>
          </button>
        </div>
      </div>
    </PopLayer>
  );
}

function TeamPicker({ rect, teams, currentId, onPick, onClose }) {
  const w = 220;
  const pos = anchorPos(rect, w, { h: 300 });
  return (
    <PopLayer onClose={onClose}>
      <div className="pop ctx" style={{ left: pos.left, top: pos.top, width: w }} onClick={(e) => e.stopPropagation()}>
        <button className={"ctx-item" + (!currentId ? " on" : "")} onClick={() => { onPick(null); onClose(); }}>
          <span className="team-dot empty" />
          <span style={{ flex: 1 }}>No team</span>
          {!currentId && <span className="ctx-check"><Icon name="check" size={12} /></span>}
        </button>
        <div className="ctx-div" />
        {(teams || []).map(t => (
          <button key={t.id} className={"ctx-item" + (currentId === t.id ? " on" : "")} onClick={() => { onPick(t.id); onClose(); }}>
            <span className="team-dot" style={{ background: t.color }} />
            <span style={{ flex: 1 }}>{t.name}</span>
            {currentId === t.id && <span className="ctx-check"><Icon name="check" size={12} /></span>}
          </button>
        ))}
      </div>
    </PopLayer>
  );
}

Object.assign(window, { ContextMenu, AssigneePicker, WeekTooltip, AddMemberPopover, TeamPicker });
