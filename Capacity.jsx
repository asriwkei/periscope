/* Capacity.jsx — people grouped under collapsible teams, with inline team
   management. Each card shows the member's per-team role; clicking expands their
   per-person epic detail. */

const { useState: useStateC } = React;

function CapacityPage({ inits, people, teams, memberships, onEditPerson, onAddMember, onRemoveMember, onTeamMenu, onNewTeam, onCreateNewMember }) {
  const [active, setActive] = useStateC(null);   // `${teamId}:${personId}` of expanded card
  const [openTeams, setOpenTeams] = useStateC(() => {
    const o = {}; (teams || []).forEach(t => { o[t.id] = true; }); return o;
  });
  const [addPop, setAddPop] = useStateC(null);   // { rect, team }

  const personById = Object.fromEntries((people || []).map(p => [p.id, p]));

  // person id -> [{epic, initName}]
  const byPerson = {};
  (people || []).forEach(p => { byPerson[p.id] = []; });
  inits.forEach(init => init.epics.forEach(epic => {
    epic.assignees.forEach(pid => {
      if (byPerson[pid]) byPerson[pid].push({ epic, initName: init.name });
    });
  }));

  function toggleTeam(id) { setOpenTeams(o => ({ ...o, [id]: !o[id] })); }

  function detailPanel(p) {
    const list = byPerson[p.id] || [];
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

  const totalEpics = inits.reduce((n, i) => n + i.epics.length, 0);

  return (
    <div className="capacity">
      <div className="cap-intro">Assignments across {totalEpics} epics · {(people || []).length} people in {(teams || []).length} team{(teams || []).length === 1 ? "" : "s"}. Click a person to see their epics.</div>

      {(teams || []).map(team => {
        const members = (memberships || []).filter(m => m.teamId === team.id);
        const open = openTeams[team.id];
        return (
          <div className="cap-team" key={team.id}>
            <div className="cap-team-head">
              <button className={"cap-team-chev" + (open ? " open" : "")} onClick={() => toggleTeam(team.id)} aria-label="Toggle team">
                <Icon name="chevron" size={14} />
              </button>
              <span className="cap-team-dot" style={{ background: team.color }} />
              <span className="cap-team-name">{team.name}</span>
              <span className="cap-team-count">{members.length} member{members.length === 1 ? "" : "s"}</span>
              <span style={{ flex: 1 }} />
              <button className="cap-team-add" onClick={(e) => setAddPop({ rect: e.currentTarget.getBoundingClientRect(), team })}>
                <Icon name="plus" size={13} />Add member
              </button>
              <button className="cap-team-menu" onClick={() => onTeamMenu(team)} aria-label="Team options">
                <Icon name="more" size={15} />
              </button>
            </div>

            {open && (
              <div className="cap-grid">
                {members.length === 0 && <div className="cap-team-empty">No members on this team yet.</div>}
                {members.map(m => {
                  const p = personById[m.personId];
                  if (!p) return null;
                  const count = (byPerson[p.id] || []).length;
                  const key = team.id + ":" + p.id;
                  const isActive = active === key;
                  return (
                    <React.Fragment key={key}>
                      <div className={"cap-card" + (isActive ? " active" : "")} onClick={() => setActive(isActive ? null : key)}>
                        <div className="cap-top">
                          <Avatar person={p} size={40} />
                          <div className="cap-id">
                            <div className="cap-name">{p.name}</div>
                            <div className="cap-role">{m.role || p.role}</div>
                          </div>
                          <div className="cap-actions">
                            <button className="cap-act" aria-label="Edit person" onClick={(e) => { e.stopPropagation(); onEditPerson(p); }}>
                              <Icon name="edit" size={14} />
                            </button>
                            <button className="cap-act danger" aria-label="Remove from team" onClick={(e) => { e.stopPropagation(); onRemoveMember(team, p); }}>
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
              </div>
            )}
          </div>
        );
      })}

      <button className="cap-newteam" onClick={onNewTeam}>
        <Icon name="plus" size={15} />New team
      </button>

      {addPop && (
        <AddMemberPopover
          rect={addPop.rect} team={addPop.team} people={people} memberships={memberships}
          onAdd={(personId, role) => { onAddMember(addPop.team, personId, role); setAddPop(null); }}
          onCreateNew={(role) => { onCreateNewMember(addPop.team, role); setAddPop(null); }}
          onClose={() => setAddPop(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { CapacityPage });
