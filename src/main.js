'use strict';

const API_KEY = "da11d657a81da66146e4f28ae63d04f8";
const API_URL = "https://ws.audioscrobbler.com/2.0/";
let allItems = [];

const fetchData = async (method, query = "") => {
  const res = await fetch(`${API_URL}?method=${method}&${query}&api_key=${API_KEY}&format=json&limit=100`);
  return await res.json();
};

const fetchArtistInfo = async (artistName) => {
  try {
    const res = await fetch(`${API_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`);
    const data = await res.json();
    return { tags: data.artist?.tags?.tag?.[0]?.name || "Geen genre" };
  } catch {
    return { tags: 'Geen genre' };
  }
};

const genreCache = new Map();

const fetchArtistInfoCached = async (artistName) => {
  if(genreCache.has(artistName)) return genreCache.get(artistName);
  const info = await fetchArtistInfo(artistName);
  genreCache.set(artistName, info);
  return info;
};

const fetchTrackGenreCached = async (track) =>
  track.artist?.name ? (await fetchArtistInfoCached(track.artist.name)).tags : "Geen genre";

function renderArtist(item, i) {
  return `
    <p><b>${item.name}</b></p>
    <p>Rang: ${item._rank}</p>
    <p>Genre: <span class="genre-placeholder">Laden...</span></p>
    <p>Luisteraars: ${item.listeners}</p>
    <p>Speelteller: ${item.playcount}</p>
    <p>Type: Artiest</p>
  `;
}

function renderTrack(item, i) {
  return `
    <p><b>${item.name}</b></p>
    <p>Rang: ${item._rank}</p>
    <p>Artiest: ${item.artist?.name || item.artist}</p>
    <p>Genre: <span class="genre-placeholder">Laden...</span></p>
    <p>Luisteraars: ${item.listeners}</p>
    <p>Speelteller: ${item.playcount}</p>
    <p>Type: Track</p>
  `;
}

async function render(items) {
  const container = document.getElementById("item-container");
  container.innerHTML = "";

  items.slice(0,20).forEach((item, i) => {
    const html = `
      <div class="item" data-url="${item.url}" data-artist="${item.artist?.name || item.name}" data-type="${item.type}">
        <p><b>${item.name}</b></p>
        <p>Rang: ${item._rank}</p>
        <p>Genre: <span class="genre-placeholder">Laden...</span></p>
        <p>Luisteraars: ${item.listeners}</p>
        <p>Speelteller: ${item.playcount}</p>
        <p>Type: ${item.type}</p>
      </div>
    `;
    container.innerHTML += html;
  });

  container.querySelectorAll(".item").forEach(div => {
    if(div.dataset.url) div.onclick = () => window.open(div.dataset.url, "_blank");
  });

  items.slice(0,20).forEach(async (item) => {
    if(item.type === "Artiest" || item.type === "Track") {
      const genre = item.type === "Artiest"
        ? (await fetchArtistInfoCached(item.name)).tags
        : (await fetchTrackGenreCached(item));

      const el = container.querySelector(`.item[data-artist="${item.artist?.name || item.name}"] .genre-placeholder`);
      if(el) el.textContent = genre;
    }
  });
}

const setupZoek = () => {
  const zoekInput = document.getElementById("zoek");
  const zoekKnop = document.getElementById("zoek-knop");

  const zoek = (enforce = false) => {
    const val = zoekInput.value.trim().toLowerCase();
    render(val.length === 0 ? allItems : (val.length >= 3 || enforce ? allItems.filter(item => item.name.toLowerCase().includes(val)) : allItems));
  };

  zoekInput.addEventListener("input", () => zoek(false));
  zoekInput.addEventListener("keydown", e => e.key === "Enter" && zoek(true));
  zoekKnop.addEventListener("click", () => zoek(true));
};

(async () => {
  try {
    const [artists, tracks] = await Promise.all([fetchData("chart.gettopartists"), fetchData("chart.gettoptracks")]);
    const N = 20;
    allItems = [
      ...(artists.artists?.artist?.slice(0,N).map((a,i) => ({...a, type:"Artiest", _rank: parseInt(a['@attr']?.rank) || i+1})) || []),
      ...(tracks.tracks?.track?.slice(0,N).map((t,i) => ({...t, type:"Track", _rank: parseInt(t['@attr']?.rank) || i+1})) || [])
    ].sort(() => Math.random() - 0.5);

    if(allItems.length === 0) document.getElementById("item-container").innerHTML = "<p style='color:red'>Geen items gevonden.</p>";
    else { await render(allItems); setupZoek(); }
  } catch(err) {
    console.error(err);
    document.getElementById("item-container").innerHTML = "<p style='color:red'>Fout bij laden van data.</p>";
  }
})();
