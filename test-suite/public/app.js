/* Kaalvanta Test Suite — cockpit client.
   Talks to: /api/checks, /api/state, /api/run, /api/history, /api/stats */

const $ = (id) => document.getElementById(id);
const sidebar = $("sidebar");
const mainEl = $("main");
const evList = $("evList");
const rawOut = $("rawOut");
const historyList = $("historyList");
const historyMeta = $("historyMeta");
const detailTitle = $("detailTitle");
const detailDesc = $("detailDesc");
const detailState = $("detailState");
const liveDot = $("liveDot");
const bar = $("bar");
const progressText = $("progressText");
const LIVE = location.protocol.startsWith("http");

let byId = new Map();
let selected = null;
let filter = "all";
let query = "";
let sawLiveEvent = false;
const running = new Set();
const liveOk = new Set();
const timers = [];

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Evidence line → list item; "media <kind>: <path>" becomes an open link. */
function evidenceLine(line) {
  const media = line.match(/^media ([\w-]+): (.+)$/);
  if (media) {
    const href = `/api/artifact?p=${encodeURIComponent(media[2])}`;
    return (
      `<li class="good media">media <a href="${href}" target="_blank" rel="noopener">open ${escapeHtml(media[1])}</a>` +
      `<span class="muted">${escapeHtml(media[2])}</span></li>`
    );
  }
  return `<li class="${/^FAIL/.test(line) ? "bad" : "good"}">${escapeHtml(line)}</li>`;
}

const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

/* ------------------------------ sidebar ------------------------------ */

function buildSidebar() {
  sidebar.innerHTML = "";
  const groups = [];
  for (const c of byId.values()) {
    let g = groups.find((x) => x.name === c.group);
    if (!g) groups.push((g = { name: c.group, items: [] }));
    g.items.push(c.id);
  }
  const hints = {
    Preflight: "blocks everything",
    Guards: "every session",
    Journeys: "live · write + self-delete",
    Flows: "signed test events",
  };
  for (const g of groups) {
    const wrap = document.createElement("div");
    wrap.className = "group";
    const head = document.createElement("div");
    head.className = "group-head";
    head.innerHTML = `${escapeHtml(g.name)} <em>${hints[g.name] ?? ""}</em>`;
    wrap.appendChild(head);
    for (const id of g.items) {
      const c = byId.get(id);
      const row = document.createElement("div");
      row.className = "row";
      row.dataset.id = id;
      row.dataset.state = c.state;
      row.innerHTML =
        `<span class="dot"></span>` +
        `<div class="meta"><div class="name">${escapeHtml(c.label)}</div><div class="sub">${escapeHtml(c.desc)}</div></div>` +
        (c.badge ? `<span class="badge ${c.badge.toLowerCase()}">${c.badge}</span>` : "") +
        `<span class="ms" data-ms></span>`;
      row.addEventListener("click", () => select(id, { open: true }));
      row.addEventListener("dblclick", () => run([id]));
      wrap.appendChild(row);
    }
    sidebar.appendChild(wrap);
  }
}

const rowEl = (id) => sidebar.querySelector(`.row[data-id="${id}"]`);

function applyFilters() {
  const list = [...byId.values()];
  const passes = list.filter((x) => x.state === "pass").length;
  const fails = list.filter((x) => x.state === "fail").length;
  const idles = list.filter((x) => x.state === "idle" || x.state === "info").length;

  $("nAll").textContent = list.length;
  $("nPass").textContent = passes;
  $("nFail").textContent = fails;
  $("nIdle").textContent = idles;

  for (const c of list) {
    const row = rowEl(c.id);
    if (!row) continue;
    let show = true;
    if (filter === "fail" && c.state !== "fail") show = false;
    if (filter === "pass" && c.state !== "pass") show = false;
    if (filter === "idle" && !(c.state === "idle" || c.state === "info")) show = false;
    if (query && !`${c.id} ${c.label} ${c.desc}`.toLowerCase().includes(query)) show = false;
    row.style.display = show ? "" : "none";
  }

  for (const g of sidebar.querySelectorAll(".group")) {
    const any = [...g.querySelectorAll(".row")].some((r) => r.style.display !== "none");
    g.style.display = any ? "" : "none";
  }
}

