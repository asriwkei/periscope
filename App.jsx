/* App.jsx — shell (sidebar + top bar), routing, state, handlers, tweaks. */

const { useState: useStateA } = React;

/* ---------- persistence (localStorage) ----------
   Initiatives + team are saved on every change and restored on launch, so edits
   survive closing/reopening the app AND future app updates. localStorage is tied
   to the app's identity, not the bundled files, so updating the app never wipes it.
   The seed.js data is only used the very first time, before anything is saved. */
const LS_KEY = "periscope.data.v1";
function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.inits) || !Array.isArray(p.team)) return null;
    return p;
  } catch (e) { return null; }
}
function saveData(inits, team, teams, memberships, statuses) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ inits, team, teams, memberships, statuses })); } catch (e) {}
}
// Escape hatch (callable even without devtools, e.g. from a future Settings button):
// wipe saved data and fall back to the seed demo on next launch.
window.resetPeriscopeData = function () {
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
  location.reload();
};

const NAV = [
  { id: "portfolio", label: "Portfolio", icon: "portfolio" },
  { id: "overview", label: "Roadmap", icon: "overview" },
  { id: "capacity", label: "Capacity", icon: "capacity" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function Sidebar({ page, setPage, team }) {
  return (
    <div className="sidebar">
      <div className="side-top">
        <div className="traffic"><i className="r" /><i className="y" /><i className="g" /></div>
        <span className="brand">Periscope</span>
      </div>
      <div className="nav">
        {NAV.map(n => (
          <button key={n.id} className={"nav-item" + (page === n.id ? " active" : "")} onClick={() => setPage(n.id)}>
            <Icon name={n.icon} size={17} />{n.label}
          </button>
        ))}
      </div>
      <div className="side-spacer" />
      <div className="side-avatars">
        <div className="lbl">Team</div>
        <div className="av-row">
          {team.map(p => <Avatar key={p.id} person={p} size={26} />)}
        </div>
      </div>
    </div>
  );
}

function TopBar({ page, zoom, setZoom, showTimeline, setShowTimeline, onExport, exporting }) {
  const title = (NAV.find(n => n.id === page) || {}).label || "";
  return (
    <div className="topbar">
      <div className="page-title">{title}</div>
      <div className="topbar-tools">
        {page === "overview" && (
          <button className={"tl-toggle" + (showTimeline ? " on" : "")} onClick={() => setShowTimeline(v => !v)}>
            <Icon name={showTimeline ? "panelClose" : "panelOpen"} size={15} />
            {showTimeline ? "Hide timeline" : "Show timeline"}
          </button>
        )}
        {page === "overview" && showTimeline && (
          <div className="seg">
            <button className={zoom === "weekly" ? "on" : ""} onClick={() => setZoom("weekly")}>Weekly</button>
            <button className={zoom === "monthly" ? "on" : ""} onClick={() => setZoom("monthly")}>Monthly</button>
          </div>
        )}
        {page === "overview" && (
          <button className="export-btn" onClick={onExport} disabled={exporting}>
            <Icon name="download" size={15} />
            {exporting ? "Exporting…" : "Export Report"}
          </button>
        )}
      </div>
    </div>
  );
}

function StubPage({ icon, title }) {
  return (
    <div className="stub">
      <div className="stub-ic"><Icon name={icon} size={26} /></div>
      <div className="badge">Coming soon</div>
      <h2>{title}</h2>
      <p>This view isn’t built out in the prototype yet. Roadmap and Capacity are the live, interactive surfaces.</p>
    </div>
  );
}

/* Settings — configure the status list (name + colour) used app-wide for
   initiatives and epics. Add, rename, recolour, or delete statuses; deleting one
   leaves affected items with "No status". */
function SettingsPage({ statuses, onAdd, onRename, onRecolor, onDelete }) {
  const [openColor, setOpenColor] = useStateA(null);  // status id whose palette is open
  const [confirmDel, setConfirmDel] = useStateA(null); // status id pending delete confirm
  return (
    <div className="settings-page">
      <div className="set-section">
        <div className="set-head">
          <h2 className="set-title">Status list</h2>
          <p className="set-desc">These statuses are used for initiatives and epics across the Roadmap and Portfolio. Edit a name or colour, add new ones, or remove what you don’t need. Deleting a status leaves anything using it with “No status”.</p>
        </div>
        <div className="set-status-list">
          {statuses.map(s => (
            <div key={s.id} className="set-status-row">
              <div className="set-color-wrap">
                <button className="set-color-btn" style={{ background: s.color }}
                  onClick={() => setOpenColor(o => o === s.id ? null : s.id)} aria-label="Change colour" />
                {openColor === s.id && (
                  <React.Fragment>
                    <div className="set-pop-scrim" onClick={() => setOpenColor(null)} />
                    <div className="set-color-pop" onClick={(e) => e.stopPropagation()}>
                      <div className="swatches">
                        {window.STATUS_COLORS.map(c => (
                          <button key={c} type="button" className={"swatch" + (s.color === c ? " on" : "")}
                            style={{ background: c }} onClick={() => { onRecolor(s.id, c); setOpenColor(null); }}
                            aria-label={"Colour " + c}>
                            <Icon name="check" size={12} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                )}
              </div>
              <input className="input set-status-name" value={s.label}
                onChange={(e) => onRename(s.id, e.target.value)} placeholder="Status name" />
              <span className="set-status-preview" style={{ background: window.statusSoft(s.color), color: window.statusInk(s.color) }}>
                <span className="dot" style={{ background: s.color }} />{s.label.trim() || "Untitled"}
              </span>
              {confirmDel === s.id ? (
                <span className="set-confirm">
                  <span className="set-confirm-q">Remove?</span>
                  <button className="set-mini danger" onClick={() => { onDelete(s.id); setConfirmDel(null); }}>Yes</button>
                  <button className="set-mini" onClick={() => setConfirmDel(null)}>No</button>
                </span>
              ) : (
                <button className="set-del" onClick={() => setConfirmDel(s.id)}
                  disabled={statuses.length <= 1}
                  title={statuses.length <= 1 ? "Keep at least one status" : "Delete status"}
                  aria-label="Delete status">
                  <Icon name="trash" size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="set-add" onClick={onAdd}><Icon name="plus" size={15} />Add status</button>
      </div>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "barStyle": "filled",
  "density": "regular",
  "weekTint": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = useStateA("portfolio");
  const [inits, setInits] = useStateA(() => { const s = loadSaved(); return s ? s.inits : window.INITIATIVES; });
  const [team, setTeam] = useStateA(() => { const s = loadSaved(); const tm = s ? s.team : window.TEAM; window.TEAM = tm; return tm; });
  const [teams, setTeams] = useStateA(() => { const s = loadSaved(); const tm = s && s.teams ? s.teams : window.TEAMS; window.TEAMS = tm; return tm; });
  const [memberships, setMemberships] = useStateA(() => { const s = loadSaved(); const mm = s && s.memberships ? s.memberships : window.TEAM_MEMBERSHIPS; window.TEAM_MEMBERSHIPS = mm; return mm; });
  const [statuses, setStatuses] = useStateA(() => { const s = loadSaved(); const st = s && Array.isArray(s.statuses) && s.statuses.length ? s.statuses : window.DEFAULT_STATUSES; window.STATUSES = st; return st; });

  // keep window globals in sync (avatar/team lookups read them) + auto-save on every change
  React.useEffect(() => { window.TEAM = team; }, [team]);
  React.useEffect(() => { window.TEAMS = teams; }, [teams]);
  React.useEffect(() => { window.TEAM_MEMBERSHIPS = memberships; }, [memberships]);
  React.useEffect(() => { window.STATUSES = statuses; }, [statuses]);
  React.useEffect(() => { saveData(inits, team, teams, memberships, statuses); }, [inits, team, teams, memberships, statuses]);
  const [personModal, setPersonModal] = useStateA(null); // {mode:'add'|'edit', person?}
  const [zoom, setZoom] = useStateA("weekly");
  const [showTimeline, setShowTimeline] = useStateA(true);
  const [filter, setFilter] = useStateA([]); // array of statuses; empty = all
  const [teamFilter, setTeamFilter] = useStateA([]); // array of team ids; empty = all
  const [initFilter, setInitFilter] = useStateA([]); // array of initiative ids; empty = all
  const [teamModal, setTeamModal] = useStateA(null);  // {mode:'add'|'edit', team?}
  const [statusModal, setStatusModal] = useStateA(null); // {initId, epicId, startInEdit}
  const [addEpicFor, setAddEpicFor] = useStateA(null);    // initId
  const [addInitOpen, setAddInitOpen] = useStateA(false);
  const [del, setDel] = useStateA(null);                  // {kind, initId, epicId, name, childCount}
  const [exporting, setExporting] = useStateA(false);

  const nowWeek = t.weekTint ? window.TL.nowWeek : -1;

  // ---------- export to DOCX ----------
  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await window.exportInitiativesDocx(inits);
      await window.downloadDocxBlob(blob, "Initiative_Update_Report.docx");
    } catch (e) {
      console.error("Export failed", e);
      alert("Sorry, the report couldn't be generated: " + (e && e.message ? e.message : e));
    } finally {
      setExporting(false);
    }
  }

  // ---------- mutations ----------
  const setEpic = (initId, epicId, fields) => setInits(prev => prev.map(i =>
    i.id !== initId ? i : { ...i, epics: i.epics.map(e => e.id !== epicId ? e : { ...e, ...fields }) }));
  const setInit = (initId, fields) => setInits(prev => prev.map(i => i.id !== initId ? i : { ...i, ...fields }));

  const handlers = {
    toggleOpen: (initId) => setInits(prev => prev.map(i => i.id === initId ? { ...i, open: !i.open } : i)),
    resizeEpic: (initId, epicId, range) => setEpic(initId, epicId, range),
    resizeInit: (initId, range) => setInit(initId, range),
    toggleAssignee: (initId, epicId, pid) => setInits(prev => prev.map(i =>
      i.id !== initId ? i : { ...i, epics: i.epics.map(e => {
        if (e.id !== epicId) return e;
        const has = e.assignees.includes(pid);
        return { ...e, assignees: has ? e.assignees.filter(x => x !== pid) : [...e.assignees, pid] };
      }) })),
    openStatus: (initId, epicId) => setStatusModal({ initId, epicId, startInEdit: false }),
    openEdit: (initId, epicId) => setStatusModal({ initId, epicId, startInEdit: true }),
    openDelete: (kind, initId, epicId, name) => {
      const child = kind === "init" ? (inits.find(i => i.id === initId)?.epics.length || 0) : 0;
      setDel({ kind, initId, epicId, name, childCount: child });
    },
    openAddEpic: (initId) => setAddEpicFor(initId),
    openAddInitiative: () => setAddInitOpen(true),
    assignTeam: (kind, initId, epicId, teamId) => {
      if (kind === "init") setInit(initId, { teamId });
      else setEpic(initId, epicId, { teamId });
    },
    reorderInit: (fromId, toId, pos) => setInits(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(i => i.id === fromId);
      const toIdx = arr.findIndex(i => i.id === toId);
      if (fromIdx === toIdx) return prev;
      const [item] = arr.splice(fromIdx, 1);
      const adjusted = toIdx > fromIdx ? toIdx - 1 : toIdx;
      arr.splice(pos === "after" ? adjusted + 1 : adjusted, 0, item);
      return arr;
    }),
    reorderEpic: (initId, fromId, toId, pos) => setInits(prev => prev.map(i => {
      if (i.id !== initId) return i;
      const arr = [...i.epics];
      const fromIdx = arr.findIndex(e => e.id === fromId);
      const toIdx = arr.findIndex(e => e.id === toId);
      if (fromIdx === toIdx) return i;
      const [item] = arr.splice(fromIdx, 1);
      const adjusted = toIdx > fromIdx ? toIdx - 1 : toIdx;
      arr.splice(pos === "after" ? adjusted + 1 : adjusted, 0, item);
      return { ...i, epics: arr };
    })),
  };

  // ---------- modal lookups ----------
  let smItem = null, smKind = null;
  if (statusModal) {
    const init = inits.find(i => i.id === statusModal.initId);
    if (init) {
      if (statusModal.epicId) { smItem = init.epics.find(e => e.id === statusModal.epicId); smKind = "epic"; }
      else { smItem = init; smKind = "init"; }
    }
  }
  function saveStatus(upd) {
    if (smKind === "epic") setEpic(statusModal.initId, statusModal.epicId, upd);
    else setInit(statusModal.initId, upd);
  }
  function confirmDelete() {
    if (del.kind === "person") { deletePerson(del.personId); return; }
    if (del.kind === "init") {
      setInits(prev => prev.filter(i => i.id !== del.initId));
      setInitFilter(prev => prev.filter(id => id !== del.initId));
    } else setInits(prev => prev.map(i => i.id !== del.initId ? i : { ...i, epics: i.epics.filter(e => e.id !== del.epicId) }));
    setDel(null);
  }
  function createEpic(epic) {
    setInits(prev => prev.map(i => i.id !== addEpicFor ? i : { ...i, open: true, epics: [...i.epics, epic] }));
    setAddEpicFor(null);
  }
  function createInitiative(init) {
    setInits(prev => [...prev, init]);
    setAddInitOpen(false);
  }

  // ---------- team / membership mutations ----------
  function commitTeam(next) { window.TEAM = next; setTeam(next); }
  function commitTeams(next) { window.TEAMS = next; setTeams(next); }
  function commitMemberships(next) { window.TEAM_MEMBERSHIPS = next; setMemberships(next); }
  // set window.STATUSES synchronously so components reading it re-render fresh
  function commitStatuses(next) { window.STATUSES = next; setStatuses(next); }

  // ---------- status list mutations (Settings page) ----------
  function addStatus() {
    const used = new Set(statuses.map(s => s.color));
    const color = window.STATUS_COLORS.find(c => !used.has(c)) || window.STATUS_COLORS[statuses.length % window.STATUS_COLORS.length];
    commitStatuses([...statuses, { id: "st" + Date.now(), label: "New status", color }]);
  }
  function renameStatus(id, label) {
    commitStatuses(statuses.map(s => s.id === id ? { ...s, label } : s));
  }
  function recolorStatus(id, color) {
    commitStatuses(statuses.map(s => s.id === id ? { ...s, color } : s));
  }
  function deleteStatus(id) {
    commitStatuses(statuses.filter(s => s.id !== id));
    // any initiative/epic using this status falls back to "No status"
    setInits(prev => prev.map(i => ({
      ...i,
      status: i.status === id ? "" : i.status,
      epics: i.epics.map(e => ({ ...e, status: e.status === id ? "" : e.status })),
    })));
    setFilter(prev => prev.filter(x => x !== id));
  }

  function savePerson({ name, role }) {
    const nm = name.trim();
    if (!nm) return;
    if (personModal.mode === "add") {
      const id = "p" + Date.now();
      const r = role.trim() || "Team member";
      commitTeam([...team, {
        id, name: nm, role: r,
        color: window.nextColor(team), initials: window.makeInitials(nm),
      }]);
      // if this person was created from a team's "+ Add member", join them to it
      if (personModal.joinTeam && !memberships.some(m => m.teamId === personModal.joinTeam && m.personId === id)) {
        commitMemberships([...memberships, { personId: id, teamId: personModal.joinTeam, role: r }]);
      }
    } else {
      const id = personModal.person.id;
      commitTeam(team.map(p => p.id === id ? { ...p, name: nm, role: role.trim() || p.role, initials: window.makeInitials(nm) } : p));
    }
    setPersonModal(null);
  }
  function deletePerson(id) {
    commitTeam(team.filter(p => p.id !== id));
    commitMemberships(memberships.filter(m => m.personId !== id));
    // unassign from every epic
    setInits(prev => prev.map(i => ({ ...i, epics: i.epics.map(e => ({ ...e, assignees: e.assignees.filter(a => a !== id) })) })));
    setDel(null);
  }

  function addMember(t, personId, role) {
    if (memberships.some(m => m.teamId === t.id && m.personId === personId)) return;
    commitMemberships([...memberships, { personId, teamId: t.id, role: role || "" }]);
  }
  function removeMember(t, person) {
    commitMemberships(memberships.filter(m => !(m.teamId === t.id && m.personId === person.id)));
  }
  function saveTeam({ name, color }) {
    if (teamModal.mode === "add") {
      commitTeams([...teams, { id: "team" + Date.now(), name, color }]);
    } else {
      const id = teamModal.team.id;
      commitTeams(teams.map(t => t.id === id ? { ...t, name, color } : t));
    }
    setTeamModal(null);
  }
  function removeTeam() {
    const id = teamModal.team.id;
    commitTeams(teams.filter(t => t.id !== id));
    commitMemberships(memberships.filter(m => m.teamId !== id));
    setTeamFilter(prev => prev.filter(x => x !== id));
    // clear the teamId off any initiatives/epics that pointed at it
    setInits(prev => prev.map(i => ({
      ...i,
      teamId: i.teamId === id ? null : i.teamId,
      epics: i.epics.map(e => ({ ...e, teamId: e.teamId === id ? null : e.teamId })),
    })));
    setTeamModal(null);
  }

  const addInit = addEpicFor ? inits.find(i => i.id === addEpicFor) : null;

  return (
    <div className="desktop">
      <div className="window" data-density={t.density}>
        <Sidebar page={page} setPage={setPage} team={team} />
        <div className="main">
          <TopBar page={page} zoom={zoom} setZoom={setZoom} showTimeline={showTimeline} setShowTimeline={setShowTimeline} onExport={handleExport} exporting={exporting} />
          {page === "overview" && (
            <FilterBar
              inits={inits} teams={teams}
              filter={filter} setFilter={setFilter}
              teamFilter={teamFilter} setTeamFilter={setTeamFilter}
              initFilter={initFilter} setInitFilter={setInitFilter}
            />
          )}
          <div className="content">
            {page === "portfolio" && (
              <PortfolioPage
                inits={inits} teams={teams}
                onSaveInitiative={setInit}
              />
            )}
            {page === "overview" && (
              <OverviewPage inits={inits} teams={teams} zoom={zoom} barStyle={t.barStyle} nowWeek={nowWeek} filter={filter} teamFilter={teamFilter} initFilter={initFilter} showTimeline={showTimeline} handlers={handlers} />
            )}
            {page === "capacity" && (
              <CapacityPage
                inits={inits} people={team} teams={teams} memberships={memberships}
                onEditPerson={(p) => setPersonModal({ mode: "edit", person: p })}
                onAddMember={addMember}
                onRemoveMember={removeMember}
                onCreateNewMember={(t_, role) => setPersonModal({ mode: "add", joinTeam: t_.id, role })}
                onTeamMenu={(t_) => setTeamModal({ mode: "edit", team: t_ })}
                onNewTeam={() => setTeamModal({ mode: "add" })}
              />
            )}
            {page === "settings" && (
              <SettingsPage
                statuses={statuses}
                onAdd={addStatus}
                onRename={renameStatus}
                onRecolor={recolorStatus}
                onDelete={deleteStatus}
              />
            )}
          </div>
        </div>
      </div>

      {smItem && (
        <StatusModal
          key={(statusModal.epicId || statusModal.initId) + ":" + statusModal.startInEdit}
          item={smItem} kind={smKind} startInEdit={statusModal.startInEdit}
          onClose={() => setStatusModal(null)} onSave={saveStatus}
        />
      )}
      {addInit && <AddEpicModal initiative={addInit} onClose={() => setAddEpicFor(null)} onCreate={createEpic} />}
      {addInitOpen && <AddInitiativeModal onClose={() => setAddInitOpen(false)} onCreate={createInitiative} />}
      {personModal && <PersonModal mode={personModal.mode} person={personModal.person} roleDefault={personModal.role} onClose={() => setPersonModal(null)} onSave={savePerson} />}
      {teamModal && <TeamModal mode={teamModal.mode} team={teamModal.team} onClose={() => setTeamModal(null)} onSave={saveTeam} onRemove={removeTeam} />}
      {del && <DeleteConfirm target={del} onCancel={() => setDel(null)} onConfirm={confirmDelete} />}

      <TweaksPanel>
        <TweakSection label="Timeline" />
        <TweakRadio label="Bar style" value={t.barStyle} options={["filled", "soft", "outline"]} onChange={(v) => setTweak("barStyle", v)} />
        <TweakToggle label="Highlight current week" value={t.weekTint} onChange={(v) => setTweak("weekTint", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Row density" value={t.density} options={["compact", "regular"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
