// app.js — shared logic for all pages. Data comes only from data/*.json (see AGENTS.md).

const COMMUNITIES = ["koeln", "bonn", "neuss", "burscheid"];
const TYPE_LABELS = { gathering: "Gathering", solidarity: "Solidarity", formation: "Formation", pilgrimage: "Pilgrimage" };
const SEASON_LABELS = { november: "November feasts", christmas: "Advent & Christmas", easter: "Lent & Easter", marian: "Marian feasts" };
const NOT_CONFIRMED = "Not confirmed yet";

const params = new URLSearchParams(location.search);
const app = document.getElementById("app");
let info, masses, events;

/* ---------- small helpers ---------- */

// Today's date as YYYY-MM-DD. ?today=YYYY-MM-DD overrides it (SPEC §8).
function todayISO() {
  const p = params.get("today");
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = todayISO();

function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso, long = false) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", long
    ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    : { weekday: "short", day: "numeric", month: "short" });
}
const fmtShort = iso => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const fmtRange = (a, b) => a === b ? fmtDate(a) : `${fmtShort(a)} – ${fmtShort(b)}`;
function fmtMonth(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
function dayLabel(iso) {
  if (iso === TODAY) return "Today";
  if (iso === addDays(TODAY, 1)) return "Tomorrow";
  return fmtDate(iso);
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
const label = c => info.communities[c]?.label ?? c;
const orNC = v => (v === null || v === undefined || v === "") ? `<span class="nc">${NOT_CONFIRMED}</span>` : esc(v);

// Grey placeholder box (no image, hidden from screen readers).
const PH = `<span class="ph" aria-hidden="true"></span>`;

// Remembered community: ?c= (QR code) > localStorage > Köln.
function getCommunity() {
  const p = params.get("c");
  if (COMMUNITIES.includes(p)) { saveCommunity(p); return p; }
  try { const s = localStorage.getItem("community"); if (COMMUNITIES.includes(s)) return s; } catch (e) {}
  return "koeln";
}
function saveCommunity(c) { try { localStorage.setItem("community", c); } catch (e) {} }

const upcoming = list => list.filter(x => x.date >= TODAY);

function groupByMonth(list) {
  const out = [];
  list.forEach(x => {
    const m = x.date.slice(0, 7);
    if (!out.length || out[out.length - 1].m !== m) out.push({ m, label: fmtMonth(x.date), items: [] });
    out[out.length - 1].items.push(x);
  });
  return out;
}

// Chips = a row of toggle buttons. `selected` is a value or a test function.
function chips(name, options, selected) {
  const on = typeof selected === "function" ? selected : v => v === selected;
  return `<div class="chips" role="group" aria-label="${esc(name)}">` +
    options.map(([v, t]) => `<button type="button" class="chip" data-group="${esc(name)}" data-value="${esc(v)}" aria-pressed="${on(v)}">${esc(t)}</button>`).join("") +
    `</div>`;
}
// Click handler for a chip group; keeps keyboard focus on the chip after a redraw.
function onChip(group, fn) {
  app.querySelectorAll(`.chip[data-group="${group}"]`).forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.value;
    fn(v);
    const again = app.querySelector(`.chip[data-group="${group}"][data-value="${v}"]`);
    if (again && again !== b) again.focus();
  }));
}

/* ---------- shared pieces ---------- */

function statusBadge(m) {
  if (m.status === "cancelled") return `<span class="badge badge-off">Cancelled</span>`;
  if (m.status === "postponed") return `<span class="badge badge-off">Postponed</span>`;
  return "";
}

function massRow(m, showCommunity = false) {
  const off = m.status ? " is-off" : "";
  return `<li class="mass-row${off}${m.special ? " is-special" : ""}">
    <div class="mass-date"><b>${new Date(m.date + "T12:00:00").getDate()}</b><span>${fmtDate(m.date).split(" ")[0]}</span></div>
    <div class="mass-text">
      <b>${esc(m.time)} · ${esc(m.church)}${showCommunity ? " · " + esc(label(m.community)) : ""}</b>
      <span>${esc(m.title)}</span>
      ${m.note ? `<small>${esc(m.note)}</small>` : ""}
    </div>
    ${statusBadge(m)}
  </li>`;
}

