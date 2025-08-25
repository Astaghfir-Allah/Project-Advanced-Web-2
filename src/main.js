'use strict';

const API_KEY = "da11d657a81da66146e4f28ae63d04f8";
const API_URL = "https://ws.audioscrobbler.com/2.0/";

let allItems = [];
let currentFilter = { type: "all", genre: "all" };
let currentSort = "naam-asc";
let currentSearch = "";

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
const taalSelect = document.getElementById("taal");

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.classList && node.classList.contains("item")) {
          console.log(`Nieuwe item toegevoegd: ${node.dataset.artist}`);
        }
      });
    }
  });
});
observer.observe(container, { childList: true });

const translations = {
  nl: {
    add: "Voeg toe",
    remove: "Verwijder",
    rank: "Rang",
    genre: "Genre",
    listeners: "Luisteraars",
    playcount: "Speelteller",
    type: "Type",
    noFavorites: "Geen favorieten gevonden.",
    filter: "Filter",
    reset: "Reset",
    search: "Zoek",
    searchPlaceholder: "Zoek naar artiesten of nummers...",
    favorites: "Favorieten",
    sort: {
      "naam-asc": "Naam (A-Z)",
      "naam-desc": "Naam (Z-A)",
      "rang-asc": "Rang (oplopend)",
      "rang-desc": "Rang (aflopend)",
      "luisteraars-asc": "Luisteraars (min-max)",
      "luisteraars-desc": "Luisteraars (max-min)",
      "speelteller-asc": "Speelteller (min-max)",
      "speelteller-desc": "Speelteller (max-min)"
    },
    filterOptions: {
      all: "Alle",
      artist: "Artiest",
      track: "Nummer",
      none: "Geen genre"
    },
    header: {
      favorieten: "Favorieten",
      home: "Home",
      back: "Terug naar Home",
      sorteringLabel: "Sorteren op",
      filterTypeLabel: "Filter op type:",
      filterGenreLabel: "Filter op genre:",
      filtersHeader: "Filters"
    }
  },
  en: {
    add: "Add",
    remove: "Remove",
    rank: "Rank",
    genre: "Genre",
    listeners: "Listeners",
    playcount: "Playcount",
    type: "Type",
    noFavorites: "No favorites found.",
    filter: "Filter",
    reset: "Reset",
    search: "Search",
    searchPlaceholder: "Search for artists or tracks...",
    favorites: "Favorites",
    sort: {
      "naam-asc": "Name (A-Z)",
      "naam-desc": "Name (Z-A)",
      "rang-asc": "Rank (ascending)",
      "rang-desc": "Rank (descending)",
      "luisteraars-asc": "Listeners (low-high)",
      "luisteraars-desc": "Listeners (high-low)",
      "speelteller-asc": "Playcount (low-high)",
      "speelteller-desc": "Playcount (high-low)"
    },
    filterOptions: {
      all: "All",
      artist: "Artist",
      track: "Track",
      none: "No genre"
    },
    header: {
      favorieten: "Favorites",
      home: "Home",
      back: "Back to Home",
      sorteringLabel: "Sort by",
      filterTypeLabel: "Filter by type:",
      filterGenreLabel: "Filter by genre:",
      filtersHeader: "Filters"
    }
  }
};

let currentLang = localStorage.getItem("lang") || "nl";

