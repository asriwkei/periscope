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
function saveData(inits, team) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ inits, team })); } catch (e) {}
}
// Escape hatch (callable even without devtools, e.g. from a future Settings button):
// wipe saved data and fall back to the seed demo on next launch.
window.resetPeriscopeData = function () {
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
  location.reload();
};

const NAV = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "capacity", label: "Capacity", icon: "capacity" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function Sidebar({ page, setPage, team }) {
  return (
    <div className="sidebar">
      <div className="side-top">
        <div className="traffic"><i className="r" /><i className="y" /><i className="g" /></div>
        <span className="brand">Roadmap</span>
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

function TopBar({ page, zoom, setZoom, showTimeline, setShowTimeline }) {
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
      <p>This view isn’t built out in the prototype yet. Overview and Capacity are the live, interactive surfaces.</p>
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
  const [page, setPage] = useStateA("overview");
  const [inits, setInits] = useStateA(() => { const s = loadSaved(); return s ? s.inits : window.INITIATIVES; });
  const [team, setTeam] = useStateA(() => { const s = loadSaved(); const tm = s ? s.team : window.TEAM; window.TEAM = tm; return tm; });

  // keep window.TEAM in sync (avatar lookups read it) + auto-save on every change
  React.useEffect(() => { window.TEAM = team; }, [team]);
  React.useEffect(() => { saveData(inits, team); }, [inits, team]);
  const [personModal, setPersonModal] = useStateA(null); // {mode:'add'|'edit', person?}
  const [zoom, setZoom] = useStateA("weekly");
  const [showTimeline, setShowTimeline] = useStateA(true);
  const [filter, setFilter] = useStateA([]); // array of statuses; empty = all
  const [statusModal, setStatusModal] = useStateA(null); // {initId, epicId, startInEdit}
  const [addEpicFor, setAddEpicFor] = useStateA(null);    // initId
  const [addInitOpen, setAddInitOpen] = useStateA(false);
  const [del, setDel] = useStateA(null);                  // {kind, initId, epicId, name, childCount}

  const nowWeek = t.weekTint ? window.TL.nowWeek : -1;

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
    if (del.kind === "init") setInits(prev => prev.filter(i => i.id !== del.initId));
    else setInits(prev => prev.map(i => i.id !== del.initId ? i : { ...i, epics: i.epics.filter(e => e.id !== del.epicId) }));
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

  // ---------- team mutations ----------
  function commitTeam(next) { window.TEAM = next; setTeam(next); }
  function savePerson({ name, role }) {
    const nm = name.trim();
    if (!nm) return;
    if (personModal.mode === "add") {
      commitTeam([...team, {
        id: "p" + Date.now(), name: nm, role: role.trim() || "Team member",
        color: window.nextColor(team), initials: window.makeInitials(nm),
      }]);
    } else {
      const id = personModal.person.id;
      commitTeam(team.map(p => p.id === id ? { ...p, name: nm, role: role.trim() || p.role, initials: window.makeInitials(nm) } : p));
    }
    setPersonModal(null);
  }
  function deletePerson(id) {
    commitTeam(team.filter(p => p.id !== id));
    // unassign from every epic
    setInits(prev => prev.map(i => ({ ...i, epics: i.epics.map(e => ({ ...e, assignees: e.assignees.filter(a => a !== id) })) })));
    setDel(null);
  }

  const addInit = addEpicFor ? inits.find(i => i.id === addEpicFor) : null;

  return (
    <div className="desktop">
      <div className="window" data-density={t.density}>
        <Sidebar page={page} setPage={setPage} team={team} />
        <div className="main">
          <TopBar page={page} zoom={zoom} setZoom={setZoom} showTimeline={showTimeline} setShowTimeline={setShowTimeline} />
          <div className="content">
            {page === "overview" && (
              <OverviewPage inits={inits} zoom={zoom} barStyle={t.barStyle} nowWeek={nowWeek} filter={filter} setFilter={setFilter} showTimeline={showTimeline} handlers={handlers} />
            )}
            {page === "capacity" && (
              <CapacityPage
                inits={inits} team={team}
                onAddPerson={() => setPersonModal({ mode: "add" })}
                onEditPerson={(p) => setPersonModal({ mode: "edit", person: p })}
                onDeletePerson={(p) => setDel({ kind: "person", personId: p.id, name: p.name, epicCount: inits.reduce((n, i) => n + i.epics.filter(e => e.assignees.includes(p.id)).length, 0) })}
              />
            )}
            {page === "settings" && <StubPage icon="settings" title="Settings" />}
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
      {personModal && <PersonModal mode={personModal.mode} person={personModal.person} onClose={() => setPersonModal(null)} onSave={savePerson} />}
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
