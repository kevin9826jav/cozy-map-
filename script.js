// Global variables
let map;
let autocomplete;
let markers = [];
let goals = [];
let visited = [];
let currentPlace = null;

// Cozy map style - pastel colors, minimal clutter
const cozyMapStyle = [
    {
        "featureType": "all",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f2"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "saturation": 36
            },
            {
                "color": "#333333"
            },
            {
                "lightness": 40
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#ffffff"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#fefefe"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#fefefe"
            },
            {
                "lightness": 17
            },
            {
                "weight": 1.2
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f2"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "landscape.man_made",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f2"
            },
            {
                "lightness": 14
            }
        ]
    },
    {
        "featureType": "landscape.natural",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f2"
            },
            {
                "lightness": 6
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f2"
            },
            {
                "lightness": 21
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#dedede"
            },
            {
                "lightness": 21
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 17
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 29
            },
            {
                "weight": 0.2
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 18
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f2f2f2"
            },
            {
                "lightness": 19
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#e9e9e9"
            },
            {
                "lightness": 17
            }
        ]
    }
];

// Initialize the app
function initApp() {
    loadData();
    initMap();
    initAutocomplete();
    setupEventListeners();
    updateUI();
}

// Initialize Google Maps
function initMap() {
    const mapOptions = {
        zoom: 3,
        center: { lat: 20, lng: 0 },
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: cozyMapStyle
    };

    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    
    // Add existing markers
    addExistingMarkers();
}

// Initialize Google Places Autocomplete
function initAutocomplete() {
    const input = document.getElementById('location-search');
    autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'geometry', 'name', 'formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            currentPlace = place;
            // Animate map to the selected location
            animateMapToLocation(place.geometry.location);
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('add-goal').addEventListener('click', () => addLocation('goal'));
    document.getElementById('add-visited').addEventListener('click', () => addLocation('visited'));
    document.getElementById('reset-btn').addEventListener('click', resetData);
    
    // Clear search input when buttons are clicked
    document.getElementById('add-goal').addEventListener('click', clearSearch);
    document.getElementById('add-visited').addEventListener('click', clearSearch);
}

// Add location to goals or visited
function addLocation(type) {
    if (!currentPlace) {
        showNotification('Please search and select a location first!', 'error');
        return;
    }

    const location = {
        id: currentPlace.place_id,
        name: currentPlace.name || currentPlace.formatted_address,
        address: currentPlace.formatted_address,
        lat: currentPlace.geometry.location.lat(),
        lng: currentPlace.geometry.location.lng(),
        type: type,
        addedAt: new Date().toISOString()
    };

    // Check if location already exists
    const existingIndex = goals.findIndex(g => g.id === location.id);
    const visitedIndex = visited.findIndex(v => v.id === location.id);

    if (type === 'goal') {
        if (existingIndex !== -1) {
            showNotification('This location is already in your goals!', 'info');
            return;
        }
        if (visitedIndex !== -1) {
            // Remove from visited and add to goals
            visited.splice(visitedIndex, 1);
        }
        goals.push(location);
    } else {
        if (visitedIndex !== -1) {
            showNotification('This location is already marked as visited!', 'info');
            return;
        }
        if (existingIndex !== -1) {
            // Remove from goals and add to visited
            goals.splice(existingIndex, 1);
        }
        visited.push(location);
    }

    // Save data and update UI
    saveData();
    updateUI();
    addMarker(location);
    
    // Show success animation
    showNotification(`Added ${location.name} to ${type === 'goal' ? 'goals' : 'visited'}!`, 'success');
    
    // Animate the marker
    animateMarkerDrop(location);
}

// Add marker to map
function addMarker(location) {
    // Remove existing marker if any
    removeMarker(location.id);

    const markerIcon = {
        url: createMarkerIcon(location.type),
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 40)
    };

    const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        icon: markerIcon,
        title: location.name,
        animation: google.maps.Animation.DROP
    });

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(location)
    });

    // Add click listener
    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    // Store marker reference
    markers.push({
        id: location.id,
        marker: marker,
        infoWindow: infoWindow
    });
}

