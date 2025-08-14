// Travel Tracker App
class TravelTracker {
    constructor() {
        this.map = null;
        this.autocomplete = null;
        this.markers = [];
        this.places = {
            goals: [],
            visited: []
        };
        
        // Cozy map style - soft pastel theme
        this.mapStyle = [
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{"saturation": 36}, {"color": "#8b5a5a"}, {"lightness": 40}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{"visibility": "on"}, {"color": "#ffffff"}, {"lightness": 16}]
            },
            {
                "featureType": "all",
                "elementType": "labels.icon",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#fefefe"}, {"lightness": 20}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#fefefe"}, {"lightness": 17}, {"weight": 1.2}]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{"color": "#f9f5f1"}, {"lightness": 20}]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{"color": "#f5f5f5"}, {"lightness": 21}]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{"color": "#dedede"}, {"lightness": 21}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#ffffff"}, {"lightness": 17}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#ffffff"}, {"lightness": 29}, {"weight": 0.2}]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}, {"lightness": 18}]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}, {"lightness": 16}]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{"color": "#f2f2f2"}, {"lightness": 19}]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#e9e9e9"}, {"lightness": 17}]
            }
        ];
        
        this.init();
    }
    
    init() {
        // Load data from localStorage
        this.loadData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
    }
    
    setupEventListeners() {
        const addGoalBtn = document.getElementById('add-goal');
        const addVisitedBtn = document.getElementById('add-visited');
        const resetBtn = document.getElementById('reset-btn');
        const searchInput = document.getElementById('location-search');
        
        addGoalBtn.addEventListener('click', () => this.addPlace('goals'));
        addVisitedBtn.addEventListener('click', () => this.addPlace('visited'));
        resetBtn.addEventListener('click', () => this.resetAll());
        
        // Disable buttons initially
        addGoalBtn.disabled = true;
        addVisitedBtn.disabled = true;
        
        // Enable buttons when user types
        searchInput.addEventListener('input', (e) => {
            const hasText = e.target.value.trim().length > 0;
            addGoalBtn.disabled = !hasText;
            addVisitedBtn.disabled = !hasText;
        });
    }
    
    initMap() {
        // Default location (New York City)
        const defaultLocation = { lat: 40.7128, lng: -74.0060 };
        
        // Create map
        this.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 3,
            center: defaultLocation,
            styles: this.mapStyle,
            gestureHandling: 'cooperative',
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            disableDefaultUI: false,
            backgroundColor: '#f9f5f1'
        });
        
        // Setup Places Autocomplete
        this.setupAutocomplete();
        
        // Add existing markers
        this.addExistingMarkers();
        
        // Fit map to show all markers
        this.fitMapToMarkers();
    }
    
    setupAutocomplete() {
        const input = document.getElementById('location-search');
        
        this.autocomplete = new google.maps.places.Autocomplete(input, {
            types: ['(regions)'],
            fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types']
        });
        
        this.autocomplete.addListener('place_changed', () => {
            const place = this.autocomplete.getPlace();
            
            if (place.geometry) {
                // Pan to selected location
                this.map.panTo(place.geometry.location);
                this.map.setZoom(12);
                
                // Store selected place data
                this.selectedPlace = {
                    name: place.name,
                    address: place.formatted_address,
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    types: place.types
                };
                
                // Enable buttons
                document.getElementById('add-goal').disabled = false;
                document.getElementById('add-visited').disabled = false;
            }
        });
    }
    
    addPlace(type) {
        if (!this.selectedPlace) return;
        
        // Check if place already exists
        const existsInGoals = this.places.goals.some(p => 
            Math.abs(p.lat - this.selectedPlace.lat) < 0.001 && 
            Math.abs(p.lng - this.selectedPlace.lng) < 0.001
        );
        
        const existsInVisited = this.places.visited.some(p => 
            Math.abs(p.lat - this.selectedPlace.lat) < 0.001 && 
            Math.abs(p.lng - this.selectedPlace.lng) < 0.001
        );
        
        // If adding to visited and it exists in goals, move it
        if (type === 'visited' && existsInGoals) {
            this.places.goals = this.places.goals.filter(p => 
                !(Math.abs(p.lat - this.selectedPlace.lat) < 0.001 && 
                  Math.abs(p.lng - this.selectedPlace.lng) < 0.001)
            );
        }
        
        // If adding to goals and it exists in visited, don't add
        if (type === 'goals' && existsInVisited) {
            this.showNotification('This place is already marked as visited!', 'info');
            return;
        }
        
        // If place already exists in the same category, don't add
        if ((type === 'goals' && existsInGoals) || (type === 'visited' && existsInVisited)) {
            this.showNotification(`This place is already in your ${type}!`, 'info');
            return;
        }
        
        // Add place to the specified category
        this.places[type].push({
            ...this.selectedPlace,
            id: Date.now(),
            addedAt: new Date().toISOString()
        });
        
        // Add marker to map
        this.addMarker(this.selectedPlace, type);
        
        // Save to localStorage
        this.saveData();
        
        // Update UI
        this.updateUI();
        
        // Clear search
        this.clearSearch();
        
        // Show notification
        const message = type === 'goals' ? 
            `Added "${this.selectedPlace.name}" to your goals! 🎯` : 
            `Marked "${this.selectedPlace.name}" as visited! ✅`;
        this.showNotification(message, 'success');
        
        // Fit map to show all markers
        setTimeout(() => this.fitMapToMarkers(), 500);
    }
    
    addMarker(place, type) {
        const marker = new google.maps.Marker({
            position: { lat: place.lat, lng: place.lng },
            map: this.map,
            title: place.name,
            animation: google.maps.Animation.DROP,
            icon: this.getMarkerIcon(type)
        });
        
        // Create info window
        const infoWindow = new google.maps.InfoWindow({
            content: this.createInfoWindowContent(place, type)
        });
        
        marker.addListener('click', () => {
            // Close all other info windows
            this.markers.forEach(m => {
                if (m.infoWindow) {
                    m.infoWindow.close();
                }
            });
            
            infoWindow.open(this.map, marker);
        });
        
        // Store marker with metadata
        this.markers.push({
            marker: marker,
            infoWindow: infoWindow,
            place: place,
            type: type
        });
    }
    
    getMarkerIcon(type) {
        const iconColor = type === 'visited' ? '#a8e6cf' : '#ffd3a5';
        const iconSymbol = type === 'visited' ? '✓' : '★';
        
        return {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: iconColor,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            labelOrigin: new google.maps.Point(0, 0)
        };
    }
    
    createInfoWindowContent(place, type) {
        const statusIcon = type === 'visited' ? '✅' : '📍';
        const statusText = type === 'visited' ? 'Visited' : 'Goal';
        const statusClass = type === 'visited' ? 'visited' : 'goal';
        
        return `
            <div style="padding: 10px; font-family: 'Poppins', sans-serif; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; color: #5a5a5a; font-size: 1.1rem;">${place.name}</h3>
                <p style="margin: 0 0 8px 0; color: #888; font-size: 0.9rem;">${place.address}</p>
                <span style="display: inline-block; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem; font-weight: 500; 
                    background: ${type === 'visited' ? '#a8e6cf' : '#ffd3a5'}; 
                    color: ${type === 'visited' ? '#2d5a2d' : '#8b4513'};">
                    ${statusIcon} ${statusText}
                </span>
            </div>
        `;
    }
    
    addExistingMarkers() {
        // Clear existing markers
        this.clearMarkers();
        
        // Add goal markers
        this.places.goals.forEach(place => {
            this.addMarker(place, 'goals');
        });
        
        // Add visited markers
        this.places.visited.forEach(place => {
            this.addMarker(place, 'visited');
        });
    }
    
    clearMarkers() {
        this.markers.forEach(markerData => {
            markerData.marker.setMap(null);
        });
        this.markers = [];
    }
    
    fitMapToMarkers() {
        if (this.markers.length === 0) return;
        
        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(markerData => {
            bounds.extend(markerData.marker.getPosition());
        });
        
        this.map.fitBounds(bounds);
        
        // Don't zoom in too much for single marker
        if (this.markers.length === 1) {
            setTimeout(() => {
                if (this.map.getZoom() > 12) {
                    this.map.setZoom(12);
                }
            }, 1000);
        }
    }
    
    updateUI() {
        const goalsCount = this.places.goals.length;
        const visitedCount = this.places.visited.length;
        const totalCount = goalsCount + visitedCount;
        const progressPercentage = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;
        
        // Update counters
        document.getElementById('goals-count').textContent = goalsCount;
        document.getElementById('visited-count').textContent = visitedCount;
        
        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressFill.style.width = `${progressPercentage}%`;
        progressText.textContent = `${progressPercentage}% (${visitedCount}/${totalCount})`;
        
        // Add animations
        setTimeout(() => {
            document.querySelector('.stats').classList.add('fade-in');
        }, 100);
    }
    
    clearSearch() {
        document.getElementById('location-search').value = '';
        document.getElementById('add-goal').disabled = true;
        document.getElementById('add-visited').disabled = true;
        this.selectedPlace = null;
    }
    
    resetAll() {
        if (confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
            this.places = { goals: [], visited: [] };
            this.clearMarkers();
            this.clearSearch();
            this.saveData();
            this.updateUI();
            this.showNotification('All data has been reset! 🔄', 'info');
            
            // Reset map view
            this.map.setZoom(3);
            this.map.setCenter({ lat: 40.7128, lng: -74.0060 });
        }
    }
    
    saveData() {
        try {
            localStorage.setItem('travelTracker', JSON.stringify(this.places));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Error saving data to browser storage', 'error');
        }
    }
    
    loadData() {
        try {
            const savedData = localStorage.getItem('travelTracker');
            if (savedData) {
                this.places = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.places = { goals: [], visited: [] };
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;">&times;</button>
            </div>
        `;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '500',
            zIndex: '10000',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.3s ease-out',
            backgroundColor: type === 'success' ? '#a8e6cf' : 
                           type === 'error' ? '#ff9a9e' : '#ffd3a5'
        });
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }
}

// Initialize the app when Google Maps loads
function initMap() {
    window.travelTracker = new TravelTracker();
    window.travelTracker.initMap();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add loading state
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888; font-family: 'Poppins', sans-serif;">
            <div class="loading"></div>
            <p style="margin-top: 15px;">Loading your cozy map...</p>
            <p style="font-size: 0.9rem; opacity: 0.7;">Make sure to add your Google Maps API key!</p>
        </div>
    `;
});

// Handle API key missing
window.gm_authFailure = function() {
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ff6b6b; font-family: 'Poppins', sans-serif; text-align: center; padding: 20px;">
            <h3 style="color: #ff6b6b; margin-bottom: 10px;">🔑 API Key Required</h3>
            <p style="margin-bottom: 15px;">Please add your Google Maps API key to use this app.</p>
            <ol style="text-align: left; color: #666; font-size: 0.9rem; line-height: 1.6;">
                <li>Get a Google Maps API key from <a href="https://console.developers.google.com" target="_blank" style="color: #f4a6cd;">Google Cloud Console</a></li>
                <li>Enable Maps JavaScript API and Places API</li>
                <li>Replace "YOUR_API_KEY" in index.html with your actual key</li>
                <li>Refresh the page</li>
            </ol>
        </div>
    `;
};