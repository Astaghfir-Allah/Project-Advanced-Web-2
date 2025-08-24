'use strict';

const API_KEY = "da11d657a81da66146e4f28ae63d04f8";
const API_URL = "http://ws.audioscrobbler.com/2.0/";

async function fetchData(method, query = ""){
    const url = `${API_URL}?method=chart.gettopartists&api_key=${API_KEY}&format=json&limit=20`;
    const res = await fetch(url);
    return await res.json();
}

function render(items, type, callback) {
  const container = document.getElementById("item-container");
  container.innerHTML = "";

  items.slice(0, 20).forEach((item, i) => {
    if (i % 5 === 0) container.innerHTML += "<div class='row'></div>";
    const row = container.lastChild;

    const html = callback(item, type);
    row.innerHTML += html;
  });

  container.querySelectorAll(".item").forEach(div => {
    const url = div.dataset.url;
    if (url) {
      div.style.cursor = "pointer";
      div.addEventListener("click", () => window.open(url, "_blank"));
    }
  });
}

function renderArtist(item) {
  return `<div class="item" data-url="${item.url}">
    <p><b>${item.name}</b></p>
    <p>Listeners: ${item.listeners}</p>
    <p>Playcount: ${item.playcount}</p>
    <p>Streamable: ${item.streamable}</p>
    <p>MBID: ${item.mbid || "n.v.t."}</p>
    <p>Type: Artist</p>
  </div>`;
}

function renderAlbum(item) {
  return `<div class="item" data-url="${item.url}">
    <p><b>${item.name}</b></p>
    <p>Artiest: ${item.artist?.name || item.artist}</p>
    <p>Listeners: ${item.listeners}</p>
    <p>Playcount: ${item.playcount}</p>
    <p>MBID: ${item.mbid || "n.v.t."}</p>
    <p>Type: Album</p>
  </div>`;
}

function renderTrack(item) {
  return `<div class="item" data-url="${item.url}">
    <p><b>${item.name}</b></p>
    <p>Artiest: ${item.artist?.name || item.artist}</p>
    <p>Listeners: ${item.listeners}</p>
    <p>Playcount: ${item.playcount}</p>
    <p>Streamable: ${item.streamable}</p>
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