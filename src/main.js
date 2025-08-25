'use strict';

const API_KEY = "da11d657a81da66146e4f28ae63d04f8";
const API_URL = "https://ws.audioscrobbler.com/2.0/";

let allItems = [];

const filterContainer = document.getElementById("filter-container");
const filterKnop = document.getElementById("filter-knop");
const filterPopup = document.getElementById("filter-popup");
const pasFilterToeKnop = document.getElementById("pas-filter-toe");
const typeFilterSelect = document.getElementById("type-filter");
const genreFilterSelect = document.getElementById("genre-filter");
const sorteringSelect = document.getElementById("sortering");

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

filterKnop.addEventListener("click", (e) => {
  filterContainer.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!filterContainer.contains(e.target) && filterContainer.classList.contains("active")) {
    filterContainer.classList.remove("active");
  }
});

const vulGenres = () => {
    const genres = Array.from(new Set(allItems
        .map(item => item.genre || "Geen genre")
        .filter(Boolean)));
    genreFilterSelect.innerHTML = '<option value="all">Alle</option>';
    genres.forEach(g => {
        const option = document.createElement("option");
        option.value = g;
        option.textContent = g;
        genreFilterSelect.appendChild(option);
    });
};

pasFilterToeKnop.addEventListener("click", () => {
    const typeVal = typeFilterSelect.value;
    const genreVal = genreFilterSelect.value;

    const filtered = allItems.filter(item => {
        let okType = typeVal === "all" || item.type === typeVal;
        let okGenre = genreVal === "all" || item.genre === genreVal;
        return okType && okGenre;
    });

    render(filtered);
    filterPopup.classList.add("hidden");
});

vulGenres();

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

const sorteerItems = (items) => {
  const value = sorteringSelect.value;

  const sorted = [...items];
  switch(value) {
    case "naam-asc":
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    case "naam-desc":
      sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      break;
    case "rang-asc":
      sorted.sort((a, b) => (a._rank || 0) - (b._rank || 0));
      break;
    case "rang-desc":
      sorted.sort((a, b) => (b._rank || 0) - (a._rank || 0));
      break;
    case "luisteraars-asc":
      sorted.sort((a, b) => parseInt(a.listeners) - parseInt(b.listeners));
      break;
    case "luisteraars-desc":
      sorted.sort((a, b) => parseInt(b.listeners) - parseInt(a.listeners));
      break;
    case "speelteller-asc":
      sorted.sort((a, b) => parseInt(a.playcount) - parseInt(b.playcount));
      break;
    case "speelteller-desc":
      sorted.sort((a, b) => parseInt(b.playcount) - parseInt(a.playcount));
      break;
    default:
      break;
  }
  return sorted;
};

const vulGenresInItems = async () => {
  const promises = allItems.map(async item => {
    if (!item.genre || item.genre === "Geen genre") {
      if (item.type === "Artiest") {
        item.genre = (await fetchArtistInfoCached(item.name)).tags;
      } else if (item.type === "Track") {
        item.genre = await fetchTrackGenreCached(item);
      }
    }
  });
  await Promise.all(promises);
};

const updateGenresInDOM = async () => {
  await vulGenresInItems();
  const container = document.getElementById("item-container");
  allItems.forEach(item => {
    const el = container.querySelector(`.item[data-artist="${item.artist?.name || item.name}"] .genre-placeholder`);
    if (el) el.textContent = item.genre;
  });
  vulGenres();
};

sorteringSelect.addEventListener("change", () => {
  const gesorteerd = sorteerItems(allItems);
  render(gesorteerd);
});

(async () => {
  try {
    const [artists, tracks] = await Promise.all([
      fetchData("chart.gettopartists"),
      fetchData("chart.gettoptracks")
    ]);
    const N = 20;

    allItems = [
      ...(artists.artists?.artist?.slice(0, N).map((a, i) => ({
        ...a,
        type: "Artiest",
        _rank: parseInt(a['@attr']?.rank) || i + 1
      })) || []),
      ...(tracks.tracks?.track?.slice(0, N).map((t, i) => ({
        ...t,
        type: "Track",
        _rank: parseInt(t['@attr']?.rank) || i + 1
      })) || [])
    ].sort(() => Math.random() - 0.5);

    if (allItems.length === 0) {
      document.getElementById("item-container").innerHTML =
        "<p style='color:red'>Geen items gevonden.</p>";
    } else {
      await render(allItems);
      setupZoek();
      updateGenresInDOM();   
    }
  } catch (err) {
    console.error(err);
    document.getElementById("item-container").innerHTML =
      "<p style='color:red'>Fout bij laden van data.</p>";
  }
})();
