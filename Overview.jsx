/* Overview.jsx — hierarchy grid, timeline header, rows, inline popovers. */

const { useState: useStateO } = React;

/* Status filter options. `color` is a CSS token string so dots stay token-driven.
   Adding a status later = append one entry here; the dropdown picks it up. */
const STATUS_FILTERS = [
  { id: "on-track", name: "Building", color: "var(--green)" },
  { id: "at-risk", name: "Needs attention", color: "var(--amber)" },
  { id: "done", name: "Released", color: "var(--done)" },
];

function TeamCell({ teamId, onClick }) {
  const team = window.teamById(window.TEAMS, teamId);
  return (
    <div className="cell-team">
      <button className="cell-team-btn" onClick={onClick}>
        <span className={"team-dot" + (team ? "" : " empty")} style={team ? { background: team.color } : undefined} />
        <span style={{ color: team ? "var(--ink-2)" : "var(--ink-4)" }}>{team ? team.name : "—"}</span>
      </button>
    </div>
  );
}

function MenuBtn({ open, onClick }) {
  return (
    <button className={"menu-btn" + (open ? " open" : "")} onClick={onClick} aria-label="More">
      <Icon name="more" size={15} />
    </button>
  );
}

function InitiativeRow({ init, zoom, nowWeek, ctxOpen, showTimeline, onToggle, onMenu, onStatus, onResize, onTeamCell, dragProps, dragOverPos, isDragging }) {
  const dropCls = dragOverPos === "before" ? " drag-before" : dragOverPos === "after" ? " drag-after" : "";
  return (
    <div className={"ov-row init" + dropCls + (isDragging ? " dragging" : "")} {...(dragProps || {})}>
      <div className="cell-name">
        <span className="drag-handle" title="Drag to reorder"><Icon name="grip" size={13} sw={2.5} /></span>
        <button className={"chev" + (init.open ? " open" : "")} onClick={() => onToggle(init.id)} aria-label="Expand">
          <Icon name="chevron" size={13} />
        </button>
        <div className="name-main">
          <div className="name-row">
            <span className="name-txt">{init.name}</span>
            <MenuBtn open={ctxOpen} onClick={(e) => onMenu(e, "init", init.id, null, init.name)} />
          </div>
        </div>
      </div>
      <div className="cell-assignees" />
      <TeamCell teamId={init.teamId} onClick={(e) => onTeamCell(e, "init", init.id, null, init.teamId)} />
      <div className="cell-status"><Pill status={init.status} onClick={() => onStatus(init.id, null)} /></div>
      {showTimeline && (
        <div className="cell-timeline">
          <GridBg zoom={zoom} nowWeek={nowWeek} />
          <div className="tl-track"><TimelineBar item={init} kind="initiative" onChange={(r) => onResize(init.id, r)} /></div>
        </div>
      )}
    </div>
  );
}