// Event card: grey placeholder (circle on phones, rectangle on desktop) + text.
function eventCard(e) {
  const meta = [e.place, label(e.community)].filter(Boolean).map(esc).join(" · ");
  return `<li><a class="card" href="event.html?id=${encodeURIComponent(e.id)}">
    ${PH}
    <span class="card-body">
      <small class="when">${esc(dayLabel(e.date))} · ${esc(e.time)}</small>
      <b>${esc(e.title)}</b>
      <span class="meta">${meta}</span>
      <span class="tags"><em>${esc(TYPE_LABELS[e.type] ?? e.type)}</em>${e.signup ? "<em>Sign-up</em>" : ""}${e.note ? "<em>Check time</em>" : ""}</span>
    </span>
  </a></li>`;
}

const cardList = list => groupByMonth(list).map(g => `<h2 class="month">${esc(g.label)}</h2><ul class="cards">${g.items.map(eventCard).join("")}</ul>`).join("");

function renderFooter() {
  const o = info.office;
  document.getElementById("footer").innerHTML = `
    <p><b>Questions?</b> Mission office · <a href="tel:${o.phone.replace(/\s/g, "")}">${esc(o.phone)}</a> · <a href="mailto:${esc(o.email)}">${esc(o.email)}</a></p>
    <p>Office hours: ${o.hours.map(esc).join(" · ")}</p>
    <p>Official site: <a href="${esc(info.official)}">missaoportuguesa.com</a> · Instagram ${esc(info.instagram)}</p>
    <p class="small">Student project (KISD, "Location date") – not an official site of the Mission. Source of all dates: ${esc(masses && "PDF bulletin Sep–Dec 2026 and Instagram")}.</p>`;
}

/* ---------- pages ---------- */

// Upcoming feasts for the Today sidebar: special Masses and seasonal events, grouped by title with a date range.
function upcomingFeasts() {
  const out = new Map();
  const add = (key, title, date, href) => {
    const g = out.get(key);
    if (!g) out.set(key, { title, from: date, to: date, href });
    else { if (date < g.from) g.from = date; if (date > g.to) g.to = date; }
  };
  upcoming(masses).filter(m => m.special && !m.status).forEach(m => add("m:" + m.title, m.title, m.date, "masses.html?f=feasts"));
  upcoming(events).filter(e => e.season).forEach(e => add("e:" + e.title, e.title, e.date, `events.html?season=${e.season}`));
  return [...out.values()].sort((a, b) => a.from.localeCompare(b.from)).slice(0, 4);
}