const applyTranslations = () => {
  document.getElementById("label-sortering").textContent = translations[currentLang].header.sorteringLabel;
  document.querySelector("#filter-popup h3").textContent = translations[currentLang].header.filtersHeader;
  document.querySelector('label[for="type-filter"]').textContent = translations[currentLang].header.filterTypeLabel;
  document.querySelector('label[for="genre-filter"]').textContent = translations[currentLang].header.filterGenreLabel;
  document.getElementById("pas-filter-toe").textContent = translations[currentLang].filter;
  document.getElementById("reset-filter").textContent = translations[currentLang].reset;
  document.getElementById("zoek-knop").textContent = translations[currentLang].search;

  document.querySelectorAll(".favoriet-knop").forEach(btn => {
    const span = btn.querySelector("span");
    const artistName = btn.dataset.artist;
    if (favorieten.has(artistName)) {
      span.textContent = translations[currentLang].remove;
    } else {
      span.textContent = translations[currentLang].add;
    }
  });

  document.querySelectorAll(".item").forEach(div => {
    const artistName = div.dataset.artist;
    const item = allItems.find(i => (i.artist?.name || i.name) === artistName);
    if (!item) return;

    div.querySelector("#item-name b").textContent = item.name;
    div.querySelector("p:nth-of-type(2)").textContent = `${translations[currentLang].rank}: ${item._rank}`;
    div.querySelector("p:nth-of-type(3) .genre-placeholder").textContent = item.genre;
    div.querySelector("p:nth-of-type(4)").textContent = `${translations[currentLang].listeners}: ${item.listeners}`;
    div.querySelector("p:nth-of-type(5)").textContent = `${translations[currentLang].playcount}: ${item.playcount}`;
    div.querySelector("p:nth-of-type(6)").textContent = `${translations[currentLang].type}: ${item.type}`;
  });

  document.getElementById("zoek").placeholder = translations[currentLang].searchPlaceholder;

  favorietHeaderKnop.title = translations[currentLang].favorites;

  Array.from(sorteringSelect.options).forEach(opt => {
    if (translations[currentLang].sort[opt.value]) {
      opt.textContent = translations[currentLang].sort[opt.value];
    }
  });

  Array.from(typeFilterSelect.options).forEach(opt => {
    if (opt.value === "all") opt.textContent = translations[currentLang].filterOptions.all;
    if (opt.value === "Artiest") opt.textContent = translations[currentLang].filterOptions.artist;
    if (opt.value === "Track") opt.textContent = translations[currentLang].filterOptions.track;
  });

  Array.from(genreFilterSelect.options).forEach(opt => {
    if(opt.value === "all") opt.textContent = translations[currentLang].filterOptions.all;
    else if(opt.value === "Geen genre") opt.textContent = translations[currentLang].filterOptions.none;
  });

  taalSelect.value = currentLang;
  updateFavorietHeaderKnop();
};

if(localStorage.getItem("darkMode") === "true"){
    document.body.classList.add("dark-mode");
    modeIcon.src = "https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfubHZYmmnvKzuG40Mm1XZ6E7djynxP3NJYOkqe";
} else {
    document.body.classList.remove("dark-mode");
    modeIcon.src = "https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfuNSk1kEVTbBVd2ZFPHMc38kJoqsl0KaznSE6f";
}

modeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    modeIcon.src = isDark ? "https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfubHZYmmnvKzuG40Mm1XZ6E7djynxP3NJYOkqe" : "https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfuNSk1kEVTbBVd2ZFPHMc38kJoqsl0KaznSE6f";
    localStorage.setItem("darkMode", isDark);

    modeToggle.classList.add("active");
    setTimeout(() => modeToggle.classList.remove("active"), 500);

    if (!sessionStorage.getItem("firstModeToggle")) {
        modeToggle.classList.add("first-toggle");
        setTimeout(() => modeToggle.classList.remove("first-toggle"), 1000);
        sessionStorage.setItem("firstModeToggle", "true");
    }
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
  if (genreCache.has(artistName)) return genreCache.get(artistName);
  try {
    const res = await fetch(`${API_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`);
    const data = await res.json();
    const genre = data?.artist?.tags?.tag?.[0]?.name || "Geen genre";
    genreCache.set(artistName, { tags: genre });
    return { tags: genre };
  } catch {
    return { tags: "Geen genre" };
  }
};

const fetchGenreCached = async (item) => {
  if(item.type === "Artiest") return (await fetchArtistInfo(item.name)).tags;
  if(item.type === "Track") {
    const artistName = item.artist?.name || item.artist || item.name;
    return (await fetchArtistInfo(artistName)).tags;
  }
  return "Geen genre";
};

