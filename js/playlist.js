async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function shortenLocation(raw) {
  if (!raw) return "";
  if (raw.includes(",")) return raw.split(",").pop().trim();

  return raw
    .replace(/^\d+\s*km\s+[A-Z]+\s+of\s+/i, "")
    .replace(/^near\s+/i, "")
    .trim();
}

function formatUTCDate(utcString) {
  const s = utcString.replace(" ", "T") + "Z";
  const d = new Date(s);
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function formatPrettyDateUTC(utcString) {
  const d = new Date(utcString.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}

function sectionLabel(trackUtc, anchorUtc) {
  const t = new Date(trackUtc.replace(" ", "T") + "Z").getTime();
  const a = new Date(anchorUtc.replace(" ", "T") + "Z").getTime();
  const diffMin = (t - a) / 60000;

  if (Math.abs(diffMin) <= 2) return "The Impact";
  if (diffMin < 0) return "Calm Before";
  return "Aftershock";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatDuration(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const totalSec = Math.round(n / 1000);
  const m = Math.floor(totalSec / 60);
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPlaylist(data) {
  const quakeTitleEl = document.getElementById("quake-title");
  const quakeSubtitleEl = document.getElementById("quake-subtitle");
  const listEl = document.getElementById("playlist-items");

  const quake = data.quake || {};
  const playlist = data.playlist || {};
  const tracks = Array.isArray(data.tracks) ? data.tracks : [];

  const mag = Number(quake.magnitude);
  const depth =
    quake.depth_km === null || quake.depth_km === undefined
      ? "—"
      : `${Number(quake.depth_km).toFixed(1)} km`;

  setText("quake-mag", Number.isFinite(mag) ? mag.toFixed(1) : "—");
  setText("quake-depth", depth);

  setText("quake-datetime", quake.time_utc ? formatPrettyDateUTC(quake.time_utc) : "—");
  setText("quake-date", quake.time_utc ? formatPrettyDateUTC(quake.time_utc) : "—");

  const shortLoc = shortenLocation(quake.location);
  if (quakeTitleEl) {
    quakeTitleEl.textContent = Number.isFinite(mag) ? `${mag.toFixed(1)} in ${shortLoc}` : `— in ${shortLoc}`;
  }

  if (quakeSubtitleEl) {
    const anchor = playlist.anchor_time_utc ? formatUTCDate(playlist.anchor_time_utc) : "—";
    quakeSubtitleEl.textContent =
      playlist.mode === "nearest_radio_time"
        ? `Matched to nearest SRF moment: ${anchor}`
        : `Matched to quake time: ${anchor}`;
  }

  const map = document.getElementById("quake-map");
  if (map) {
    if (quake.latitude != null && quake.longitude != null) {
      map.src = `https://www.google.com/maps?q=${quake.latitude},${quake.longitude}&z=6&output=embed`;
    } else {
      map.src = `https://www.google.com/maps?q=${encodeURIComponent(quake.location || "")}&z=6&output=embed`;
    }
  }

  if (!listEl) return;

  if (tracks.length === 0) {
    listEl.innerHTML = `<p style="padding: 20px; opacity: 0.8;">No SRF tracks found for this window.</p>`;
  } else {
    const anchorUtc = playlist.anchor_time_utc || "";
    listEl.innerHTML = tracks
      .map((t, idx) => {
        const label = sectionLabel(t.played_at_utc, anchorUtc);

        const title = (t.title || "").toUpperCase();
        const artist = t.artist || "";
        const dur = formatDuration(t.duration_ms);

        const safeTitle = escapeHTML(title);
        const safeArtist = escapeHTML(artist);

        return `
          <div class="main-playlist dis-flex">
            <div class="playlist-left dis-flex">
              <p class="impact-label">${label === "The Impact" ? "<span>The Impact</span>" : escapeHTML(label)}</p>
            </div>

            <div class="playlist-right">
              <div class="track-no">#${idx + 1}</div>

              <div class="track-meta" title="${safeTitle} by ${safeArtist}">
                <span class="track-title">${safeTitle}</span>
                <span class="track-by">by</span>
                <span class="track-artist">${safeArtist}</span>
              </div>

              <div class="track-dur">${escapeHTML(dur)}</div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const spotifyLink = document.querySelector(".spotify-btn a");
  if (spotifyLink && !spotifyLink.dataset.bound) {
    spotifyLink.dataset.bound = "1";
    spotifyLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("😄 This is a prototype. No real Spotify integration — yet.");
    });
  }
}

async function loadPlaylist() {
  try {
    const params = new URLSearchParams(window.location.search);
    let quakeId = params.get("quake_id");

    if (!quakeId) {
      const latest = await fetchJSON("api/get-latest-quake.php");
      quakeId = latest.quake_id;
    }

    if (!quakeId) throw new Error("No quake_id available.");

    const data = await fetchJSON(`api/get-playlist.php?quake_id=${quakeId}`);
    renderPlaylist(data);
  } catch (err) {
    console.error(err);
    const listEl = document.getElementById("playlist-items");
    if (listEl) {
      listEl.innerHTML = `<p style="padding: 20px;">Error loading playlist: ${err.message}</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", loadPlaylist);