function pageToday() {
  let c = getCommunity();
  const draw = () => {
    const mine = upcoming(masses).filter(m => m.community === c);
    const next = mine[0];
    const nextOn = mine.find(m => !m.status);
    const week = upcoming(events).filter(e => e.date <= addDays(TODAY, 7));
    const alerts = upcoming(masses).filter(m => m.status && m.date <= addDays(TODAY, 7));
    const sameDay = next ? events.filter(e => e.date === next.date && e.community === c) : [];
    // Sign-ups: known deadlines first, unknown deadlines last.
    const signups = upcoming(events).filter(e => e.signup)
      .sort((a, b) => (a.signup.until || "9999").localeCompare(b.signup.until || "9999"));
    const feasts = upcomingFeasts();

    let nextHtml = `<p class="empty">No upcoming Masses in the bulletin for ${esc(label(c))}. ${NOT_CONFIRMED}.</p>`;
    if (next) {
      nextHtml = `<div class="hero${next.status ? " is-off" : ""}">
        <small class="when">${esc(dayLabel(next.date))} · ${esc(next.time)}</small>
        <b class="hero-title">Mass – ${esc(next.church)}</b>
        <span>${esc(next.title)}</span>
        ${statusBadge(next)}
        ${next.note ? `<small class="hero-note">${esc(next.note)}</small>` : ""}
      </div>`;
      if (next.status && nextOn) nextHtml += `<p class="after">Next Mass that takes place: <b>${esc(fmtDate(nextOn.date))} · ${esc(nextOn.time)} · ${esc(nextOn.church)}</b></p>`;
      if (sameDay.length) nextHtml += `<p class="after">Also that day: ${sameDay.map(e => `<a href="event.html?id=${e.id}">${esc(e.title)} · ${esc(e.time)}</a>`).join(", ")}</p>`;
    }

    app.innerHTML = `
      <h1 class="visually-hidden">Today</h1>
      ${chips("community", COMMUNITIES.map(k => [k, label(k)]), c)}
      <div class="layout layout-today">
        <div class="col-main">
          <section aria-labelledby="h-next">
            <div class="sec-head"><h2 id="h-next">Next Mass in ${esc(label(c))}</h2><a href="masses.html">See all</a></div>
            ${nextHtml}
          </section>
          ${alerts.length ? `<section class="alerts" aria-labelledby="h-chg"><h2 id="h-chg" class="visually-hidden">Changes in the next 7 days</h2><ul>${alerts.map(m => `<li><b>${esc(label(m.community))}:</b> ${m.status === "postponed" ? "Mass postponed" : "no Mass"} on ${esc(fmtDate(m.date))}</li>`).join("")}</ul></section>` : ""}
          <section aria-labelledby="h-week">
            <div class="sec-head"><h2 id="h-week">This week</h2><a href="events.html">See all</a></div>
            ${week.length ? `<ul class="cards">${week.map(eventCard).join("")}</ul>` : `<p class="empty">No events in the next 7 days.</p>`}
          </section>
        </div>
        <aside class="col-side" aria-label="Sign-ups, feasts and creating an event">
          <section aria-labelledby="h-sign">
            <div class="sec-head"><h2 id="h-sign">Sign-ups closing soon</h2><a href="events.html?signup=1">See all</a></div>
            ${signups.length ? `<ul class="rows">${signups.map(e => `<li><a href="event.html?id=${e.id}"><b>${esc(e.title)}</b><small>${e.signup.until ? "until " + esc(fmtDate(e.signup.until)) : "Deadline: " + NOT_CONFIRMED}</small></a></li>`).join("")}</ul>` : `<p class="empty">No open sign-ups right now.</p>`}
          </section>
          <section aria-labelledby="h-feasts">
            <div class="sec-head"><h2 id="h-feasts">Upcoming feasts</h2></div>
            ${feasts.length ? `<ul class="rows">${feasts.map(g => `<li><a href="${g.href}"><b>${esc(g.title)}</b><small class="nowrap">${esc(fmtRange(g.from, g.to))}</small></a></li>`).join("")}</ul>` : `<p class="empty">No feasts in the bulletin right now.</p>`}
          </section>
          <section class="box create-box" aria-labelledby="h-create">
            <h2 id="h-create">Do you have a community event?</h2>
            <a class="btn" href="create.html">+ Create event</a>
          </section>
        </aside>
      </div>`;
    onChip("community", v => { c = v; saveCommunity(v); draw(); });
  };
  draw();
}