// Create marker icon (SVG data URL)
function createMarkerIcon(type) {
    const color = type === 'goal' ? '#f59e0b' : '#10b981';
    const icon = type === 'goal' ? '🎯' : '✅';
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
            <text x="20" y="25" font-family="Arial" font-size="16" text-anchor="middle" fill="white">${icon}</text>
        </svg>
    `)}`;
}

// Create info window content
function createInfoWindowContent(location) {
    const typeClass = location.type === 'goal' ? 'goal' : 'visited';
    const typeText = location.type === 'goal' ? 'Goal' : 'Visited';
    
    return `
        <div class="marker-info">
            <h3>${location.name}</h3>
            <p>${location.address}</p>
            <span class="type-badge ${typeClass}">${typeText}</span>
        </div>
    `;
}

// Remove marker from map
function removeMarker(locationId) {
    const markerIndex = markers.findIndex(m => m.id === locationId);
    if (markerIndex !== -1) {
        markers[markerIndex].marker.setMap(null);
        markers[markerIndex].infoWindow.close();
        markers.splice(markerIndex, 1);
    }
}

// Add existing markers from loaded data
function addExistingMarkers() {
    goals.forEach(location => addMarker(location));
    visited.forEach(location => addMarker(location));
}

// Animate map to location
function animateMapToLocation(latLng) {
    map.panTo(latLng);
    map.setZoom(12);
}

// Animate marker drop
function animateMarkerDrop(location) {
    const marker = markers.find(m => m.id === location.id);
    if (marker) {
        marker.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            marker.marker.setAnimation(null);
        }, 1500);
    }
}

// Update UI elements
function updateUI() {
    // Update progress
    const total = goals.length + visited.length;
    const completed = visited.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('progress-text').textContent = `${completed}/${total}`;
    document.getElementById('progress-percentage').textContent = `${percentage}%`;
    document.getElementById('progress-fill').style.width = `${percentage}%`;

    // Update counts
    document.getElementById('goals-count').textContent = goals.length;
    document.getElementById('visited-count').textContent = visited.length;

    // Add success animation to progress bar
    const progressFill = document.getElementById('progress-fill');
    progressFill.classList.add('success-animation');
    setTimeout(() => {
        progressFill.classList.remove('success-animation');
    }, 600);
}

// Save data to localStorage
function saveData() {
    const data = {
        goals: goals,
        visited: visited,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('travelProgress', JSON.stringify(data));
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('travelProgress');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            goals = data.goals || [];
            visited = data.visited || [];
        } catch (e) {
            console.error('Error loading saved data:', e);
            goals = [];
            visited = [];
        }
    }
}

// Reset all data
function resetData() {
    if (confirm('Are you sure you want to reset all your travel progress? This cannot be undone.')) {
        // Clear markers
        markers.forEach(m => {
            m.marker.setMap(null);
            m.infoWindow.close();
        });
        markers = [];
        
        // Clear data
        goals = [];
        visited = [];
        
        // Save and update UI
        saveData();
        updateUI();
        
        // Reset map
        map.setZoom(3);
        map.setCenter({ lat: 20, lng: 0 });
        
        showNotification('All data has been reset!', 'success');
    }
}

// Clear search input
function clearSearch() {
    document.getElementById('location-search').value = '';
    currentPlace = null;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Fit map to show all markers
function fitMapToMarkers() {
    if (markers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(m => {
        bounds.extend(m.marker.getPosition());
    });
    
    map.fitBounds(bounds);
    
    // Ensure minimum zoom
    google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 15) {
            map.setZoom(15);
        }
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'g':
                e.preventDefault();
                document.getElementById('add-goal').click();
                break;
            case 'v':
                e.preventDefault();
                document.getElementById('add-visited').click();
                break;
            case 'r':
                e.preventDefault();
                document.getElementById('reset-btn').click();
                break;
        }
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle Google Maps API errors
window.gm_authFailure = function() {
    showNotification('Google Maps authentication failed. Please check your API key.', 'error');
};

// Add a small easter egg - double click on map to fit all markers
map?.addListener('dblclick', fitMapToMarkers);