function refreshCounts() {
  const list = [...byId.values()];
  const passes = list.filter((x) => x.state === "pass").length;
  const fails = list.filter((x) => x.state === "fail").length;
  const runs = list.filter((x) => x.state === "running").length;

  progressText.textContent = `${passes} / ${list.length} passed`;
  bar.style.width = list.length ? `${(passes / list.length) * 100}%` : "0%";

  const parts = [`<b>${list.length}</b> checks`];
  if (passes) parts.push(`<span class="ok">${passes} passing</span>`);
  if (fails) parts.push(`<span class="bad">${fails} failing</span>`);
  if (runs) parts.push(`<b>${runs} running</b>`);
  const idle = list.length - passes - fails - runs;
  if (idle) parts.push(`<b>${idle}</b> idle`);
  $("statusCounts").innerHTML = parts.join(` <span class="sep"></span> `);
  $("rerunFailed").disabled = fails === 0;

  applyFilters();
}

function setState(id, state) {
  const c = byId.get(id);
  if (!c) return;
  c.state = state;
  const row = rowEl(id);
  if (row) {
    row.dataset.state = state;
    row.querySelector("[data-ms]").textContent =
      state === "pass" || state === "fail" ? (c.ms ? `${c.ms}ms` : "") : state === "running" ? "…" : "";
  }
  if (id === selected) renderDetail();
  refreshCounts();
}

/* ------------------------------ detail ------------------------------ */

function select(id, opts = {}) {
  selected = id;
  sidebar.querySelectorAll(".row").forEach((r) => r.classList.toggle("selected", r.dataset.id === id));
  if (isMobile() && opts.open) mainEl.classList.add("detail-open");
  renderDetail();
  loadHistory(id);
}

function renderDetail() {
  const c = byId.get(selected);
  if (!c) return;
  detailTitle.innerHTML = `${escapeHtml(c.label)}${c.badge ? ` <span class="badge ${c.badge.toLowerCase()}">${c.badge}</span>` : ""}`;
  detailDesc.textContent = c.desc;

  detailState.className = `state-pill ${c.state}`;
  detailState.textContent =
    c.state === "running" ? "RUNNING"
    : c.state === "pass" ? `PASS${c.ms ? ` ${c.ms}ms` : ""}`
    : c.state === "fail" ? "FAIL"
    : c.state === "info" ? "INFO"
    : "IDLE";

  if (c.evidence?.length) {
    evList.innerHTML = c.evidence.map(evidenceLine).join("");
  } else {
    const msg =
      c.state === "fail"
        ? "Failed before evidence was produced — check raw output."
        : c.state === "pass"
          ? "No evidence lines for this check — see raw output below."
          : c.state === "info"
            ? "Rule-only check — nothing to run."
            : "Not run yet — press run.";
    evList.innerHTML = `<li class="empty">${msg}</li>`;
  }

  $("rawWrap").open = c.state === "fail";
  rawOut.textContent = c.out || "—";
  $("copyCmd").disabled = !c.cmd;
}

async function loadHistory(id, limit = 10) {
  try {
    const { runs } = await fetch(`/api/history?check=${encodeURIComponent(id)}&limit=${limit}`).then((r) => r.json());
    const c = byId.get(id);
    if (!c) return;
    c.history = runs;
    if (id === selected) {
      historyMeta.textContent = runs.length ? `last ${runs.length} (SQLite)` : "";
      historyList.innerHTML = runs.length
        ? runs
            .map((h) => {
              const t = new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const secs = h.ms ? ` ${(h.ms / 1000).toFixed(1)}s` : "";
              return `<span class="hchip ${h.state}" title="${new Date(h.at).toLocaleString()}">${h.state.toUpperCase()}${secs} · ${t}</span>`;
            })
            .join("")
        : `<span class="hchip info">no runs yet</span>`;
    }
  } catch {}
}

/* ------------------------------ activity ------------------------------ */

