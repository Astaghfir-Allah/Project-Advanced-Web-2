'use strict';

const API_KEY = "da11d657a81da66146e4f28ae63d04f8";
const API_URL = "https://ws.audioscrobbler.com/2.0/";

async function fetchData(method, query = "") {
  const url = `${API_URL}?method=${method}&${query}&api_key=${API_KEY}&format=json&limit=100`;
  const res = await fetch(url);
  return await res.json();
}

async function fetchArtistInfo(artistName) {
  try {
    const res = await fetch(`${API_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`);
    const data = await res.json();
    if(data.artist) {
      return {
        tags: data.artist.tags?.tag?.[0]?.name || "Geen genre"
      };
    }
  } catch (err) {
    console.error("Fout bij artist.getinfo:", err);
  }
  return {tags: 'Geen genre'};
}

async function fetchTrackGenre(track) {
  if(!track.artist || !track.artist.name) return "Geen genre";
  const info = await fetchArtistInfo(track.artist.name);
  return info.tags;
}

async function render(items) {
  const container = document.getElementById("item-container");
  container.innerHTML = "";

  for(const [i, item] of items.slice(0,20).entries()) {
    let html = "";
    if(item.type === "Artiest") html = await renderArtist(item, i);
    else html = await renderTrack(item, i);
    container.innerHTML += html;
  }

  container.querySelectorAll(".item").forEach(div => {
    const url = div.dataset.url;
    if(url) {
      div.style.cursor = "pointer";
      div.addEventListener("click", () => window.open(url, "_blank"));
    }
  });
}

async function renderArtist(item, i) {
  const info = await fetchArtistInfo(item.name);

  return `<div class="item" data-url="${item.url}">
    <p><b>${item.name}</b></p>
    <p>Rang: ${item._rank}</p>
    <p>Genre: ${info.tags}</p>
    <p>Luisteraars: ${item.listeners}</p>
    <p>Speelteller: ${item.playcount}</p>
    <p>Type: Artiest</p>
  </div>`;
}


async function renderTrack(item, i) {
  const genre = await fetchTrackGenre(item);

  return `<div class="item" data-url="${item.url}">
    <p><b>${item.name}</b></p>
    <p>Rang: ${item._rank}</p>
    <p>Artiest: ${item.artist?.name || item.artist}</p>
    <p>Genre: ${genre}</p>
    <p>Luisteraars: ${item.listeners}</p>
    <p>Speelteller: ${item.playcount}</p>
    <p>Type: Track</p>
  </div>`;
}


let allItems = [];

Promise.all([
  fetchData("chart.gettopartists"),
  fetchData("chart.gettoptracks")
]).then(([artists, tracks]) => {
  const N = 20;
  const artistItems = (artists.artists && artists.artists.artist)
    ? artists.artists.artist
        .filter(a => a.name)
        .slice(0, N)
        .map((a, idx) => ({
          ...a,
          type: "Artiest",
          _rank: parseInt(a['@attr']?.rank) || idx + 1
        }))
    : [];
  const trackItems = (tracks.tracks && tracks.tracks.track)
    ? tracks.tracks.track
        .filter(a => a.name && (a.artist?.name || a.artist))
        .slice(0, N)
        .map((a, idx) => ({
          ...a,
          type: "Track",
          _rank: parseInt(a['@attr']?.rank) || idx + 1
        }))
    : [];

  allItems = [...artistItems, ...trackItems]
    .sort(() => Math.random() - 0.5);

  if (allItems.length === 0) {
    document.getElementById("item-container").innerHTML = "<p style='color:red'>Geen items gevonden.</p>";
  } else {
    render(allItems);
    setupZoek();
  }
}).catch(err => {
  document.getElementById("item-container").innerHTML = "<p style='color:red'>Fout bij laden van data.</p>";
  console.error(err);
});

function setupZoek() {
  const zoekInput = document.getElementById("zoek");
  const zoekKnop = document.getElementById("zoek-knop");

  function zoek(enforce = false) {
    const val = zoekInput.value.trim().toLowerCase();
    if (val.length === 0) {
      render(allItems);
    } else if (val.length >= 3 || enforce) {
      const filtered = allItems.filter(item =>
        item.name && item.name.toLowerCase().includes(val)
      );
      render(filtered);
    }
  }

  zoekInput.addEventListener("input", () => zoek(false));
  zoekInput.addEventListener("keydown", e => {
    if (e.key === "Enter") zoek(true);
  });
  zoekKnop.addEventListener("click", () => zoek(true));
}