function pageMasses() {
  let c = COMMUNITIES.includes(params.get("c")) ? params.get("c") : getCommunity();
  let f = ["christmas", "easter", "feasts"].includes(params.get("f")) ? params.get("f") : "upcoming";
  const draw = () => {
    let list = upcoming(masses).filter(m => m.community === c);
    if (f === "christmas") list = list.filter(m => m.season === "christmas");
    if (f === "feasts") list = list.filter(m => m.special);
    const empty = f === "easter"
      ? "Lent & Easter dates are not out yet – the Mission publishes them in the new bulletin in January."
      : "No dates in the bulletin for this selection.";
    if (f === "easter") list = [];
    const reg = info.communities[c].regular;
    app.innerHTML = `
      <div class="layout layout-masses">
        <h1 class="page-title">Masses in ${esc(label(c))}</h1>
        <aside class="col-side" aria-labelledby="h-comm">
          <h2 id="h-comm" class="desk-h">Community</h2>
          ${chips("community", COMMUNITIES.map(k => [k, label(k)]), c)}
          <div class="regular"><small>REGULAR SCHEDULE · ${esc(label(c).toUpperCase())}</small>
            ${reg.map(r => `<p><b>${esc(r.day)} ${esc(r.time)}</b> · ${esc(r.church)}<br><span>${esc(r.address)}</span></p>`).join("")}</div>
        </aside>
        <section class="col-main" aria-label="Mass dates">
          ${chips("filter", [["upcoming", "Upcoming"], ["christmas", "Advent & Christmas"], ["easter", "Lent & Easter"], ["feasts", "Feasts"]], f)}
          ${list.length ? groupByMonth(list).map(g => `<h2 class="month">${esc(g.label)}</h2><ul class="mass-list">${g.items.map(m => massRow(m)).join("")}</ul>`).join("") : `<p class="empty">${esc(empty)}</p>`}
        </section>
      </div>`;
    onChip("community", v => { c = v; saveCommunity(v); draw(); });
    onChip("filter", v => { f = v; draw(); });
  };
  draw();
}

// Events: one filter state, shown as chips on phones and checkboxes on desktop.
function pageEvents() {
  const sel = { type: new Set(), season: new Set(), comm: new Set() };
  let signup = params.get("signup") === "1";
  if (SEASON_LABELS[params.get("season")]) sel.season.add(params.get("season"));
  const groups = [
    ["type", "Type", "All", TYPE_LABELS],
    ["season", "Season", "Any season", SEASON_LABELS],
    ["comm", "Community", "All communities", Object.fromEntries(COMMUNITIES.map(k => [k, label(k)]))]
  ];

  app.innerHTML = `
    <div class="layout layout-events">
      <h1 class="page-title">Events</h1>
      <aside class="col-side" aria-label="Filters">
        <div class="mobile-only">
          ${groups.map(([g, , all, opts]) => chips(g, [["all", all], ...Object.entries(opts)], () => false)).join("")}
          <label class="toggle"><input type="checkbox" data-signup> Only events with sign-up</label>
        </div>
        <div class="desk-only filters">
          <h2>Filters</h2>
          ${groups.map(([g, name, , opts]) => `<fieldset><legend>${esc(name)}</legend>
            ${Object.entries(opts).map(([v, t]) => `<label class="check"><input type="checkbox" data-group="${g}" value="${esc(v)}"> ${esc(t)}</label>`).join("")}
          </fieldset>`).join("")}
          <fieldset><legend>Other</legend><label class="check"><input type="checkbox" data-signup> Sign-up needed</label></fieldset>
        </div>
      </aside>
      <section class="col-main" aria-label="Results">
        <p class="count" id="count" aria-live="polite"></p>
        <div id="results"></div>
      </section>
    </div>`;

  // Show the state on chips and checkboxes, then redraw only the results.
  const draw = () => {
    app.querySelectorAll(".chip").forEach(b => {
      const s = sel[b.dataset.group];
      b.setAttribute("aria-pressed", b.dataset.value === "all" ? s.size === 0 : s.has(b.dataset.value));
    });
    app.querySelectorAll(".check input[data-group]").forEach(i => { i.checked = sel[i.dataset.group].has(i.value); });
    app.querySelectorAll("[data-signup]").forEach(i => { i.checked = signup; });

    let list = upcoming(events);
    if (sel.type.size) list = list.filter(e => sel.type.has(e.type));
    if (sel.season.size) list = list.filter(e => sel.season.has(e.season));
    if (sel.comm.size) list = list.filter(e => sel.comm.has(e.community));
    if (signup) list = list.filter(e => e.signup);
    const later = sel.season.has("easter") || sel.season.has("marian");
    document.getElementById("count").textContent = `${list.length} event${list.length === 1 ? "" : "s"}`;
    document.getElementById("results").innerHTML = list.length ? cardList(list)
      : `<p class="empty">No events for this selection. ${later ? "Dates for 2027 come with the new bulletin in January." : ""}</p>`;
  };

  groups.forEach(([g]) => onChip(g, v => { sel[g] = v === "all" ? new Set() : new Set([v]); draw(); }));
  app.querySelectorAll(".check input[data-group]").forEach(i => i.addEventListener("change", () => {
    i.checked ? sel[i.dataset.group].add(i.value) : sel[i.dataset.group].delete(i.value);
    draw();
  }));
  app.querySelectorAll("[data-signup]").forEach(i => i.addEventListener("change", () => { signup = i.checked; draw(); }));
  draw();
}