function logLine(res) {
  const bad = res.state === "fail";
  const t = new Date(res.at || Date.now()).toLocaleTimeString();
  $("statusLast").innerHTML = `last: <b>${escapeHtml(res.id)}</b> ${
    bad ? `<span class="bad">FAIL</span>` : `<span class="ok">PASS</span>`
  } <span class="sep"></span> ${t}`;
  sawLiveEvent = true;
}

/* ------------------------------ running ------------------------------ */

function confirmLive(ids) {
  const live = ids.filter((id) => byId.get(id)?.live && !liveOk.has(id));
  if (!live.length) return true;
  const ok = window.confirm(
    `LIVE checks about to run: ${live.join(", ")}\n\n` +
      "They create tagged test records in the live database, run the real flow (can send invite e-mails to a fake address), then delete the records in the same run. Continue?",
  );
  if (ok) live.forEach((id) => liveOk.add(id));
  return ok;
}

async function run(ids) {
  if (!LIVE) return;
  if (!confirmLive(ids)) return;
  const fresh = ids.filter((id) => byId.has(id) && !running.has(id));
  if (!fresh.length) return;
  fresh.forEach((id) => { running.add(id); setState(id, "running"); });
  liveDot.className = "live-dot on";
  try {
    const res = await fetch(`/api/run?ids=${fresh.join(",")}`).then((r) => r.json());
    (res.results || []).forEach(applyResult);
    await fetchStats();
  } catch {
    fresh.forEach((id) => setState(id, "fail"));
    liveDot.className = "live-dot off";
  } finally {
    fresh.forEach((id) => running.delete(id));
  }
}

function applyResult(r) {
  const c = byId.get(r.id);
  if (!c) return;
  c.ms = r.ms ?? null;
  c.at = r.at ?? Date.now();
  c.out = r.out || "";
  c.evidence = Array.isArray(r.evidence) ? r.evidence : [];
  setState(r.id, r.state);
  if (r.state === "fail" && selected !== r.id) select(r.id);
  else if (selected === r.id) loadHistory(r.id);
  logLine(r);
}

/* ------------------------------ data sync ------------------------------ */

async function fetchChecks() {
  const { checks } = await fetch("/api/checks").then((r) => r.json());
  byId = new Map(
    checks.map((c) => [c.id, { ...c, state: "idle", ms: null, at: null, out: "", evidence: [], history: [] }]),
  );
}

async function sync() {
  try {
    const { results } = await fetch("/api/state").then((r) => r.json());
    results.forEach((r) => {
      const c = byId.get(r.id);
      if (!c) return;
      c.ms = r.ms ?? null;
      c.at = r.at ?? null;
      c.out = r.out || "";
      c.evidence = Array.isArray(r.evidence) ? r.evidence : [];
      setState(r.id, r.state);
    });
    liveDot.className = "live-dot on";
    await fetchStats();
  } catch {
    liveDot.className = "live-dot off";
  }
}

async function fetchStats() {
  try {
    const s = await fetch("/api/stats").then((r) => r.json());
    const rate = s.total ? Math.round((s.pass / s.total) * 100) : 0;
    $("statusDb").innerHTML =
      `db: <b>${s.total}</b> runs` + (s.total ? ` <span class="sep"></span> <span class="${rate >= 80 ? "ok" : "bad"}">${rate}% pass</span>` : "");
    if (!sawLiveEvent && s.lastAt) {
      $("statusLast").innerHTML = `last: <span class="sep"></span> ${new Date(s.lastAt).toLocaleString()} (db)`;
    }
  } catch {}
}

/* ------------------------------ wiring ------------------------------ */

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    filter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach((x) => x.classList.toggle("active", x === chip));
    applyFilters();
  });
});

$("search").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  applyFilters();
});

$("runAll").addEventListener("click", () => run([...byId.keys()]));

$("rerunFailed").addEventListener("click", () =>
  run([...byId.values()].filter((c) => c.state === "fail").map((c) => c.id)),
);

$("runOne").addEventListener("click", () => selected && run([selected]));

$("backBtn").addEventListener("click", () => mainEl.classList.remove("detail-open"));

