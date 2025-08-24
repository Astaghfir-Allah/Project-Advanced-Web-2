'use strict';

const API_KEY = "da11d657a81da66146e4f28ae63d04f8";
const API_URL = "https://ws.audioscrobbler.com/2.0/";

async function fetchData(method, query = "") {
  const url = `${API_URL}?method=${method}&${query}&api_key=${API_KEY}&format=json&limit=20`;
  const res = await fetch(url);
  return await res.json();
}

function render(items, type, callback) {
  const container = document.getElementById("item-container");
  container.innerHTML = "";

  items = items
    .map((item, i) => ({ ...item, _rank: parseInt(item['@attr']?.rank || i + 1) }))
    .sort((a, b) => a._rank - b._rank);

  items.slice(0, 20).forEach((item, i) => {
    const html = callback(item, i);
    container.innerHTML += html;
  });

  container.querySelectorAll(".item").forEach(div => {
    const url = div.dataset.url;
    if (url) {
      div.style.cursor = "pointer";
      div.addEventListener("click", () => window.open(url, "_blank"));
    }
  });
}

function renderArtist(item, i) {
  return `<div class="item" data-url="${item.url}">
    <p><b>${item.name}</b></p>
    <p>Rang: ${item._rank}</p>
    <p>Luisteraars: ${item.listeners}</p>
    <p>Speelteller: ${item.playcount}</p>
    <p>Streambaar: ${item.streamable}</p>
    <p>Type: Artiest</p>
  </div>`;
}

function renderAlbum(item, i) {
  return `<div class="item" data-url="${item.url}">
    <p><b>${item.name}</b></p>
    <p>Rang: ${item._rank}</p>
    <p>Artiest: ${item.artist?.name || item.artist}</p>
    <p>Luisteraars: ${item.listeners}</p>
    <p>Speelteller: ${item.playcount}</p>
    <p>Type: Album</p>
  </div>`;
}

function renderTrack(item, i) {
  return `<div class="item" data-url="${item.url}">
    <p><b>${item.name}</b></p>
    <p>Rang: ${item._rank}</p>
    <p>Artiest: ${item.artist?.name || item.artist}</p>
    <p>Luisteraars: ${item.listeners}</p>
    <p>Speelteller: ${item.playcount}</p>
    <p>Streambaar: ${item.streamable}</p>
    <p>Type: Track</p>
  </div>`;
}

Promise.all([
  fetchData("chart.gettopartists"),
  fetchData("chart.gettopalbums"),
  fetchData("chart.gettoptracks")
]).then(([artists, albums, tracks]) => {
  render(artists.artists.artist, "artist", renderArtist);
  render(albums.albums.album, "album", renderAlbum);
  render(tracks.tracks.track, "track", renderTrack);
});
