/* Seed data — generic SaaS roadmap. Plain globals consumed by the React app. */

// Rolling 1-year window starting from the most recent Monday on or before today.
(function () {
  const today = new Date();
  // Snap back to most recent Monday
  const day = today.getDay(); // 0=Sun,1=Mon...
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + diffToMon);
  startDate.setHours(0, 0, 0, 0);
  const y = startDate.getFullYear(), mo = String(startDate.getMonth()+1).padStart(2,"0"), d = String(startDate.getDate()).padStart(2,"0");
  const startISO = `${y}-${mo}-${d}`;
  const weeks = 52; // exactly 1 year
  const nowWeek = 0; // today is always in the first week
  window.TL = { weeks, startISO, nowWeek };

  // w(i) — ISO date string for Monday of week i (local-time safe)
  window._w = function(i) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  };
})();

// Shared fixed pixel width for one week column — drives header cells,
// body gridlines AND task/initiative bars so all three stay aligned.
window.COL_W = 50;

window.TEAM = [
  { id: "maya",  name: "Maya Chen",     role: "Frontend lead",       color: "#3D52A0", initials: "MC" },
  { id: "theo",  name: "Theo Park",     role: "Backend engineer",    color: "#2E9E76", initials: "TP" },
  { id: "priya", name: "Priya Nair",    role: "Product designer",    color: "#B5763A", initials: "PN" },
  { id: "dane",  name: "Dane Wolfe",    role: "Platform engineer",   color: "#7A5AE0", initials: "DW" },
  { id: "sara",  name: "Sara Iqbal",    role: "Product manager",     color: "#2F8FA6", initials: "SI" },
  { id: "leo",   name: "Leo Martins",   role: "Full-stack engineer", color: "#B0506E", initials: "LM" },
  { id: "nina",  name: "Nina Roth",     role: "QA engineer",         color: "#5E8B45", initials: "NR" },
];