function pageEvent() {
  const e = events.find(x => x.id === params.get("id"));
  if (!e) { app.innerHTML = `<h1>Event not found</h1><p><a href="events.html">See all events</a></p>`; return; }
  document.title = `${e.title} · ${info.name}`;
  const su = e.signup ? `${esc(e.signup.how)}${e.signup.until ? " · until " + esc(fmtDate(e.signup.until)) : ""}${e.signup.note ? " · " + esc(e.signup.note) : ""}` : `<span class="nc">${NOT_CONFIRMED}</span>`;
  const city = { koeln: "Köln", bonn: "Bonn", neuss: "Neuss", burscheid: "Burscheid" }[e.community];
  const o = info.office;
  app.innerHTML = `
    <nav class="crumb" aria-label="Breadcrumb"><a href="events.html">Events</a> › <span>${esc(e.title)}</span></nav>
    <div class="layout layout-event">
      <article class="col-main">
        <span class="ph ph-big" aria-hidden="true"></span>
        <small class="when">${esc(fmtDate(e.date, true))} · ${esc(e.time)}</small>
        <h1>${esc(e.title)}</h1>
        <p class="sub">${esc(e.place)} · ${esc(label(e.community))} · <em class="tag">${esc(TYPE_LABELS[e.type])}</em></p>
        ${e.note ? `<p class="warn">${esc(e.note)}</p>` : ""}
        <dl class="facts">
          <div><dt>Language</dt><dd>${orNC(e.language)}</dd></div>
          <div><dt>For whom</dt><dd>${orNC(e.forWhom)}</dd></div>
          <div><dt>Bring</dt><dd>${orNC(e.bring)}</dd></div>
          <div><dt>Sign-up</dt><dd>${su}</dd></div>
        </dl>
        <h2>What happens</h2>
        <p>${orNC(e.what)}</p>
        ${e.programme.length ? `<table class="prog">${e.programme.map(p => `<tr><th>${esc(p[0])}</th><td>${esc(p[1])}</td></tr>`).join("")}</table>` : ""}
        <p class="small">Source: ${esc(e.source)}.</p>
      </article>
      <aside class="col-side" aria-label="Date, place and actions">
        <div class="box">
          <p class="desk-only box-when"><b>${esc(fmtDate(e.date))} · ${esc(e.time)}</b><br><span class="small">${esc(e.place)}, ${esc(city)}</span></p>
          <span class="ph ph-map desk-only" aria-hidden="true">Map</span>
          <div class="actions">
            <button type="button" class="btn" id="ics">Add to calendar</button>
            <a class="btn btn-2" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.place + ", " + city)}">Directions</a>
            <button type="button" class="btn btn-2" id="share">Share</button>
          </div>
          <p class="small share-msg" id="share-msg" role="status"></p>
        </div>
        <div class="box">
          <h2 class="box-h">Questions?</h2>
          <p>Mission office · <a href="tel:${o.phone.replace(/\s/g, "")}">${esc(o.phone)}</a></p>
        </div>
      </aside>
    </div>`;
  document.getElementById("ics").addEventListener("click", () => downloadIcs(e));
  document.getElementById("share").addEventListener("click", () => shareLink(e));
}

