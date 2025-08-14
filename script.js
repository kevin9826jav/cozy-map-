/* global google */
let map;
let infoWindow;

const STORAGE_VISITED = 'cozy_visited';
const STORAGE_GOALS = 'cozy_goals';

let visited = [];
let goals = [];
const markers = [];

const cozyStyle = [
  { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#5b5b5b" }] },
  { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }, { "lightness": 13 }] },
  { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#e3e3e3" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#d7d7d7" }] },
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f9f5f2" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#cfe8f3" }] }
];

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    styles: cozyStyle
  });

  infoWindow = new google.maps.InfoWindow();

  // Load stored data and render markers
  loadStored();

  // Setup Places autocomplete
  const input = document.getElementById('place-input');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  let selectedPlace = null;
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      alert('Place details unavailable');
      return;
    }
    selectedPlace = place;
    map.panTo(place.geometry.location);
    map.setZoom(Math.max(5, map.getZoom()));
  });

  document.getElementById('add-goal').addEventListener('click', () => {
    if (selectedPlace) {
      storeLocation(selectedPlace, 'goal');
      input.value = '';
      selectedPlace = null;
    }
  });

  document.getElementById('add-visited').addEventListener('click', () => {
    if (selectedPlace) {
      storeLocation(selectedPlace, 'visited');
      input.value = '';
      selectedPlace = null;
    }
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('This will clear all stored data. Continue?')) {
      localStorage.removeItem(STORAGE_VISITED);
      localStorage.removeItem(STORAGE_GOALS);
      clearMap();
    }
  });
}

function clearMap() {
  visited = [];
  goals = [];
  markers.forEach(m => m.setMap(null));
  markers.length = 0;
  updateProgress();
}

function loadStored() {
  visited = JSON.parse(localStorage.getItem(STORAGE_VISITED) || '[]');
  goals = JSON.parse(localStorage.getItem(STORAGE_GOALS) || '[]');
  visited.forEach(loc => addMarker(loc, 'visited'));
  goals.forEach(loc => addMarker(loc, 'goal'));
  updateProgress();
}

function storeLocation(place, type) {
  const loc = {
    name: place.name,
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng()
  };
  if (type === 'visited') {
    visited.push(loc);
  } else {
    goals.push(loc);
  }
  addMarker(loc, type);
  save();
  updateProgress();
}

function addMarker(loc, type) {
  const color = type === 'visited' ? '#4caf50' : '#ff9800';
  const marker = new google.maps.Marker({
    position: { lat: loc.lat, lng: loc.lng },
    map,
    title: loc.name,
    animation: google.maps.Animation.DROP,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      strokeColor: '#fff',
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 1
    }
  });
  marker.addListener('click', () => {
    infoWindow.setContent(`<strong>${loc.name}</strong><br>${type === 'visited' ? 'Visited' : 'Goal'}`);
    infoWindow.open(map, marker);
  });
  markers.push(marker);
}

function save() {
  localStorage.setItem(STORAGE_VISITED, JSON.stringify(visited));
  localStorage.setItem(STORAGE_GOALS, JSON.stringify(goals));
}

function updateProgress() {
  const total = visited.length + goals.length;
  const percent = total ? Math.round((visited.length / total) * 100) : 0;
  document.getElementById('progress-bar').style.width = percent + '%';
  document.getElementById('progress-text').textContent = `Progress: ${percent}% (${visited.length}/${total})`;
}

// Expose initMap globally for Google Maps callback
window.initMap = initMap;