$("copyCmd").addEventListener("click", async () => {
  const c = byId.get(selected);
  if (!c?.cmd) return;
  const btn = $("copyCmd");
  try {
    await navigator.clipboard.writeText(c.cmd);
    btn.textContent = "copied";
  } catch {
    btn.textContent = "ctrl+c?";
  }
  setTimeout(() => (btn.textContent = "copy command"), 1200);
});

/* ------------------------------ mode toggle ------------------------------ */

async function loadMode() {
  try {
    renderMode(await fetch("/api/mode").then((r) => r.json()));
  } catch {}
}

function renderMode(m) {
  const el = $("modeToggle");
  if (!el) return;
  el.innerHTML =
    `<button class="chip mode ${m.mode === "dev" ? "active" : ""}" data-mode="dev" title="local: ${escapeHtml(m.devUrl)}">Dev</button>` +
    `<button class="chip mode ${m.mode === "live" ? "active" : ""}" data-mode="live" title="${
      m.liveReady ? `live: ${escapeHtml(m.liveUrl)}` : "live not configured — set UI_LIVE_URL + UI_LIVE_ADMIN_* in test-suite/.env"
    }" style="${m.liveReady ? "" : "opacity:.65"}">Live</button>`;
  el.querySelectorAll("button[data-mode]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        renderMode(await fetch(`/api/mode?set=${btn.dataset.mode}`).then((r) => r.json()));
      } catch {}
    }),
  );
}

/* ------------------------------ live setup ------------------------------ */

const setupModal = $("setupModal");

async function openSetup() {
  try {
    const s = await fetch("/api/settings").then((r) => r.json());
    $("cfgDevUrl").value = s.devUrl ?? "";
    $("cfgLiveUrl").value = s.liveUrl ?? "";
    $("cfgEmail").value = s.email ?? "";
    $("cfgPassword").value = s.password ?? "";
    $("cfgStatus").textContent = s.liveReady
      ? "live mode is ready - switch the toggle to Live and run"
      : "fill live URL + email + password to enable live runs";
    setupModal.classList.remove("hidden");
  } catch {}
}

if (setupModal) {
  $("liveSetup").addEventListener("click", openSetup);
  $("cfgClose").addEventListener("click", () => setupModal.classList.add("hidden"));
  setupModal.addEventListener("click", (e) => {
    if (e.target === setupModal) setupModal.classList.add("hidden");
  });
  $("cfgReveal").addEventListener("click", () => {
    const inp = $("cfgPassword");
    inp.type = inp.type === "password" ? "text" : "password";
    $("cfgReveal").textContent = inp.type === "password" ? "show" : "hide";
  });
  $("cfgSave").addEventListener("click", async () => {
    try {
      const s = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          devUrl: $("cfgDevUrl").value,
          liveUrl: $("cfgLiveUrl").value,
          email: $("cfgEmail").value,
          password: $("cfgPassword").value,
        }),
      }).then((r) => r.json());
      $("cfgStatus").textContent = s.liveReady
        ? "saved - live mode is ready"
        : "saved - still incomplete (URL + email + password all needed)";
      renderMode(s);
    } catch {
      $("cfgStatus").textContent = "save failed - is the server running?";
    }
  });
}

/* ------------------------------ boot ------------------------------ */

async function boot() {
  if (!LIVE) {
    $("note").style.display = "block";
    $("statusServer").innerHTML = `<span class="live-dot off" style="display:inline-block;vertical-align:-1px;margin-right:6px"></span>offline preview`;
    $("runAll").disabled = true;
    $("runOne").disabled = true;
    try {
      await fetchChecks();
      buildSidebar();
    } catch {}
    return;
  }

  try {
    await fetchChecks();
  } catch {
    $("note").style.display = "block";
    $("note").textContent = "Could not load the check catalog — is the server running?";
    return;
  }

  buildSidebar();
  refreshCounts();
  select([...byId.values()][0].id);
  sync();
  loadMode();

  // Auto-checks: each check carries its own cadence (seconds).
  let i = 0;
  for (const c of byId.values()) {
    if (!c.auto) continue;
    const delay = 300 + i++ * 400;
    setTimeout(() => run([c.id]), delay);
    timers.push(setInterval(() => run([c.id]), c.auto * 1000));
  }
}

boot();
