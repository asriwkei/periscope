/* helpers.jsx — shared primitives: Icon set, Avatar, Pill, date utilities. */

// Opens a URL in the system browser — works in both Tauri v2 and plain browser.
function openUrl(url) {
  if (!url) return;
  if (window.__TAURI__) {
    // Tauri v2: invoke the shell plugin via core.invoke
    if (window.__TAURI__.core && window.__TAURI__.core.invoke) {
      window.__TAURI__.core.invoke('plugin:shell|open', { path: url, with: null }).catch(console.error);
    } else if (window.__TAURI__.shell) {
      // Tauri v1 fallback
      window.__TAURI__.shell.open(url);
    }
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

const ICONS = {
  overview: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  capacity: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  gantt: "M8 6h12M8 12h9M8 18h6M3 6h.01M3 12h.01M3 18h.01",
  milestones: "M4 21V4a1 1 0 0 1 1-1h11l-2.5 4L16 11H5M4 21H3M4 21h2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  chevron: "M9 18l6-6-6-6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
  plus: "M12 5v14M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54z",
  grip: "M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  panelClose: "M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM15 3v18M10 9l-3 3 3 3",
  panelOpen: "M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM15 3v18M7 9l3 3-3 3",
};

function Icon({ name, size = 16, sw = 1.75, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
         style={style}>
      <path d={ICONS[name]} />
    </svg>
  );
}

function Avatar({ person, size }) {
  if (!person) return null;
  const st = size ? { "--sz": size + "px" } : undefined;
  return (
    <span className="avatar" style={{ background: person.color, ...st }} title={person.name}>
      {person.initials}
    </span>
  );
}

const STATUS_LABEL = { "on-track": "On track", "at-risk": "Needs attention", "done": "Done", "todo": "To Do", "blocked": "Blocked" };

function Pill({ status, onClick, isStatic }) {
  return (
    <span className={"pill " + status + (isStatic ? " static" : "")} onClick={onClick}>
      <span className="dot" />
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ---------- date helpers ---------- */
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function weekMonday(i) {
  const d = new Date(window.TL.startISO + "T00:00:00");
  d.setDate(d.getDate() + i * 7);
  return d;
}
function fmtDay(d) { return MONTH[d.getMonth()] + " " + d.getDate(); }
function weekLabel(i) { return fmtDay(weekMonday(i)); }

// ISO 8601 week number for a Date: weeks start Monday, week 1 contains the
// first Thursday of the year. Computed in UTC to avoid DST drift.
// Check: Monday 2026-06-01 → 23.
function isoWeekNum(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;          // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3);        // Thursday of this week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const fdDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fdDayNum + 3);
  return 1 + Math.round((d - firstThursday) / 604800000);
}

// period string for a [startISO, endISO] span (inclusive ISO date strings)
function periodLabel(startISO, endISO) {
  const a = new Date(startISO + "T00:00:00");
  const b = new Date(endISO + "T00:00:00");
  return fmtDay(a) + " – " + fmtDay(b);
}

// month groups across the 12-week window: [{label, weeks}]
function monthGroups() {
  const groups = [];
  for (let i = 0; i < window.TL.weeks; i++) {
    const m = weekMonday(i).getMonth();
    const last = groups[groups.length - 1];
    if (last && last.m === m) last.weeks++;
    else groups.push({ m, label: MONTH[m], weeks: 1 });
  }
  return groups;
}

Object.assign(window, { Icon, Avatar, Pill, STATUS_LABEL, weekMonday, weekLabel, isoWeekNum, periodLabel, monthGroups, openUrl });

// person helpers
const PERSON_COLORS = ["#3D52A0", "#2E9E76", "#B5763A", "#7A5AE0", "#2F8FA6", "#B0506E", "#5E8B45", "#C0392B", "#1E7A8C", "#8A5A2B"];
function makeInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function nextColor(team) {
  const used = new Set(team.map(p => p.color));
  return PERSON_COLORS.find(c => !used.has(c)) || PERSON_COLORS[team.length % PERSON_COLORS.length];
}
Object.assign(window, { PERSON_COLORS, makeInitials, nextColor });