// status: "on-track" | "at-risk" | "done"
window.INITIATIVES = [
  {
    id: "auth",
    name: "Authentication & accounts",
    status: "on-track",
    start: window._w(0), end: window._w(6),
    open: true,
    completed: ["Password reset shipped to GA", "SSO discovery flow in review"],
    next: ["Land MFA enforcement for admins", "Resolve SCIM scope for v1"],
    discussion: ["Sequence MFA before or after SSO GA?"],
    docs: [{ label: "Initiative brief", kind: "Doc" }, { label: "PRD", kind: "PRD" }],
    epics: [
      {
        id: "sso", name: "SSO & SAML integration", ticket: "AUTH-128",
        status: "on-track", start: window._w(0), end: window._w(3), assignees: ["maya", "theo"],
        completed: ["Provider research across Okta, Azure AD, Google", "OIDC discovery endpoint wired up"],
        next: ["SAML metadata parsing", "Admin-side connection config UI", "Just-in-time provisioning"],
        discussion: ["Do we ship SCIM user sync in v1 or defer?", "Fallback path when an IdP is unreachable"],
        docs: [{ label: "Design spec", kind: "Design" }, { label: "PRD", kind: "PRD" }, { label: "Security review", kind: "Doc" }],
      },
      {
        id: "reset", name: "Password reset flow", ticket: "AUTH-131",
        status: "done", start: window._w(0), end: window._w(2), assignees: ["leo"],
        completed: ["Token expiry + single-use enforcement", "Rate limiting on request endpoint", "Email template ship"],
        next: ["Monitor reset completion rate"],
        discussion: ["Localization of reset emails landed in QA"],
        docs: [{ label: "PRD", kind: "PRD" }],
      },
      {
        id: "mfa", name: "MFA rollout", ticket: "AUTH-140",
        status: "at-risk", start: window._w(3), end: window._w(6), assignees: ["theo", "nina"],
        completed: ["TOTP enrolment flow", "Recovery codes generation"],
        next: ["SMS fallback provider integration", "Enforce MFA for admin roles", "Audit-log every challenge"],
        discussion: ["SMS vendor contract is blocking — legal review pending", "Should enforcement be org-wide or role-scoped?"],
        docs: [{ label: "Design spec", kind: "Design" }, { label: "PRD", kind: "PRD" }],
      },
    ],
  },
  {
    id: "billing",
    name: "Billing & subscriptions",
    status: "at-risk",
    start: window._w(1), end: window._w(9),
    open: false,
    completed: ["Stripe sandbox pipeline live"],
    next: ["Staff the backfill", "Lock dual-write cutover date"],
    discussion: ["Migration scope risk — may slip a sprint", "Proration rules on mid-cycle upgrades"],
    docs: [{ label: "Migration plan", kind: "Doc" }, { label: "PRD", kind: "PRD" }],
    epics: [
      {
        id: "stripe", name: "Stripe billing migration", ticket: "BILL-204",
        status: "at-risk", start: window._w(1), end: window._w(5), assignees: ["dane", "sara"],
        completed: ["Catalog mapping legacy → Stripe products", "Sandbox webhook pipeline"],
        next: ["Backfill historical subscriptions", "Dual-write cutover plan", "Reconciliation dashboard"],
        discussion: ["Backfill is larger than scoped — needs a second engineer", "Proration edge cases on mid-cycle upgrades"],
        docs: [{ label: "Migration plan", kind: "Doc" }, { label: "PRD", kind: "PRD" }],
      },
      {
        id: "usage", name: "Usage-based pricing", ticket: "BILL-219",
        status: "on-track", start: window._w(4), end: window._w(8), assignees: ["dane"],
        completed: ["Metering event schema"],
        next: ["Aggregation job", "Tiered rate cards", "Customer-facing usage meter"],
        discussion: ["Grace handling when metering lags at month boundary"],
        docs: [{ label: "PRD", kind: "PRD" }, { label: "Design spec", kind: "Design" }],
      },
      {
        id: "invoice", name: "Invoicing redesign", ticket: "BILL-231",
        status: "on-track", start: window._w(6), end: window._w(9), assignees: ["priya", "leo"],
        completed: ["New invoice layout in Figma"],
        next: ["PDF rendering service", "Tax line-item breakdown", "Self-serve invoice download"],
        discussion: ["VAT formatting per region"],
        docs: [{ label: "Design spec", kind: "Design" }],
      },
    ],
  },
  {
    id: "analytics",
    name: "Analytics dashboard",
    status: "on-track",
    start: window._w(2), end: window._w(11),
    open: false,
    completed: ["Ingestion schema registry shipped"],
    next: ["Chart primitives for dashboard v2", "Decide export connector auth model"],
    discussion: ["Event retention window vs storage cost"],
    docs: [{ label: "Architecture doc", kind: "Doc" }, { label: "PRD", kind: "PRD" }],
    epics: [
      {
        id: "pipeline", name: "Event ingestion pipeline", ticket: "ANL-302",
        status: "on-track", start: window._w(2), end: window._w(6), assignees: ["theo", "dane"],
        completed: ["Schema registry", "Kafka topic partitioning"],
        next: ["Dead-letter queue", "Backpressure handling", "Replay tooling"],
        discussion: ["Retention window — 90 vs 180 days affects storage cost"],
        docs: [{ label: "Architecture doc", kind: "Doc" }, { label: "PRD", kind: "PRD" }],
      },
      {
        id: "dashv2", name: "Dashboard v2 UI", ticket: "ANL-318",
        status: "on-track", start: window._w(5), end: window._w(9), assignees: ["maya", "priya"],
        completed: ["Component library audit"],
        next: ["Chart primitives", "Saved views", "Cross-filter interactions"],
        discussion: ["Do we adopt a charting lib or build in-house primitives?"],
        docs: [{ label: "Design spec", kind: "Design" }, { label: "PRD", kind: "PRD" }],
      },
      {
        id: "export", name: "Export & scheduling", ticket: "ANL-327",
        status: "at-risk", start: window._w(8), end: window._w(11), assignees: ["leo", "nina"],
        completed: ["CSV export endpoint"],
        next: ["Scheduled email digests", "Warehouse sync connector", "Export size limits"],
        discussion: ["Connector auth model still undecided — OAuth vs key", "Large exports time out the request path"],
        docs: [{ label: "PRD", kind: "PRD" }],
      },
    ],
  },
  {
    id: "onboarding",
    name: "Onboarding revamp",
    status: "on-track",
    start: window._w(4), end: window._w(10),
    open: false,
    completed: ["Sample data seeding shipped to GA"],
    next: ["Build the guided setup wizard", "Wire activation email A/B framework"],
    discussion: ["Step count vs drop-off in the wizard"],
    docs: [{ label: "Initiative brief", kind: "Doc" }, { label: "PRD", kind: "PRD" }],
    epics: [
      {
        id: "wizard", name: "Guided setup wizard", ticket: "ONB-405",
        status: "on-track", start: window._w(4), end: window._w(7), assignees: ["priya", "maya"],
        completed: ["Flow mapping for 3 personas"],
        next: ["Step components", "Progress persistence", "Skip & resume logic"],
        discussion: ["How many steps before drop-off becomes a risk?"],
        docs: [{ label: "Design spec", kind: "Design" }, { label: "PRD", kind: "PRD" }],
      },
      {
        id: "seed", name: "Sample data seeding", ticket: "ONB-411",
        status: "done", start: window._w(4), end: window._w(6), assignees: ["theo"],
        completed: ["Demo dataset generator", "One-click teardown", "Per-workspace isolation"],
        next: ["Track activation lift from seeded accounts"],
        discussion: ["Shipped to GA — monitoring activation impact"],
        docs: [{ label: "PRD", kind: "PRD" }],
      },
      {
        id: "activation", name: "Activation emails", ticket: "ONB-420",
        status: "on-track", start: window._w(7), end: window._w(10), assignees: ["sara", "leo"],
        completed: ["Lifecycle trigger map"],
        next: ["Template system", "A/B framework hookup", "Unsubscribe handling"],
        discussion: ["Send-time optimization in scope?"],
        docs: [{ label: "PRD", kind: "PRD" }, { label: "Design spec", kind: "Design" }],
      },
    ],
  },
];