// Share: Web Share API on phones, otherwise copy the link and say "Link copied".
function shareLink(e) {
  const url = location.href;
  const msg = document.getElementById("share-msg");
  if (navigator.share && matchMedia("(pointer: coarse)").matches) {
    navigator.share({ title: e.title, url }).catch(() => {}); // closing the share sheet is not an error
    return;
  }
  copyText(url).then(
    () => { msg.textContent = "Link copied"; setTimeout(() => { msg.textContent = ""; }, 3000); },
    () => { msg.textContent = "Copy this link: " + url; }
  );
}
function copyText(t) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
  // Older browsers / file:// — copy through a hidden text field.
  return new Promise((ok, fail) => {
    const a = document.createElement("textarea");
    a.value = t; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.opacity = "0";
    document.body.appendChild(a); a.select();
    let done = false;
    try { done = document.execCommand("copy"); } catch (err) {}
    a.remove();
    done ? ok() : fail();
  });
}

// Creates a simple .ics file for the event (start time only, 1 h default length).
function downloadIcs(e) {
  const t = (e.time.match(/\d{2}:\d{2}/) || ["12:00"])[0].replace(":", "");
  const d = e.date.replace(/-/g, "");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//location-date//EN", "BEGIN:VEVENT",
    `UID:${e.id}@location-date`, `DTSTART;TZID=Europe/Berlin:${d}T${t}00`, `SUMMARY:${e.title}`,
    `LOCATION:${e.place}`, `DESCRIPTION:${(e.what || "").replace(/\n/g, " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = e.id + ".ics";
  a.click();
}

// Card for the create preview and the thank-you screen (not a link). Shows only what the user typed.
function previewCard(d) {
  const meta = [d.place, d.community && label(d.community)].filter(Boolean).map(esc).join(" · ");
  const type = d.type ? (TYPE_LABELS[d.type] ?? "Other") : "";
  return `<div class="card card-static">
    ${PH}
    <span class="card-body">
      <small class="when">${d.date ? esc(fmtDate(d.date)) : "Date"} · ${d.time ? esc(d.time) : "Time"}</small>
      <b>${d.title ? esc(d.title) : "Event name"}</b>
      <span class="meta">${meta || "Place · Community"}</span>
      ${type ? `<span class="tags"><em>${esc(type)}</em></span>` : ""}
    </span>
  </div>`;
}

function pageCreate() {
  // Required fields and their labels (for the error message).
  const NEED = { title: "Event name", type: "Type", community: "Community", date: "Date", time: "Time",
    place: "Place / room", what: "Description", language: "Language", forWhom: "For whom" };
  const radios = (name, legend, opts) => `<fieldset class="field"><legend>${legend}</legend><div class="chips chips-wrap">` +
    opts.map(([v, t]) => `<label class="chip-r"><input type="radio" name="${name}" value="${esc(v)}"><span>${esc(t)}</span></label>`).join("") +
    `</div></fieldset>`;

  app.innerHTML = `
    <p class="crumb small">Create event</p>
    <div class="layout layout-create">
      <div class="col-main">
        <h1>Create event</h1>
        <p class="sub">Anyone can suggest a community event.</p>
        <form id="f" novalidate>
          <label class="field">Event name<input name="title" placeholder="e.g. Community café"></label>
          <div class="grid-2">
            ${radios("type", "Type", [...Object.entries(TYPE_LABELS), ["other", "Other"]])}
            ${radios("community", "Community", COMMUNITIES.map(k => [k, label(k)]))}
          </div>
          <div class="grid-3">
            <label class="field">Date<input type="date" name="date"></label>
            <label class="field">Time<input type="time" name="time"></label>
            <label class="field">Place / room<input name="place" placeholder="e.g. Parish hall St. Joseph"></label>
          </div>
          <label class="field">Description – what will happen?<textarea name="what" rows="4" placeholder="e.g. Afternoon get-together with coffee and cake after Mass. Bring a sweet from your region…"></textarea></label>
          <div class="grid-3">
            <label class="field">Language<input name="language" placeholder="e.g. Portuguese"></label>
            <label class="field">For whom<input name="forWhom" placeholder="e.g. everyone, families"></label>
            <label class="field">Sign-up<select name="signup"><option>Not needed</option><option>Needed – by e-mail</option><option>Needed – on site</option></select></label>
          </div>
          <div class="field">
            <span id="img-l">Image (optional)</span>
            <label class="upload"><input type="file" name="image" accept="image/*" class="visually-hidden" aria-labelledby="img-l img-name"><span id="img-name">Upload poster or photo</span></label>
          </div>
          <p class="hint mobile-only">The event appears once the office has confirmed it.</p>
          <p class="hint">This is a prototype: nothing is sent, saved or uploaded.</p>
          <p class="error" id="err" role="alert" hidden></p>
          <div class="form-actions">
            <a class="btn btn-2" href="index.html">Cancel</a>
            <button class="btn" type="submit">Send for confirmation</button>
          </div>
        </form>
      </div>
      <aside class="col-side desk-only" aria-label="Preview and how it works">
        <section class="box" aria-labelledby="h-pv">
          <h2 id="h-pv" class="box-h">Preview</h2>
          <div id="pv"></div>
        </section>
        <section class="box" aria-labelledby="h-how">
          <h2 id="h-how" class="box-h">How it works</h2>
          <p><b>The event appears once the office has confirmed it.</b></p>
        </section>
      </aside>
    </div>`;

  const f = document.getElementById("f");
  const pv = document.getElementById("pv");
  const data = () => Object.fromEntries(new FormData(f));
  const update = () => { pv.innerHTML = previewCard(data()); };
  f.addEventListener("input", update);
  f.addEventListener("change", update);
  update();

  // Simulated upload: only the file name is shown, the file is never read or sent.
  f.image.addEventListener("change", () => {
    const file = f.image.files[0];
    document.getElementById("img-name").textContent = file ? `${file.name} – not uploaded (prototype)` : "Upload poster or photo";
  });

  f.addEventListener("submit", ev => {
    ev.preventDefault();
    const d = data();
    const missing = Object.keys(NEED).filter(n => !String(d[n] ?? "").trim());
    const err = document.getElementById("err");
    if (missing.length) {
      err.hidden = false;
      err.textContent = "Please fill in: " + missing.map(n => NEED[n]).join(", ") + ".";
      f.querySelector(`[name="${missing[0]}"]`).focus();
      return;
    }
    app.innerHTML = `<h1>Thank you!</h1>
      <p class="sub">Your event was sent to the Mission office. It will appear in <b>Events</b> once it is confirmed (simulated – nothing was saved).</p>
      <div class="thanks-card">${previewCard(d)}</div>
      <p class="thanks-what">${esc(d.what)}</p>
      <p><a class="btn btn-2" href="index.html">Back to Today</a></p>`;
  });
}

/* ---------- start ---------- */

async function start() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".main-nav a").forEach(a => { if (a.dataset.nav === page || (page === "event" && a.dataset.nav === "events")) a.setAttribute("aria-current", "page"); });
  try {
    [info, masses, events] = await Promise.all(["info", "masses", "events"].map(n => fetch(`data/${n}.json`).then(r => r.json())));
    masses = masses.masses; events = events.events;
  } catch (e) {
    app.innerHTML = `<p class="empty">Could not load the data. Please check your connection and reload.</p>`;
    return;
  }
  renderFooter();
  ({ index: pageToday, masses: pageMasses, events: pageEvents, event: pageEvent, create: pageCreate })[page]();
}
start();
