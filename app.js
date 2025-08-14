'use strict';

(function() {
  const STORAGE_KEYS = {
    visited: 'cozymap_visited_v1',
    goals: 'cozymap_goals_v1'
  };

  const cozyStyle = [
    { elementType: 'geometry', stylers: [{ color: '#f5efe6' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#5f5145' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5efe6' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7a6b5b' }] },
    { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e3f2e1' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#558b6e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fdf7f0' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fde9cf' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbe9ff' }] }
  ];

  let map;
  let autocomplete;
  let lastSelectedPlace = null;

  const visitedPlaces = loadFromStorage(STORAGE_KEYS.visited, []);
  const goalPlaces = loadFromStorage(STORAGE_KEYS.goals, []);

  const visitedMarkers = new Map();
  const goalMarkers = new Map();

  function loadFromStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setMessage(text, type = 'info') {
    const el = document.getElementById('message');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = type === 'error' ? '#b42318' : '#6d665f';
  }

  function markerIcon(color) {
    return {
      path: 'M12 2C7.582 2 4 5.582 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.418-3.582-8-8-8zm0 11.25a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#2b2b2b',
      strokeWeight: 1,
      scale: 1.6,
      anchor: new google.maps.Point(12, 22)
    };
  }

  function createMarker(place, type) {
    const position = new google.maps.LatLng(place.location.lat, place.location.lng);
    const color = type === 'visited' ? '#4db565' : '#ffbd2e';
    const marker = new google.maps.Marker({
      position,
      map,
      title: `${place.name} — ${type === 'visited' ? 'Visited' : 'Goal'}`,
      icon: markerIcon(color),
      animation: google.maps.Animation.DROP
    });

    const info = new google.maps.InfoWindow({
      content: `<div style="min-width:160px"><strong>${escapeHtml(place.name)}</strong><br><small>${escapeHtml(place.address || '')}</small><br><span style="color:${type === 'visited' ? '#4db565' : '#ffbd2e'}">${type === 'visited' ? 'Visited' : 'Goal'}</span></div>`
    });

    marker.addListener('click', () => {
      info.open({ anchor: marker, map, shouldFocus: false });
    });

    if (type === 'visited') {
      visitedMarkers.set(place.id, marker);
    } else {
      goalMarkers.set(place.id, marker);
    }

    return marker;
  }

  function removeMarker(placeId, type) {
    const mapObj = type === 'visited' ? visitedMarkers : goalMarkers;
    const marker = mapObj.get(placeId);
    if (marker) {
      marker.setMap(null);
      mapObj.delete(placeId);
    }
  }

  function renderAllMarkers() {
    // Clear existing markers
    for (const [id] of visitedMarkers) removeMarker(id, 'visited');
    for (const [id] of goalMarkers) removeMarker(id, 'goal');

    for (const p of visitedPlaces) createMarker(p, 'visited');
    for (const p of goalPlaces) createMarker(p, 'goal');
  }

  function updateProgressBar() {
    const visitedCount = visitedPlaces.length;
    const total = visitedCount + goalPlaces.length;
    const percent = total === 0 ? 0 : Math.round((visitedCount / total) * 100);
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    if (fill) fill.style.width = percent + '%';
    if (text) text.textContent = `${visitedCount} / ${total} visited (${percent}%)`;
  }

  function fitMapToAllMarkers(pad = 60) {
    const bounds = new google.maps.LatLngBounds();
    let count = 0;

    visitedMarkers.forEach(m => { bounds.extend(m.getPosition()); count++; });
    goalMarkers.forEach(m => { bounds.extend(m.getPosition()); count++; });

    if (count === 0) return;
    map.fitBounds(bounds, pad);
  }

  function gentleFlyTo(latLng, targetZoom = 14) {
    map.panTo(latLng);
    const current = map.getZoom();
    if (typeof current !== 'number') { map.setZoom(targetZoom); return; }

    const steps = Math.max(1, Math.min(8, Math.abs(targetZoom - current)));
    const delta = (targetZoom - current) / steps;

    let i = 0;
    const step = () => {
      i++;
      map.setZoom(current + delta * i);
      if (i < steps) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function upsertPlace(targetArray, place, type) {
    const existingIndex = targetArray.findIndex(p => p.id === place.id);
    if (existingIndex >= 0) {
      targetArray[existingIndex] = place;
    } else {
      targetArray.push(place);
    }

    if (type === 'visited') {
      // If it exists in goals, remove it (progress!)
      const goalIdx = goalPlaces.findIndex(p => p.id === place.id);
      if (goalIdx >= 0) {
        const removed = goalPlaces.splice(goalIdx, 1)[0];
        removeMarker(removed.id, 'goal');
        saveToStorage(STORAGE_KEYS.goals, goalPlaces);
      }
    }
  }

  function onAdd(type) {
    if (!lastSelectedPlace) {
      setMessage('Search and select a place first.', 'error');
      return;
    }

    const gPlace = lastSelectedPlace;
    if (!gPlace.geometry || !gPlace.geometry.location) {
      setMessage('Selected place has no geometry.', 'error');
      return;
    }

    const lat = gPlace.geometry.location.lat();
    const lng = gPlace.geometry.location.lng();

    const place = {
      id: gPlace.place_id,
      name: gPlace.name || gPlace.formatted_address || 'Unnamed place',
      address: gPlace.formatted_address || '',
      location: { lat, lng },
      addedAt: Date.now()
    };

    if (type === 'visited') {
      upsertPlace(visitedPlaces, place, 'visited');
      saveToStorage(STORAGE_KEYS.visited, visitedPlaces);
      createMarker(place, 'visited');
      setMessage('Added to Visited ✓');
    } else {
      const alreadyVisited = visitedPlaces.some(p => p.id === place.id);
      if (alreadyVisited) {
        setMessage('Already marked as Visited.', 'info');
      } else {
        upsertPlace(goalPlaces, place, 'goal');
        saveToStorage(STORAGE_KEYS.goals, goalPlaces);
        createMarker(place, 'goal');
        setMessage('Added to Goals ★');
      }
    }

    updateProgressBar();
    gentleFlyTo(new google.maps.LatLng(lat, lng), 14);
  }

  function restoreState() {
    renderAllMarkers();
    updateProgressBar();
    if (visitedPlaces.length + goalPlaces.length > 0) {
      fitMapToAllMarkers();
    }
  }

  function attachUiHandlers() {
    document.getElementById('add-goal')?.addEventListener('click', () => onAdd('goal'));
    document.getElementById('add-visited')?.addEventListener('click', () => onAdd('visited'));
    document.getElementById('show-all')?.addEventListener('click', () => fitMapToAllMarkers());
    document.getElementById('reset')?.addEventListener('click', () => {
      const sure = confirm('Clear all saved places? This cannot be undone.');
      if (!sure) return;
      // Clear storage
      visitedPlaces.splice(0, visitedPlaces.length);
      goalPlaces.splice(0, goalPlaces.length);
      saveToStorage(STORAGE_KEYS.visited, visitedPlaces);
      saveToStorage(STORAGE_KEYS.goals, goalPlaces);
      // Remove markers
      visitedMarkers.forEach((_, id) => removeMarker(id, 'visited'));
      goalMarkers.forEach((_, id) => removeMarker(id, 'goal'));
      updateProgressBar();
      setMessage('All data cleared.');
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]+/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[s] || s));
  }

  window.initMap = function initMap() {
    const defaultCenter = { lat: 37.773972, lng: -122.431297 }; // San Francisco fallback

    map = new google.maps.Map(document.getElementById('map'), {
      center: defaultCenter,
      zoom: 11,
      styles: cozyStyle,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });

    const input = document.getElementById('place-input');
    autocomplete = new google.maps.places.Autocomplete(input, {
      fields: ['place_id', 'geometry', 'name', 'formatted_address'],
      types: ['establishment', 'geocode']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      lastSelectedPlace = place;
      if (place && place.geometry && place.geometry.location) {
        setMessage(place.formatted_address || place.name || '');
        gentleFlyTo(place.geometry.location, 13);
      } else {
        setMessage('Please pick a place from the suggestions.', 'error');
      }
    });

    attachUiHandlers();
    restoreState();
  };
})();