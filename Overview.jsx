/* Overview.jsx — hierarchy grid, timeline header, rows, inline popovers. */

const { useState: useStateO } = React;

function MenuBtn({ open, onClick }) {
  return (
    <button className={"menu-btn" + (open ? " open" : "")} onClick={onClick} aria-label="More">
      <Icon name="more" size={15} />
    </button>
  );
}

function InitiativeRow({ init, zoom, nowWeek, ctxOpen, showTimeline, onToggle, onMenu, onStatus, onResize }) {
  return (
    <div className="ov-row init">
      <div className="cell-name">
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

function EpicRow({ init, epic, zoom, nowWeek, ctxOpen, showTimeline, onMenu, onStatus, onResize, onAddAssignee }) {
  const byId = Object.fromEntries(window.TEAM.map(p => [p.id, p]));
  const shown = epic.assignees.slice(0, 3);
  const extra = epic.assignees.length - shown.length;
  return (
    <div className="ov-row epic">
      <div className="cell-name epic">
        <div className="name-main">
          <div className="name-row">
            <span className="name-txt">{epic.name}</span>
            <a className="ticket" href="#" onClick={(e) => e.preventDefault()} title={epic.ticket}>
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

function TimelineHeader({ zoom, nowWeek, onWeekHover }) {
  const weeks = window.TL.weeks;
  if (zoom === "monthly") {
    const groups = window.monthGroups();
    return (
      <div className="wk-strip" style={{ gridTemplateColumns: groups.map(g => g.weeks + "fr").join(" ") }}>
        {groups.map((g, i) => (
          <div key={i} className="wk-cell">
            <span className="wk-n">{g.label}</span>
            <span className="wk-d">{g.weeks} weeks</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="wk-strip" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
      {Array.from({ length: weeks }).map((_, i) => (
        <div
          key={i}
          className={"wk-cell" + (i === nowWeek ? " now" : "")}
          onMouseEnter={(e) => onWeekHover(e.currentTarget.getBoundingClientRect(), i)}
          onMouseLeave={() => onWeekHover(null, null)}
        >
          <span className="wk-n">W{i + 1}</span>
          <span className="wk-d">{window.weekLabel(i)}</span>
        </div>
      ))}
    </div>
  );
}

function StatusFilterMenu({ rect, selected, onToggle, onClear, onClose }) {
  const w = 196;
  const m = 8;
  let left = Math.min(rect.left, window.innerWidth - w - m);
  left = Math.max(m, left);
  const top = rect.bottom + 6;
  const OPTS = [
    { v: "on-track", l: "On track" },
    { v: "at-risk", l: "At risk" },
    { v: "done", l: "Done" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={onClose}>
      <div className="pop fmenu" style={{ left, top, width: w }} onClick={(e) => e.stopPropagation()}>
        <div className="fmenu-head">
          <span>Filter status</span>
          {selected.length > 0 && <button className="fmenu-clear" onClick={onClear}>Clear</button>}
        </div>
        {OPTS.map(o => {
          const on = selected.includes(o.v);
          return (
            <button key={o.v} className={"fmenu-item" + (on ? " on" : "")} onClick={() => onToggle(o.v)}>
              <span className="fmenu-box"><Icon name="check" size={11} /></span>
              <span className={"fdot " + o.v} />
              <span className="fmenu-label">{o.l}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OverviewPage({ inits, zoom, barStyle, nowWeek, filter, setFilter, showTimeline, handlers }) {
  const [ctx, setCtx] = useStateO(null);   // {rect, kind, initId, epicId, name}
  const [asg, setAsg] = useStateO(null);    // {rect, initId, epicId}
  const [tip, setTip] = useStateO(null);    // {rect, week}
  const [fmenu, setFmenu] = useStateO(null); // {rect}

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

  const asgEpic = asg ? inits.find(i => i.id === asg.initId)?.epics.find(e => e.id === asg.epicId) : null;

  // ----- status filter (multi-select) -----
  const filtering = filter.length > 0;
  const matches = (s) => filter.includes(s);
  const visibleInits = !filtering ? inits : inits.filter(i =>
    matches(i.status) || i.epics.some(e => matches(e.status)));
  function visibleEpics(init) {
    return filtering ? init.epics.filter(e => matches(e.status)) : init.epics;
  }
  function toggleStatus(v) {
    setFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  return (
    <div className="overview" data-barstyle={barStyle} data-timeline={showTimeline ? "on" : "off"}>
      <div className="ov-grid">
        <div className="ov-head">
          <div className="h-lbl h-name">Initiative / epic</div>
          <div className="h-lbl"></div>
          <button className={"h-status-filter" + (filtering ? " active" : "")}
            onClick={(e) => setFmenu({ rect: e.currentTarget.getBoundingClientRect() })}>
            Status
            {filtering ? <span className="h-filter-count">{filter.length}</span> : <Icon name="filter" size={11} />}
          </button>
          {showTimeline && <TimelineHeader zoom={zoom} nowWeek={nowWeek} onWeekHover={onWeekHover} />}
        </div>

        {visibleInits.map(init => {
          const epics = visibleEpics(init);
          const expanded = filtering ? true : init.open;
          return (
          <React.Fragment key={init.id}>
            <InitiativeRow
              init={init} zoom={zoom} nowWeek={nowWeek}
              ctxOpen={ctx && ctx.kind === "init" && ctx.initId === init.id}
              showTimeline={showTimeline}
              onToggle={handlers.toggleOpen} onMenu={onMenu} onStatus={handlers.openStatus}
              onResize={handlers.resizeInit}
            />
            {expanded && (
              <React.Fragment>
                {epics.map(epic => (
                  <EpicRow
                    key={epic.id} init={init} epic={epic} zoom={zoom} nowWeek={nowWeek}
                    ctxOpen={ctx && ctx.kind === "epic" && ctx.epicId === epic.id}
                    showTimeline={showTimeline}
                    onMenu={onMenu} onStatus={handlers.openStatus}
                    onResize={handlers.resizeEpic} onAddAssignee={onAddAssignee}
                  />
                ))}
                {!filtering && (
                  <button className="add-epic" onClick={() => handlers.openAddEpic(init.id)}>
                    <Icon name="plus" size={14} />Add epic
                  </button>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
          );
        })}

        {!filtering && (
          <button className="add-initiative" onClick={handlers.openAddInitiative}>
            <Icon name="plus" size={15} />Add initiative
          </button>
        )}
        {filtering && visibleInits.length === 0 && (
          <div className="ov-empty">Nothing matches the selected status{filter.length > 1 ? "es" : ""} right now.</div>
        )}
      </div>

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
      {fmenu && (
        <StatusFilterMenu
          rect={fmenu.rect} selected={filter}
          onToggle={toggleStatus} onClear={() => setFilter([])}
          onClose={() => setFmenu(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { OverviewPage });