function EpicRow({ init, epic, zoom, nowWeek, ctxOpen, showTimeline, onMenu, onStatus, onResize, onAddAssignee, onTeamCell, dragProps, dragOverPos, isDragging }) {
  const byId = Object.fromEntries(window.TEAM.map(p => [p.id, p]));
  const shown = epic.assignees.slice(0, 3);
  const extra = epic.assignees.length - shown.length;
  const dropCls = dragOverPos === "before" ? " drag-before" : dragOverPos === "after" ? " drag-after" : "";
  return (
    <div className={"ov-row epic" + dropCls + (isDragging ? " dragging" : "")} {...(dragProps || {})}>
      <div className="cell-name epic">
        <span className="drag-handle" title="Drag to reorder"><Icon name="grip" size={13} sw={2.5} /></span>
        <div className="name-main">
          <div className="name-row">
            <span className="name-txt">{epic.name}</span>
            <a className="ticket" href="#" onClick={(e) => { e.preventDefault(); window.openUrl(epic.ticketUrl); }} title={epic.ticket} style={{ opacity: epic.ticketUrl ? 1 : 0.5 }}>
              <Icon name="external" size={10} />{epic.ticket}
            </a>
            <MenuBtn open={ctxOpen} onClick={(e) => onMenu(e, "epic", init.id, epic.id, epic.name)} />
          </div>
        </div>
      </div>
      <div className="cell-assignees">
        <div className="av-stack">
          {shown.map(pid => <Avatar key={pid} person={byId[pid]} size={22} />)}
        </div>
        {extra > 0 && <span className="av-more">+{extra}</span>}
        <button className="add-assignee" onClick={(e) => onAddAssignee(e, init.id, epic.id)} aria-label="Add assignee">
          <Icon name="plus" size={12} />
        </button>
      </div>
      <TeamCell teamId={epic.teamId} onClick={(e) => onTeamCell(e, "epic", init.id, epic.id, epic.teamId)} />
      <div className="cell-status"><Pill status={epic.status} onClick={() => onStatus(init.id, epic.id)} /></div>
      {showTimeline && (
        <div className="cell-timeline">
          <GridBg zoom={zoom} nowWeek={nowWeek} />
          <div className="tl-track">
            <TimelineBar item={epic} kind="epic" onChange={(r) => onResize(init.id, epic.id, r)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* Right-pane timeline rows (Jira two-pane layout): just the timeline cell,
   rendered as a standalone fixed-height row so it lines up with the matching
   left-pane row. */
function InitTLRow({ init, zoom, nowWeek, onResize }) {
  return (
    <div className="rp-row init">
      <GridBg zoom={zoom} nowWeek={nowWeek} />
      <div className="tl-track"><TimelineBar item={init} kind="initiative" onChange={(r) => onResize(init.id, r)} /></div>
    </div>
  );
}

function EpicTLRow({ init, epic, zoom, nowWeek, onResize }) {
  return (
    <div className="rp-row epic">
      <GridBg zoom={zoom} nowWeek={nowWeek} />
      <div className="tl-track"><TimelineBar item={epic} kind="epic" onChange={(r) => onResize(init.id, epic.id, r)} /></div>
    </div>
  );
}

function TimelineHeader({ zoom, nowWeek, onWeekHover }) {
  const weeks = window.TL.weeks;
  const COL_W = window.COL_W;
  if (zoom === "monthly") {
    const groups = window.monthGroups();
    return (
      <div className="wk-strip" style={{ gridTemplateColumns: groups.map(g => (g.weeks * COL_W) + "px").join(" ") }}>
        {groups.map((g, i) => (
          <div key={i} className="wk-cell">
            <span className="wk-n">{g.label}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="wk-strip" style={{ gridTemplateColumns: `repeat(${weeks}, ${COL_W}px)` }}>
      {Array.from({ length: weeks }).map((_, i) => (
        <div
          key={i}
          className={"wk-cell" + (i === nowWeek ? " now" : "")}
          onMouseEnter={(e) => onWeekHover(e.currentTarget.getBoundingClientRect(), i)}
          onMouseLeave={() => onWeekHover(null, null)}
        >
          <span className="wk-n">W{window.isoWeekNum(window.weekMonday(i))}</span>
          <span className="wk-d">{window.weekLabel(i)}</span>
        </div>
      ))}
    </div>
  );
}

/* Reusable multi-select filter dropdown. items: [{id, name, color?}] where color
   is a CSS token/color string. value/setValue manage the selected id array. */
function FilterDropdown({ label, items, value, setValue }) {
  const [open, setOpen] = useStateO(false);
  const [rect, setRect] = useStateO(null);
  const count = value.length;
  const summary = count === 0 ? "All"
    : count === 1 ? ((items.find(i => i.id === value[0]) || {}).name || "1 selected")
    : count + " selected";
  function toggle(id) { setValue(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  const w = 220, m = 8;
  const left = rect ? Math.max(m, Math.min(rect.left, window.innerWidth - w - m)) : 0;
  const top = rect ? rect.bottom + 6 : 0;
  return (
    <React.Fragment>
      <button className={"fbar-team" + (count ? " active" : "")}
        onClick={(e) => { setRect(e.currentTarget.getBoundingClientRect()); setOpen(o => !o); }}>
        <span className="fbar-ddl">{label}: {summary}</span>
        <span className={"fb-caret" + (open ? " open" : "")}><Icon name="chevron" size={12} /></span>
      </button>
      {open && rect && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setOpen(false)}>
          <div className="pop fmenu" style={{ left, top, width: w }} onClick={(e) => e.stopPropagation()}>
            <div className="fmenu-head">
              <span>{label}</span>
              {count > 0 && <button className="fmenu-clear" onClick={() => setValue([])}>Clear</button>}
            </div>
            <div className="fmenu-scroll">
              {items.length === 0 && <div className="cd-empty" style={{ padding: "8px" }}>Nothing to filter.</div>}
              {items.map(it => {
                const on = value.includes(it.id);
                return (
                  <button key={it.id} className={"fmenu-item" + (on ? " on" : "")} onClick={() => toggle(it.id)}>
                    <span className="fmenu-box"><Icon name="check" size={11} /></span>
                    {it.color && <span className="team-dot" style={{ background: it.color }} />}
                    <span className="fmenu-label">{it.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function FilterBar({ inits, teams, filter, setFilter, teamFilter, setTeamFilter, initFilter, setInitFilter }) {
  const teamItems = (teams || []).map(t => ({ id: t.id, name: t.name, color: t.color }));
  const initItems = (inits || []).map(i => ({ id: i.id, name: i.name }));
  return (
    <div className="fbar">
      <span className="fbar-lbl">Filter</span>
      <div className="fbar-drops">
        <FilterDropdown label="Status" items={STATUS_FILTERS} value={filter} setValue={setFilter} />
        <FilterDropdown label="Team" items={teamItems} value={teamFilter} setValue={setTeamFilter} />
        <FilterDropdown label="Initiative" items={initItems} value={initFilter} setValue={setInitFilter} />
      </div>
    </div>
  );
}

function OverviewPage({ inits, teams, zoom, barStyle, nowWeek, filter, teamFilter, initFilter, showTimeline, handlers }) {
  const [ctx, setCtx] = useStateO(null);   // {rect, kind, initId, epicId, name}
  const [asg, setAsg] = useStateO(null);    // {rect, initId, epicId}
  const [tip, setTip] = useStateO(null);    // {rect, week}
  const [teamPick, setTeamPick] = useStateO(null); // {rect, kind, initId, epicId, currentId}

  // drag-to-reorder state (pointer/mouse based — works in Tauri WKWebView)
  const [dragOver, setDragOver] = useStateO(null);   // { kind, initId, id, pos }
  const [draggingId, setDraggingId] = useStateO(null); // id of row being dragged
  const dragRef = React.useRef(null); // { kind, initId, id }

  function makeDragProps(kind, initId, id) {
    return {
      'data-drag-id': id,
      'data-drag-kind': kind,
      'data-drag-init-id': initId || "",
      onMouseDown: (e) => {
        // only start drag from the grip handle
        if (!e.target.closest('.drag-handle')) return;
        e.preventDefault();
        dragRef.current = { kind, initId, id };
        setDraggingId(id);
        document.body.classList.add('is-dragging');

        function onMouseMove(ev) {
          if (!dragRef.current) return;
          const el = document.elementFromPoint(ev.clientX, ev.clientY);
          if (!el) { setDragOver(null); return; }
          const row = el.closest('.ov-row[data-drag-id]');
          if (!row) { setDragOver(null); return; }
          const targetId = row.dataset.dragId;
          const targetKind = row.dataset.dragKind;
          const targetInitId = row.dataset.dragInitId || null;
          // only allow same kind and same parent initiative for epics
          if (targetKind !== dragRef.current.kind) { setDragOver(null); return; }
          if (targetKind === "epic" && targetInitId !== dragRef.current.initId) { setDragOver(null); return; }
          const rect = row.getBoundingClientRect();
          const pos = ev.clientY < rect.top + rect.height / 2 ? "before" : "after";
          setDragOver(prev => {
            if (prev && prev.id === targetId && prev.pos === pos) return prev;
            return { kind: targetKind, initId: targetInitId, id: targetId, pos };
          });
        }

        function onMouseUp(ev) {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          document.body.classList.remove('is-dragging');
          if (!dragRef.current) return;
          const el = document.elementFromPoint(ev.clientX, ev.clientY);
          const row = el && el.closest('.ov-row[data-drag-id]');
          if (row) {
            const toId = row.dataset.dragId;
            const toKind = row.dataset.dragKind;
            const toInitId = row.dataset.dragInitId || null;
            const fromId = dragRef.current.id;
            if (fromId !== toId && toKind === dragRef.current.kind) {
              const rect = row.getBoundingClientRect();
              const pos = ev.clientY < rect.top + rect.height / 2 ? "before" : "after";
              if (toKind === "init") handlers.reorderInit(fromId, toId, pos);
              else if (toInitId === dragRef.current.initId) handlers.reorderEpic(toInitId, fromId, toId, pos);
            }
          }
          dragRef.current = null;
          setDraggingId(null);
          setDragOver(null);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      },
    };
  }

  const allEpics = inits.flatMap(i => i.epics);

  function onMenu(e, kind, initId, epicId, name) {
    e.stopPropagation();
    setCtx({ rect: e.currentTarget.getBoundingClientRect(), kind, initId, epicId, name });
  }
  function onAddAssignee(e, initId, epicId) {
    e.stopPropagation();
    setAsg({ rect: e.currentTarget.getBoundingClientRect(), initId, epicId });
  }
  function onWeekHover(rect, week) {
    if (rect == null) setTip(null);
    else setTip({ rect, week });
  }
  function onTeamCell(e, kind, initId, epicId, currentId) {
    e.stopPropagation();
    setTeamPick({ rect: e.currentTarget.getBoundingClientRect(), kind, initId, epicId, currentId });
  }

  const asgEpic = asg ? inits.find(i => i.id === asg.initId)?.epics.find(e => e.id === asg.epicId) : null;

  // ----- combined filtering: status + team + initiative (all multi-select) -----
  const statusActive = filter.length > 0;
  const teamActive = teamFilter.length > 0;
  const initActive = initFilter.length > 0;
  const anyFilter = statusActive || teamActive || initActive;
  const stTeamActive = statusActive || teamActive; // these two filter rows; init only narrows the set
  const epicMatches = (e) =>
    (!statusActive || filter.includes(e.status)) &&
    (!teamActive || teamFilter.includes(e.teamId));
  const initSelfMatches = (i) =>
    (!statusActive || filter.includes(i.status)) &&
    (!teamActive || teamFilter.includes(i.teamId));
  const visibleInits = inits.filter(i => {
    if (initActive && !initFilter.includes(i.id)) return false;
    if (!stTeamActive) return true;
    return initSelfMatches(i) || i.epics.some(epicMatches);
  });
  function visibleEpics(init) {
    return stTeamActive ? init.epics.filter(epicMatches) : init.epics;
  }

  const tlW = window.TL.weeks * window.COL_W;
  const headRef = React.useRef(null);
  // keep the (clipped) week-header track in sync with the body's horizontal scroll
  function syncScroll(e) {
    if (headRef.current) headRef.current.scrollLeft = e.currentTarget.scrollLeft;
  }

  const headLabels = (
    <React.Fragment>
      <div className="h-lbl h-name">Initiative / epic</div>
      <div className="h-lbl"></div>
      <div className="h-lbl">Team</div>
      <div className="h-lbl">Status</div>
    </React.Fragment>
  );

  // ---- single-grid layout (timeline hidden) ----
  function renderFlat() {
    return (
      <div className="ov-grid">
        <div className="ov-head">{headLabels}</div>
        {visibleInits.map(init => {
          const epics = visibleEpics(init);
          const expanded = anyFilter ? true : init.open;
          const initDragOver = dragOver && dragOver.kind === "init" && dragOver.id === init.id ? dragOver.pos : null;
          return (
          <React.Fragment key={init.id}>
            <InitiativeRow
              init={init} zoom={zoom} nowWeek={nowWeek}
              ctxOpen={ctx && ctx.kind === "init" && ctx.initId === init.id}
              showTimeline={false}
              onToggle={handlers.toggleOpen} onMenu={onMenu} onStatus={handlers.openStatus}
              onResize={handlers.resizeInit} onTeamCell={onTeamCell}
              dragProps={makeDragProps("init", null, init.id)}
              dragOverPos={initDragOver}
              isDragging={draggingId === init.id}
            />
            {expanded && (
              <React.Fragment>
                {epics.map(epic => {
                  const epicDragOver = dragOver && dragOver.kind === "epic" && dragOver.id === epic.id ? dragOver.pos : null;
                  return (
                    <EpicRow
                      key={epic.id} init={init} epic={epic} zoom={zoom} nowWeek={nowWeek}
                      ctxOpen={ctx && ctx.kind === "epic" && ctx.epicId === epic.id}
                      showTimeline={false}
                      onMenu={onMenu} onStatus={handlers.openStatus}
                      onResize={handlers.resizeEpic} onAddAssignee={onAddAssignee} onTeamCell={onTeamCell}
                      dragProps={makeDragProps("epic", init.id, epic.id)}
                      dragOverPos={epicDragOver}
                      isDragging={draggingId === epic.id}
                    />
                  );
                })}
                {!anyFilter && (
                  <button className="add-epic" onClick={() => handlers.openAddEpic(init.id)}>
                    <Icon name="plus" size={14} />Add epic
                  </button>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
          );
        })}
        {!anyFilter && (
          <button className="add-initiative" onClick={handlers.openAddInitiative}>
            <Icon name="plus" size={15} />Add initiative
          </button>
        )}
        {anyFilter && visibleInits.length === 0 && (
          <div className="ov-empty">Nothing matches the current filters right now.</div>
        )}
      </div>
    );
  }

  // ---- two-pane layout (Jira pattern): fixed left pane + independently
  //      scrolling timeline pane that is clipped at the panel's right edge. ----
  function renderPanes() {
    return (
      <React.Fragment>
        {/* sticky header bar spanning both panes */}
        <div className="tl-header">
          <div className="ov-head lp-head">{headLabels}</div>
          <div className="rp-head-clip" ref={headRef}>
            <div className="rp-head-inner" style={{ width: tlW }}>
              <TimelineHeader zoom={zoom} nowWeek={nowWeek} onWeekHover={onWeekHover} />
            </div>
          </div>
        </div>

        <div className="board">
          {/* left pane — fixed width, stays put */}
          <div className="left-pane">
            {visibleInits.map(init => {
              const epics = visibleEpics(init);
              const expanded = anyFilter ? true : init.open;
              const initDragOver = dragOver && dragOver.kind === "init" && dragOver.id === init.id ? dragOver.pos : null;
              return (
                <React.Fragment key={init.id}>
                  <InitiativeRow
                    init={init} zoom={zoom} nowWeek={nowWeek}
                    ctxOpen={ctx && ctx.kind === "init" && ctx.initId === init.id}
                    showTimeline={false}
                    onToggle={handlers.toggleOpen} onMenu={onMenu} onStatus={handlers.openStatus}
                    onResize={handlers.resizeInit} onTeamCell={onTeamCell}
                    dragProps={makeDragProps("init", null, init.id)}
                    dragOverPos={initDragOver}
                    isDragging={draggingId === init.id}
                  />
                  {expanded && (
                    <React.Fragment>
                      {epics.map(epic => {
                        const epicDragOver = dragOver && dragOver.kind === "epic" && dragOver.id === epic.id ? dragOver.pos : null;
                        return (
                          <EpicRow
                            key={epic.id} init={init} epic={epic} zoom={zoom} nowWeek={nowWeek}
                            ctxOpen={ctx && ctx.kind === "epic" && ctx.epicId === epic.id}
                            showTimeline={false}
                            onMenu={onMenu} onStatus={handlers.openStatus}
                            onResize={handlers.resizeEpic} onAddAssignee={onAddAssignee} onTeamCell={onTeamCell}
                            dragProps={makeDragProps("epic", init.id, epic.id)}
                            dragOverPos={epicDragOver}
                            isDragging={draggingId === epic.id}
                          />
                        );
                      })}
                      {!anyFilter && (
                        <button className="add-epic" onClick={() => handlers.openAddEpic(init.id)}>
                          <Icon name="plus" size={14} />Add epic
                        </button>
                      )}
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            })}
            {!anyFilter && (
              <button className="add-initiative" onClick={handlers.openAddInitiative}>
                <Icon name="plus" size={15} />Add initiative
              </button>
            )}
            {anyFilter && visibleInits.length === 0 && (
              <div className="ov-empty">Nothing matches the current filters right now.</div>
            )}
          </div>

          {/* right pane — the only thing that scrolls horizontally */}
          <div className="right-pane" onScroll={syncScroll}>
            <div className="right-inner" style={{ width: tlW }}>
              {visibleInits.map(init => {
                const epics = visibleEpics(init);
                const expanded = anyFilter ? true : init.open;
                return (
                  <React.Fragment key={init.id}>
                    <InitTLRow init={init} zoom={zoom} nowWeek={nowWeek} onResize={handlers.resizeInit} />
                    {expanded && (
                      <React.Fragment>
                        {epics.map(epic => (
                          <EpicTLRow key={epic.id} init={init} epic={epic} zoom={zoom} nowWeek={nowWeek} onResize={handlers.resizeEpic} />
                        ))}
                        {!anyFilter && <div className="rp-spacer add-epic-h" />}
                      </React.Fragment>
                    )}
                  </React.Fragment>
                );
              })}
              {!anyFilter && <div className="rp-spacer add-init-h" />}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <div className="overview" data-barstyle={barStyle} data-timeline={showTimeline ? "on" : "off"}
      style={{ "--col-w": window.COL_W + "px", "--tl-w": tlW + "px" }}>
      {showTimeline ? renderPanes() : renderFlat()}

      {ctx && (
        <ContextMenu
          rect={ctx.rect} kind={ctx.kind}
          onEdit={() => handlers.openEdit(ctx.initId, ctx.epicId)}
          onDelete={() => handlers.openDelete(ctx.kind, ctx.initId, ctx.epicId, ctx.name)}
          onClose={() => setCtx(null)}
        />
      )}
      {asg && asgEpic && (
        <AssigneePicker
          rect={asg.rect} epic={asgEpic} allEpics={allEpics}
          onToggle={(pid) => handlers.toggleAssignee(asg.initId, asg.epicId, pid)}
          onClose={() => setAsg(null)}
        />
      )}
      {tip && <WeekTooltip rect={tip.rect} week={tip.week} epics={allEpics} />}
      {teamPick && (
        <TeamPicker
          rect={teamPick.rect} teams={teams} currentId={teamPick.currentId}
          onPick={(tid) => handlers.assignTeam(teamPick.kind, teamPick.initId, teamPick.epicId, tid)}
          onClose={() => setTeamPick(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { OverviewPage, FilterBar });
