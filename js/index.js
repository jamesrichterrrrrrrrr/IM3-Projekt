function shortenLocation(raw) {
  if (!raw) return "";
  if (raw.includes(",")) return raw.split(",").pop().trim();

  return raw
    .replace(/^\d+\s*km\s+[A-Z]+\s+of\s+/i, "")
    .replace(/^near\s+/i, "")
    .trim();
}

function plural(n, singular) {
  return n === 1 ? singular : `${singular}s`;
}

function formatTimeAgoUTC(utcString) {
  const d = new Date(utcString.replace(" ", "T") + "Z");
  const now = new Date();

  let diffMs = now - d;
  if (diffMs < 0) diffMs = 0;

  const min = Math.floor(diffMs / 60000);

  if (min < 1) return "just now";
  if (min < 60) return `${min} ${plural(min, "minute")} ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${plural(hr, "hour")} ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ${plural(day, "day")} ago`;

  const week = Math.floor(day / 7);
  if (week < 5) return `${week} ${plural(week, "week")} ago`;

  const month = Math.floor(day / 30);
  if (month < 12) return `${month} ${plural(month, "month")} ago`;

  const year = Math.floor(day / 365);
  return `${year} ${plural(year, "year")} ago`;
}

function formatDateDDMMYY(utcString) {
  const d = new Date(utcString.replace(" ", "T") + "Z");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function applyLocationFit(root = document) {
  const locEls = root.querySelectorAll(".quake-loc");
  const classes = ["loc-w800", "loc-w700", "loc-w600", "loc-w500", "loc-w400"];

  locEls.forEach((el) => {
    classes.forEach((c) => el.classList.remove(c));

    for (const c of classes) {
      el.classList.add(c);
      if (el.scrollWidth <= el.clientWidth + 1) return;
      el.classList.remove(c);
    }

    el.classList.add("loc-w400");
  });
}

function magnitudeGradientClass(mag) {
  if (mag < 5.2) return "mag-lt-52";
  if (mag < 5.6) return "mag-52-55";
  if (mag < 6.0) return "mag-56-59";
  if (mag < 7.0) return "mag-60-69";
  return "mag-70-plus";
}

function quakeCardHTML(q) {
  const date = formatDateDDMMYY(q.time_utc);
  const mag = Number(q.magnitude).toFixed(1);
  const loc = shortenLocation(q.location);
  const ago = formatTimeAgoUTC(q.time_utc);

  return `
    <div class="item">
      <a href="playlist.html?quake_id=${q.id}" class="quake-link">
        <div class="quaked-item">
          <p>${ago}</p>
          <div class="quake-card">
            <div class="quake-box ${magnitudeGradientClass(Number(q.magnitude))}">
              <div class="quake-date">${date}</div>
              <div class="quake-mag">${mag}</div>
              <div class="quake-loc" title="${q.location || ""}">${loc}</div>
            </div>
          </div>
        </div>
      </a>
    </div>
  `;
}

async function loadQuakesIntoTrack(trackId, apiUrl, errorMsg) {
  const track = document.getElementById(trackId);
  if (!track) return;

  try {
    const quakes = await fetchJSON(apiUrl);
    track.innerHTML = quakes.map(quakeCardHTML).join("");
    applyLocationFit(track);
  } catch (e) {
    console.error(e);
    track.innerHTML = `<p style="padding:16px; opacity:0.8;">${errorMsg}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadQuakesIntoTrack("recent-quakes-track", "api/get-quakes.php?limit=12", "Failed to load recent quakes.");
  loadQuakesIntoTrack("mightiest-quakes-track", "api/get-mightiest.php?limit=12", "Failed to load mightiest quakes.");
  loadQuakesIntoTrack("europe-quakes-track", "api/get-europe.php?limit=12", "Failed to load Europe quakes.");
});