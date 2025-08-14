/* Cozy Trip Tracker - Frontend Only */

/* global google */

let map;
let infoWindow;
let autocomplete;
let lastSelectedPlace = null;

const storageKeys = {
	goals: 'cozyMapGoals',
	visited: 'cozyMapVisited'
};

let goals = [];
let visited = [];

// placeId -> google.maps.Marker
const placeIdToMarker = new Map();

const COLORS = {
	goal: '#f2a900', // warm yellow/orange
	visited: '#2ecc71' // cozy green
};

const COZY_MAP_STYLE = [
	{ elementType: 'geometry', stylers: [{ color: '#ebe3cd' }] },
	{ elementType: 'labels.text.fill', stylers: [{ color: '#523735' }] },
	{ elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1e6' }] },
	{ featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c9b2a6' }] },
	{ featureType: 'poi', stylers: [{ visibility: 'off' }] },
	{ featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f1e6' }] },
	{ featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
	{ featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fdfcf8' }] },
	{ featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f8d9ab' }] },
	{ featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#ebb97f' }] },
	{ featureType: 'transit', stylers: [{ visibility: 'off' }] },
	{ featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#d6e6f2' }] }
];

function createCircleIcon(color) {
	return {
		path: google.maps.SymbolPath.CIRCLE,
		scale: 9,
		fillColor: color,
		fillOpacity: 0.95,
		strokeColor: '#ffffff',
		strokeOpacity: 1,
		strokeWeight: 2
	};
}

function saveState() {
	localStorage.setItem(storageKeys.goals, JSON.stringify(goals));
	localStorage.setItem(storageKeys.visited, JSON.stringify(visited));
}

function loadState() {
	try {
		const g = JSON.parse(localStorage.getItem(storageKeys.goals) || '[]');
		const v = JSON.parse(localStorage.getItem(storageKeys.visited) || '[]');
		goals = Array.isArray(g) ? g : [];
		visited = Array.isArray(v) ? v : [];
	} catch (_) {
		goals = [];
		visited = [];
	}
}

function getUnionPlacesWithStatus() {
	// Combine places by placeId, with visited taking precedence over goal
	const byId = new Map();
	for (const g of goals) {
		byId.set(g.placeId, { ...g, status: 'goal' });
	}
	for (const v of visited) {
		const existing = byId.get(v.placeId);
		byId.set(v.placeId, { ...(existing || v), status: 'visited' });
	}
	return Array.from(byId.values());
}

function updateProgress() {
	const goalIds = new Set(goals.map(g => g.placeId));
	const visitedGoalCount = visited.filter(v => goalIds.has(v.placeId)).length;
	const totalGoals = goals.length;
	const pct = totalGoals === 0 ? 0 : Math.round((visitedGoalCount / totalGoals) * 100);
	const fill = document.getElementById('progress-fill');
	const txt = document.getElementById('progress-text');
	fill.style.width = pct + '%';
	txt.textContent = `${visitedGoalCount} / ${totalGoals} goals visited (${pct}%)`;
}

function clearAllMarkers() {
	for (const marker of placeIdToMarker.values()) {
		marker.setMap(null);
	}
	placeIdToMarker.clear();
}

function renderAllMarkers({ dropAnimation = false } = {}) {
	clearAllMarkers();
	const places = getUnionPlacesWithStatus();
	let delay = 0;
	for (const p of places) {
		const position = { lat: p.lat, lng: p.lng };
		const color = p.status === 'visited' ? COLORS.visited : COLORS.goal;
		const marker = new google.maps.Marker({
			position,
			map: dropAnimation ? null : map,
			title: p.name,
			icon: createCircleIcon(color),
			animation: dropAnimation ? google.maps.Animation.DROP : null
		});
		marker.addListener('click', () => {
			const chipClass = p.status === 'visited' ? 'visited' : 'goal';
			const chipLabel = p.status === 'visited' ? 'Visited' : 'Goal';
			infoWindow.setContent(
				`<div><strong>${escapeHtml(p.name)}</strong><br/><span class="chip ${chipClass}">${chipLabel}</span></div>`
			);
			infoWindow.open(map, marker);
		});
		placeIdToMarker.set(p.placeId, marker);
		if (dropAnimation) {
			// slightly staggered for a cozy feel
			setTimeout(() => marker.setMap(map), delay);
			delay += 50;
		}
	}
}

function fitAllMarkers() {
	const places = getUnionPlacesWithStatus();
	if (places.length === 0) return;
	const bounds = new google.maps.LatLngBounds();
	for (const p of places) bounds.extend(new google.maps.LatLng(p.lat, p.lng));
	map.fitBounds(bounds);
}

function escapeHtml(str) {
	return str.replace(/[&<>"]+/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
}

function addPlaceToList(which) {
	// which: 'goal' | 'visited'
	const place = lastSelectedPlace || (autocomplete && autocomplete.getPlace());
	if (!place || !place.place_id || !place.geometry || !place.geometry.location) {
		alert('Please select a place from the dropdown suggestions first.');
		return;
	}
	const poi = {
		placeId: place.place_id,
		name: place.name || place.formatted_address || 'Unknown',
		lat: place.geometry.location.lat(),
		lng: place.geometry.location.lng(),
		address: place.formatted_address || '',
		addedAt: Date.now()
	};

	if (which === 'goal') {
		if (!goals.some(p => p.placeId === poi.placeId)) goals.push(poi);
	} else if (which === 'visited') {
		if (!visited.some(p => p.placeId === poi.placeId)) visited.push(poi);
		// keep it in goals if it was already a goal (so progress can count it)
	}

	saveState();
	renderAllMarkers({ dropAnimation: true });
	updateProgress();

	// Cozy pan and slight zoom-in
	animateTo({ lat: poi.lat, lng: poi.lng }, 14);
}

function animateTo(targetLatLng, targetZoom = null) {
	map.panTo(targetLatLng);
	if (typeof targetZoom === 'number') {
		const currentZoom = map.getZoom();
		const steps = Math.max(1, Math.min(6, Math.abs(targetZoom - currentZoom)));
		let i = 0;
		const dir = targetZoom > currentZoom ? 1 : -1;
		const interval = setInterval(() => {
			map.setZoom(map.getZoom() + dir);
			i += 1;
			if (i >= steps) clearInterval(interval);
		}, 60);
	}
}

function initAutocomplete() {
	const input = document.getElementById('search-input');
	autocomplete = new google.maps.places.Autocomplete(input, {
		fields: ['place_id', 'geometry', 'name', 'formatted_address']
	});
	autocomplete.addListener('place_changed', () => {
		const place = autocomplete.getPlace();
		lastSelectedPlace = place;
		if (place && place.geometry && place.geometry.location) {
			map.panTo(place.geometry.location);
		}
	});
}

function bindUi() {
	document.getElementById('add-goal').addEventListener('click', () => addPlaceToList('goal'));
	document.getElementById('add-visited').addEventListener('click', () => addPlaceToList('visited'));
	document.getElementById('fit-all').addEventListener('click', () => fitAllMarkers());
	document.getElementById('reset').addEventListener('click', () => {
		if (confirm('Clear all saved places?')) {
			goals = [];
			visited = [];
			saveState();
			clearAllMarkers();
			updateProgress();
		}
	});
}

function initMapCenter(callback) {
	// Try geolocation for a cozy start near the user
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(pos => {
			callback({ lat: pos.coords.latitude, lng: pos.coords.longitude });
		}, () => callback({ lat: 37.773972, lng: -122.431297 })); // SF fallback
	} else {
		callback({ lat: 37.773972, lng: -122.431297 });
	}
}

window.initMap = function initMap() {
	initMapCenter((center) => {
		map = new google.maps.Map(document.getElementById('map'), {
			center,
			zoom: 12,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: false
		});
		const styledMapType = new google.maps.StyledMapType(COZY_MAP_STYLE, { name: 'Cozy' });
		map.mapTypes.set('cozy', styledMapType);
		map.setMapTypeId('cozy');
		infoWindow = new google.maps.InfoWindow();
		initAutocomplete();
		bindUi();
		loadState();
		renderAllMarkers({ dropAnimation: true });
		updateProgress();
		if (getUnionPlacesWithStatus().length > 0) {
			setTimeout(() => fitAllMarkers(), 300);
		}
	});
};