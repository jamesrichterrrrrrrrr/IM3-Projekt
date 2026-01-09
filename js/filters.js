async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

let TOTAL_QUAKES = null;

/* -------------------------
   UI helpers
   ------------------------- */
function updateSelectActiveState(selectEl) {
  if (!selectEl) return;

  const val = selectEl.value;
  const inactiveValues = new Set(["all", "0", "", null]);

  selectEl.classList.toggle("is-active", !inactiveValues.has(val));
}

function shortenLocation(raw) {
  if (!raw) return "";
  if (raw.includes(",")) return raw.split(",").pop().trim();
  return raw.replace(/^\d+\s*km\s+[A-Z]+\s+of\s+/i, "").trim();
}

function formatDate(utcString) {
  const d = new Date(utcString.replace(" ", "T") + "Z");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function setOptions(selectEl, options, includeAllLabel) {
  if (!selectEl) return;

  selectEl.innerHTML = "";

  if (includeAllLabel) {
    const opt = document.createElement("option");
    opt.value = "all";
    opt.textContent = includeAllLabel;
    selectEl.appendChild(opt);
  }

  options.forEach((o) => {
    const opt = document.createElement("option");
    opt.value = o.value ?? o;
    opt.textContent = o.label ?? o;
    selectEl.appendChild(opt);
  });
}

function magnitudeClass(mag) {
  if (mag >= 6.5) return "red";
  if (mag >= 5.7) return "pink";
  return "green";
}

/* -------------------------
   Rendering
   ------------------------- */
function quakeRowHTML(q) {
  const locShort = shortenLocation(q.location);
  const mag = Number(q.magnitude);

  const depth =
    q.depth_km === null || q.depth_km === undefined
      ? "—"
      : `${Number(q.depth_km).toFixed(1)} km`;

  return `
    <div class="playlist-item" onclick="window.location.href='playlist.html?quake_id=${q.id}'">
      <div class="magnitude ${magnitudeClass(mag)}">${mag.toFixed(1)}</div>
      <div class="location">in <span>${locShort}</span></div>
      <div class="date">${formatDate(q.time_utc)}</div>
      <div class="depth">${depth}</div>
      <div class="songs">Playlist</div>
    </div>
  `;
}

async function loadTotalQuakeCount() {
  if (TOTAL_QUAKES !== null) return TOTAL_QUAKES;

  try {
    const data = await fetchJSON("api/get-quake-counts.php");
    TOTAL_QUAKES = Number(data.total) || 0;
    return TOTAL_QUAKES;
  } catch (e) {
    console.warn("Could not load total quake count", e);
    TOTAL_QUAKES = null;
    return null;
  }
}

function renderList(quakes, total = null, { append = false } = {}) {
  const list = document.getElementById("quake-list");
  const count = document.getElementById("quake-list-count");
  if (!list || !count) return;

  if (!append) {
    if (quakes.length === 0) {
      list.innerHTML = `<div style="padding:12px; opacity:0.8;">No results.</div>`;
    } else {
      list.innerHTML = quakes.map(quakeRowHTML).join("");
    }
  } else if (quakes.length > 0) {
    list.insertAdjacentHTML("beforeend", quakes.map(quakeRowHTML).join(""));
  }

  const shown = list.querySelectorAll(".playlist-item").length;

  count.textContent =
    typeof total === "number" ? `${shown} Playlists (of ${total})` : `${shown} Playlists`;
}

/* -------------------------
   Pagination
   ------------------------- */
let currentOffset = 0;
const pageSize = 10;
let lastQueryKey = "";

function getFilterState() {
  const country = document.getElementById("countryFilter")?.value ?? "all";
  const range = document.getElementById("dateFilter")?.value ?? "all";
  const tod = document.getElementById("timeFilter")?.value ?? "all";
  const minmag = document.getElementById("magnitudeFilter")?.value ?? "0";
  const depth = document.getElementById("depthFilter")?.value ?? "all";
  return { country, range, tod, minmag, depth };
}

function makeQueryKey(s) {
  return `${s.country}|${s.range}|${s.tod}|${s.minmag}|${s.depth}`;
}

function setLoadMoreState({ gotCount, limit }) {
  const btn = document.getElementById("load-more-btn");
  if (!btn) return;

  btn.style.display = "inline-block";

  if (gotCount < limit) {
    btn.disabled = true;
    btn.textContent = "No more results";
  } else {
    btn.disabled = false;
    btn.textContent = "Load more";
  }
}

async function loadQuakes({ append = false } = {}) {
  const s = getFilterState();
  const key = makeQueryKey(s);

  if (key !== lastQueryKey) {
    lastQueryKey = key;
    currentOffset = 0;
    append = false;
  }

  const url =
    `api/search-quakes.php?` +
    `loc=${encodeURIComponent(s.country)}` +
    `&range=${encodeURIComponent(s.range)}` +
    `&tod=${encodeURIComponent(s.tod)}` +
    `&minmag=${encodeURIComponent(s.minmag)}` +
    `&depth=${encodeURIComponent(s.depth)}` +
    `&limit=${encodeURIComponent(pageSize)}` +
    `&offset=${encodeURIComponent(currentOffset)}`;

  const quakes = await fetchJSON(url);
  const total = await loadTotalQuakeCount();

  renderList(quakes, total, { append });

  ["countryFilter", "dateFilter", "timeFilter", "magnitudeFilter", "depthFilter"].forEach((id) => {
    updateSelectActiveState(document.getElementById(id));
  });

  setLoadMoreState({ gotCount: quakes.length, limit: pageSize });

  currentOffset += quakes.length;
}

/* -------------------------
   Options
   ------------------------- */
async function loadOptions() {
  const countrySel = document.getElementById("countryFilter");
  const dateSel = document.getElementById("dateFilter");
  const timeSel = document.getElementById("timeFilter");
  const magSel = document.getElementById("magnitudeFilter");
  const depthSel = document.getElementById("depthFilter");

  const opts = await fetchJSON("api/get-filter-options.php");

  setOptions(countrySel, opts.locations.map((x) => ({ value: x, label: x })), "Location");
  setOptions(dateSel, opts.date_ranges, "Date range");
  setOptions(timeSel, opts.times_of_day, null);
  setOptions(magSel, opts.magnitude_mins, null);
  setOptions(depthSel, opts.depth_ranges, null);

  if (countrySel) countrySel.value = "all";
  if (dateSel) dateSel.value = "all";
  if (timeSel) timeSel.value = "all";
  if (magSel) magSel.value = "0";
  if (depthSel) depthSel.value = "all";
}

/* -------------------------
   Boot
   ------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadOptions();

    ["countryFilter", "dateFilter", "timeFilter", "magnitudeFilter", "depthFilter"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", () => loadQuakes({ append: false }));
    });

    const btn = document.getElementById("load-more-btn");
    if (btn) btn.addEventListener("click", () => loadQuakes({ append: true }));

    loadQuakes({ append: false });
  } catch (e) {
    console.error(e);
  }
});