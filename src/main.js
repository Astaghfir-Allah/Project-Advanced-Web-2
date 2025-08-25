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
const container = document.getElementById("item-container");
const genreCache = new Map();
const modeToggle = document.querySelector(".mode-toggle");
const modeIcon = document.getElementById("mode-icon");

if(localStorage.getItem("darkMode") === "true"){
    document.body.classList.add("dark-mode");
    modeIcon.src = "../image/sun-svgrepo-com.svg";
} else {
    document.body.classList.remove("dark-mode");
    modeIcon.src = "../image/moon.svg";
}

modeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    
    modeIcon.src = isDark ? "../image/sun-svgrepo-com.svg" : "../image/moon.svg";
    
    localStorage.setItem("darkMode", isDark);
});

let favorieten;
try {
  const stored = JSON.parse(localStorage.getItem("favorieten")) || [];
  favorieten = new Set(stored);
} catch {
  favorieten = new Set();
}

const fetchData = async (method, query = "") => {
  const res = await fetch(`${API_URL}?method=${method}&${query}&api_key=${API_KEY}&format=json&limit=100`);
  return res.json();
};

const fetchArtistInfo = async (artistName) => {
  if(genreCache.has(artistName)) return genreCache.get(artistName);
  try {
    const res = await fetch(`${API_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`);
    const genre = res.json?.artist?.tags?.tag?.[0]?.name || "Geen genre";
    genreCache.set(artistName, { tags: genre });
    return { tags: genre };
  } catch {
    return { tags: "Geen genre" };
  }
};

const fetchGenreCached = async (item) => {
  if(item.type === "Artiest") return (await fetchArtistInfo(item.name)).tags;
  if(item.type === "Track" && item.artist?.name) return (await fetchArtistInfo(item.artist.name)).tags;
  return "Geen genre";
};

const render = async (items) => {
  const html = items.slice(0, 20).map(item => `
    <div class="item" data-url="${item.url}" data-artist="${item.artist?.name || item.name}" data-type="${item.type}">
      <button class="favoriet-knop" data-artist="${item.artist?.name || item.name}">
      <img src="../image/unselected_star.svg" alt="Favoriet" class="favoriet-svg">
      <span>Voeg toe</span>
    </button>
      <p id="item-name"><b>${item.name}</b></p>
      <p>Rang: ${item._rank}</p>
      <p>Genre: <span class="genre-placeholder">Laden...</span></p>
      <p>Luisteraars: ${item.listeners}</p>
      <p>Speelteller: ${item.playcount}</p>
      <p>Type: ${item.type}</p>
    </div>
  `).join('');

  container.innerHTML = html;

  container.querySelectorAll(".item").forEach(div => {
    if(div.dataset.url) div.onclick = () => window.open(div.dataset.url, "_blank");
  });

  container.querySelectorAll(".favoriet-knop").forEach(btn =>
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const artistName = btn.dataset.artist;
      toggleFavoriet(artistName, btn);
    })
  );

  container.querySelectorAll(".favoriet-knop").forEach(btn => {
  const artistName = btn.dataset.artist;
  const img = btn.querySelector('img');
  const span = btn.querySelector('span');

  if (favorieten.has(artistName)) {
    img.src = "../image/selected_star.svg";
    span.textContent = "Verwijder";
  } else {
    img.src = "../image/unselected_star.svg";
    span.textContent = "Voeg toe";
  }
});

  await Promise.all(items.slice(0,20).map(async item => {
    const el = container.querySelector(`.item[data-artist="${item.artist?.name || item.name}"] .genre-placeholder`);
    if(el) el.textContent = await fetchGenreCached(item);
  }));
};


const vulGenres = () => {
  const genres = Array.from(new Set(allItems.map(i => i.genre || "Geen genre").filter(Boolean)));
  genreFilterSelect.innerHTML = '<option value="all">Alle</option>' + genres.map(g => `<option value="${g}">${g}</option>`).join('');
};

pasFilterToeKnop.addEventListener("click", () => {
  const typeVal = typeFilterSelect.value;
  const genreVal = genreFilterSelect.value;
  render(allItems.filter(i => (typeVal === "all" || i.type === typeVal) && (genreVal === "all" || i.genre === genreVal)));
  filterPopup.classList.add("hidden");
});