const getFilteredSortedSearchedItems = () => {
  let items = allItems;

  items = items.filter(i =>
    (currentFilter.type === "all" || i.type === currentFilter.type) &&
    (currentFilter.genre === "all" || i.genre === currentFilter.genre)
  );

  if(currentSearch.length >= 0) {
    const val = currentSearch.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(val));
  }

  switch(currentSort){
    case "naam-asc": items.sort((a,b)=> (a.name||"").localeCompare(b.name||"")); break;
    case "naam-desc": items.sort((a,b)=> (b.name||"").localeCompare(a.name||"")); break;
    case "rang-asc": items.sort((a,b)=> (a._rank||0) - (b._rank||0)); break;
    case "rang-desc": items.sort((a,b)=> (b._rank||0) - (a._rank||0)); break;
    case "luisteraars-asc": items.sort((a,b)=> parseInt(a.listeners) - parseInt(b.listeners)); break;
    case "luisteraars-desc": items.sort((a,b)=> parseInt(b.listeners) - parseInt(a.listeners)); break;
    case "speelteller-asc": items.sort((a,b)=> parseInt(a.playcount) - parseInt(b.playcount)); break;
    case "speelteller-desc": items.sort((a,b)=> parseInt(b.playcount) - parseInt(a.playcount)); break;
  }

  return items;
};

const getCurrentViewItems = () => {
  let items = getFilteredSortedSearchedItems();
  if (showingFavorieten) {
    items = items.filter(item => favorieten.has(item.artist?.name || item.name));
  }
  return items;
};

const render = async (items) => {
  const html = items.slice(0, 20).map(item => `
    <div class="item" data-url="${item.url}" data-artist="${item.artist?.name || item.name}" data-type="${item.type}">
      <button class="favoriet-knop" data-artist="${item.artist?.name || item.name}">
        <img src="${favorieten.has(item.artist?.name || item.name) ? 'https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfuOP1JntwIp5hYKUJrmAQTMylobVanxZie9gt1' : 'https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfuGfc5pDw3NivSfhTclbIgPF74MQ1rLJB5sqWG'}" alt="Favoriet" class="favoriet-svg">
        <span>${favorieten.has(item.artist?.name || item.name) ? translations[currentLang].remove : translations[currentLang].add}</span>
      </button>
      <p id="item-name"><b>${item.name}</b></p>
      <p>${translations[currentLang].rank}: ${item._rank}</p>
      <p>${translations[currentLang].genre}: <span class="genre-placeholder">Laden...</span></p>
      <p>${translations[currentLang].listeners}: ${item.listeners}</p>
      <p>${translations[currentLang].playcount}: ${item.playcount}</p>
      <p>${translations[currentLang].type}: ${item.type}</p>
    </div>
  `).join('');

  container.innerHTML = html;

  container.querySelectorAll(".item").forEach(div => {
    if(div.dataset.url) div.onclick = () => window.open(div.dataset.url, "_blank");
  });

  container.querySelectorAll(".favoriet-knop").forEach(btn =>
    btn.addEventListener("click", e => {
      e.stopPropagation();
      toggleFavoriet(btn.dataset.artist, btn);
    })
  );

  await Promise.all(items.slice(0,20).map(async item => {
    const el = container.querySelector(`.item[data-artist="${item.artist?.name || item.name}"] .genre-placeholder`);
    if(el) el.textContent = await fetchGenreCached(item);
  }));
};

const vulGenres = () => {
  const genresSet = new Set(allItems.map(i => i.genre || "Geen genre").filter(Boolean));
  const genres = Array.from(genresSet).filter(g => g !== "Geen genre").sort((a, b) => a.localeCompare(b));

  genreFilterSelect.innerHTML = `<option value="all">${translations[currentLang].filterOptions.all}</option>`;

  genres.forEach(g => {
    const option = document.createElement("option");
    option.value = g;
    option.textContent = g;
    genreFilterSelect.appendChild(option);
  });

  const noneOption = document.createElement("option");
  noneOption.value = "Geen genre";
  noneOption.textContent = translations[currentLang].filterOptions.none;
  genreFilterSelect.appendChild(noneOption);
};

