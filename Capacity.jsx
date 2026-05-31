/* Capacity.jsx — team card grid with expandable per-person epic detail. */

const { useState: useStateC } = React;

function CapacityPage({ inits, team, onAddPerson, onEditPerson, onDeletePerson }) {
  const [active, setActive] = useStateC(null);

  // person id -> [{epic, initName, initId}]
  const byPerson = {};
  team.forEach(p => { byPerson[p.id] = []; });
  inits.forEach(init => init.epics.forEach(epic => {
    epic.assignees.forEach(pid => {
      if (byPerson[pid]) byPerson[pid].push({ epic, initName: init.name });
    });
  }));

  function detailPanel(p) {
    const list = byPerson[p.id];
    return (
      <div className="cap-detail">
        <div className="cd-h"><Avatar person={p} size={20} /><b>{p.name}</b><span>· {list.length} epic{list.length === 1 ? "" : "s"} assigned</span></div>
        {list.length === 0 && <div className="cd-empty">Not assigned to any epics right now.</div>}
        {list.map(({ epic, initName }) => (
          <div className="cd-epic" key={epic.id}>
            <div className="ce-name">{epic.name}</div>
            <div className="ce-init">{initName}</div>
            <div className="ce-period">{window.periodLabel(epic.start, epic.end)}</div>
            <Pill status={epic.status} isStatic />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="capacity">
      <div className="cap-intro">Assignments across {inits.reduce((n, i) => n + i.epics.length, 0)} epics · {team.length} people. Click a person to see their epics.</div>
      <div className="cap-grid">
        {team.map(p => {
          const count = byPerson[p.id].length;
          const isActive = active === p.id;
          return (
            <React.Fragment key={p.id}>
              <div className={"cap-card" + (isActive ? " active" : "")} onClick={() => setActive(isActive ? null : p.id)}>
                <div className="cap-top">
                  <Avatar person={p} size={40} />
                  <div className="cap-id">
                    <div className="cap-name">{p.name}</div>
                    <div className="cap-role">{p.role}</div>
                  </div>
                  <div className="cap-actions">
                    <button className="cap-act" aria-label="Edit person" onClick={(e) => { e.stopPropagation(); onEditPerson(p); }}>
                      <Icon name="edit" size={14} />
                    </button>
                    <button className="cap-act danger" aria-label="Remove person" onClick={(e) => { e.stopPropagation(); onDeletePerson(p); }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
                <div className={"cap-badge" + (count === 0 ? " zero" : "")}>{count} epic{count === 1 ? "" : "s"}</div>
              </div>
              {isActive && detailPanel(p)}
            </React.Fragment>
          );
        })}
        <button className="cap-add" onClick={onAddPerson}>
          <span className="cap-add-ic"><Icon name="plus" size={18} /></span>
          Add person
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { CapacityPage });