sorteringSelect.addEventListener("change", () => {
  const value = sorteringSelect.value;
  const sorted = [...allItems].sort((a,b) => {
    switch(value){
      case "naam-asc": return (a.name||"").localeCompare(b.name||"");
      case "naam-desc": return (b.name||"").localeCompare(a.name||"");
      case "rang-asc": return (a._rank||0) - (b._rank||0);
      case "rang-desc": return (b._rank||0) - (a._rank||0);
      case "luisteraars-asc": return parseInt(a.listeners) - parseInt(b.listeners);
      case "luisteraars-desc": return parseInt(b.listeners) - parseInt(a.listeners);
      case "speelteller-asc": return parseInt(a.playcount) - parseInt(b.playcount);
      case "speelteller-desc": return parseInt(b.playcount) - parseInt(a.playcount);
      default: return 0;
    }
  });
  render(sorted);
});

document.getElementById("reset-filter").addEventListener("click", () => {
    typeFilterSelect.value = "all";
    genreFilterSelect.value = "all";
    sorteringSelect.value = "naam-asc"; // of default
    render(allItems);
});

const setupZoek = () => {
  const zoekInput = document.getElementById("zoek");
  const zoekKnop = document.getElementById("zoek-knop");
  const zoek = (force=false) => {
    const val = zoekInput.value.trim().toLowerCase();
    render(val.length===0 ? allItems : (val.length>=3 || force ? allItems.filter(i => i.name.toLowerCase().includes(val)) : allItems));
  };
  zoekInput.addEventListener("input", () => zoek(false));
  zoekInput.addEventListener("keydown", e => e.key==="Enter" && zoek(true));
  zoekKnop.addEventListener("click", () => zoek(true));
};

filterKnop.addEventListener("click", () => filterContainer.classList.toggle("active"));
document.addEventListener("click", e => { if(!filterContainer.contains(e.target)) filterContainer.classList.remove("active"); });

const favorietHeaderKnop = document.getElementById("favoriet-knop");
let showingFavorieten = false;

favorietHeaderKnop.addEventListener("click", async () => {
  if (showingFavorieten) {
    await render(allItems);
    showingFavorieten = false;
    favorietHeaderKnop.querySelector("img").src = "../image/selected_star.svg";
  } else {
    const favItems = allItems.filter(item => favorieten.has(item.artist?.name || item.name));
    if (favItems.length === 0) {
      container.innerHTML = "<p style='color:red'>Geen favorieten gevonden.</p>";
    } else {
      await render(favItems);
    }
    showingFavorieten = true;
    favorietHeaderKnop.querySelector("img").src = "../image/unselected_star.svg";
  }
});

const toggleFavoriet = (artistName, btn) => {
  const img = btn.querySelector('img');
  const span = btn.querySelector('span');

  if (favorieten.has(artistName)) {
    favorieten.delete(artistName);
    img.src = "../image/unselected_star.svg";
    span.textContent = "Voeg toe";
  } else {
    favorieten.add(artistName);
    img.src = "../image/selected_star.svg";
    span.textContent = "Verwijder";
  }
  localStorage.setItem("favorieten", JSON.stringify([...favorieten]));
};

(async () => {
  try {
    const [artists, tracks] = await Promise.all([
      fetchData("chart.gettopartists"),
      fetchData("chart.gettoptracks")
    ]);
    const N=20;
    allItems = [
      ...(artists.artists?.artist?.slice(0,N).map((a,i) => ({ ...a, type:"Artiest", _rank:parseInt(a['@attr']?.rank)||i+1 })) || []),
      ...(tracks.tracks?.track?.slice(0,N).map((t,i) => ({ ...t, type:"Track", _rank:parseInt(t['@attr']?.rank)||i+1 })) || [])
    ].sort(() => Math.random()-0.5);

    if(allItems.length===0) container.innerHTML="<p style='color:red'>Geen items gevonden.</p>";
    else {
      await render(allItems);
      setupZoek();
      await Promise.all(allItems.map(async item => item.genre = await fetchGenreCached(item)));
      vulGenres();
    }
  } catch(err) {
    console.error(err);
    container.innerHTML="<p style='color:red'>Fout bij laden van data.</p>";
  }
})();
