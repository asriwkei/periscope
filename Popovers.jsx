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

Object.assign(window, { ContextMenu, AssigneePicker, WeekTooltip });