const updateGenresInItems = () => {
  container.querySelectorAll(".item").forEach(div => {
    const artistName = div.dataset.artist;
    const item = allItems.find(i => (i.artist?.name || i.name) === artistName);
    if (item) {
      const el = div.querySelector(".genre-placeholder");
      if(el) el.textContent = item.genre;
    }
  });
};

pasFilterToeKnop.addEventListener("click", () => {
  currentFilter.type = typeFilterSelect.value;
  currentFilter.genre = genreFilterSelect.value;
  render(getCurrentViewItems());
  filterPopup.classList.add("hidden");
});


sorteringSelect.addEventListener("change", () => {
  currentSort = sorteringSelect.value;
  render(getCurrentViewItems());
});

document.getElementById("reset-filter").addEventListener("click", () => {
    typeFilterSelect.value = "all";
    genreFilterSelect.value = "all";
    currentFilter = { type: "all", genre: "all" };
    render(getCurrentViewItems());
});


const setupZoek = () => {
  const zoekInput = document.getElementById("zoek");
  const zoekKnop = document.getElementById("zoek-knop");
  const zoek = (force=false) => {
    currentSearch = zoekInput.value.trim();
    render(getCurrentViewItems());
  };
  zoekInput.addEventListener("input", () => zoek(false));
  zoekInput.addEventListener("keydown", e => e.key==="Enter" && zoek(true));
  zoekKnop.addEventListener("click", () => zoek(true));
};

filterKnop.addEventListener("click", () => filterContainer.classList.toggle("active"));
document.addEventListener("click", e => { if(!filterContainer.contains(e.target)) filterContainer.classList.remove("active"); });

const favorietHeaderKnop = document.getElementById("favoriet-knop");
let showingFavorieten = false;

const updateFavorietHeaderKnop = () => {
  const img = favorietHeaderKnop.querySelector("img");
  const text = favorietHeaderKnop.querySelector("b");

  if (showingFavorieten) {
    img.src = "https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfu6quasNj410nBwetYZiLVKu5gdbNUCyWfIPAv";
    text.textContent = translations[currentLang].header.back;
  } else {
    img.src = "https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfuOP1JntwIp5hYKUJrmAQTMylobVanxZie9gt1";
    text.textContent = translations[currentLang].header.favorieten;
  }
};

favorietHeaderKnop.addEventListener("click", async () => {
  showingFavorieten = !showingFavorieten;
  const itemsToRender = getCurrentViewItems();
  if(itemsToRender.length === 0 && showingFavorieten) {
    container.innerHTML = `<p class="red-msg" style="color:red">${translations[currentLang].noFavorites}</p>`;
  } else {
    render(itemsToRender);
  }
  updateFavorietHeaderKnop();
});

const toggleFavoriet = (artistName, btn) => {
  const img = btn.querySelector('img');
  const span = btn.querySelector('span');

  favorieten.has(artistName) ? favorieten.delete(artistName) : favorieten.add(artistName);
  img.src = favorieten.has(artistName) ? "https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfuOP1JntwIp5hYKUJrmAQTMylobVanxZie9gt1" : "https://ayd9qnoe70.ufs.sh/f/5vAvkXp0mVfuGfc5pDw3NivSfhTclbIgPF74MQ1rLJB5sqWG";
  span.textContent = favorieten.has(artistName) ? translations[currentLang].remove : translations[currentLang].add;

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
  applyTranslations();

  taalSelect.addEventListener("change", () => {
    currentLang = taalSelect.value;
    localStorage.setItem("lang", currentLang);
    updateGenresInItems();
    applyTranslations();
  });
})();
