// Free Travel Tracker App using Leaflet + OpenStreetMap
class FreeTravelTracker {
    constructor() {
        this.map = null;
        this.markers = [];
        this.places = {
            goals: [],
            visited: []
        };
        
        // Custom marker icons
        this.goalIcon = null;
        this.visitedIcon = null;
        
        this.selectedPlace = null;
        this.searchTimeout = null;
        
        this.init();
    }
    
    init() {
        // Load data from localStorage
        this.loadData();
        
        // Initialize map
        this.initMap();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
        
        // Create custom icons
        this.createCustomIcons();
        
        // Add existing markers
        this.addExistingMarkers();
    }
    
    createCustomIcons() {
        // Goal marker (yellow/orange)
        this.goalIcon = L.divIcon({
            className: 'custom-marker goal-marker',
            html: `
                <div class="marker-pin goal-pin">
                    <div class="marker-icon">📍</div>
                </div>
            `,
            iconSize: [30, 40],
            iconAnchor: [15, 40],
            popupAnchor: [0, -40]
        });
        
        // Visited marker (green)
        this.visitedIcon = L.divIcon({
            className: 'custom-marker visited-marker',
            html: `
                <div class="marker-pin visited-pin">
                    <div class="marker-icon">✅</div>
                </div>
            `,
            iconSize: [30, 40],
            iconAnchor: [15, 40],
            popupAnchor: [0, -40]
        });
        
        // Add marker styles to head
        this.addMarkerStyles();
    }
    
    addMarkerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .custom-marker {
                background: none;
                border: none;
            }
            
            .marker-pin {
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                position: relative;
                transform: rotate(-45deg);
                left: 50%;
                top: 50%;
                margin: -15px 0 0 -15px;
                animation: markerDrop 0.5s ease-out;
            }
            
            .goal-pin {
                background: linear-gradient(135deg, #ffd3a5, #ffb347);
                border: 3px solid #ffffff;
                box-shadow: 0 4px 15px rgba(255, 211, 165, 0.6);
            }
            
            .visited-pin {
                background: linear-gradient(135deg, #a8e6cf, #7dd87d);
                border: 3px solid #ffffff;
                box-shadow: 0 4px 15px rgba(168, 230, 207, 0.6);
            }
            
            .marker-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                font-size: 12px;
                color: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            
            @keyframes markerDrop {
                0% { 
                    transform: rotate(-45deg) translateY(-100px);
                    opacity: 0;
                }
                70% { 
                    transform: rotate(-45deg) translateY(10px);
                    opacity: 1;
                }
                100% { 
                    transform: rotate(-45deg) translateY(0);
                    opacity: 1;
                }
            }
            
            .search-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            }
            
            .suggestion-item {
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
            }
            
            .suggestion-item:hover {
                background-color: #f8f9fa;
            }
            
            .suggestion-item:last-child {
                border-bottom: none;
            }
            
            .suggestion-name {
                font-weight: 500;
                color: #333;
            }
            
            .suggestion-address {
                font-size: 0.9rem;
                color: #666;
                margin-top: 2px;
            }
        `;
        document.head.appendChild(style);
    }
    
    initMap() {
        // Create map with cozy styling
        this.map = L.map('map', {
            zoomControl: true,
            attributionControl: true
        }).setView([40.7128, -74.0060], 3);
        
        // Add custom tile layer with cozy colors
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Apply custom map styling
        this.styleMap();
        
        // Add zoom control styling
        this.styleControls();
    }
    
    styleMap() {
        // Add custom CSS filter to make the map look cozy
        const mapElement = document.getElementById('map');
        mapElement.style.filter = 'sepia(0.1) saturate(0.8) brightness(1.1) contrast(0.9)';
    }
    
    styleControls() {
        // Style the zoom controls to match our theme
        setTimeout(() => {
            const zoomControls = document.querySelectorAll('.leaflet-control-zoom a');
            zoomControls.forEach(control => {
                control.style.background = 'linear-gradient(135deg, #f4a6cd, #ffd3a5)';
                control.style.color = 'white';
                control.style.border = 'none';
                control.style.borderRadius = '8px';
                control.style.margin = '2px';
                control.style.fontWeight = 'bold';
                control.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
            });
        }, 100);
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
        
        // Setup search functionality
        searchInput.addEventListener('input', (e) => this.handleSearch(e));
        searchInput.addEventListener('blur', () => {
            // Hide suggestions after a delay to allow clicking
            setTimeout(() => this.hideSuggestions(), 200);
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSuggestions();
            }
        });
    }
    
    async handleSearch(e) {
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            this.hideSuggestions();
            this.disableButtons();
            return;
        }
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(async () => {
            try {
                const results = await this.searchPlaces(query);
                this.showSuggestions(results);
            } catch (error) {
                console.error('Search error:', error);
                this.showNotification('Search error. Please try again.', 'error');
            }
        }, 300);
    }
    
    async searchPlaces(query) {
        // Use Nominatim (OpenStreetMap's geocoding service) - completely free
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CozyTravelTracker/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const data = await response.json();
        
        return data.map(item => ({
            name: item.display_name.split(',')[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            osm_id: item.osm_id
        }));
    }
    
    showSuggestions(results) {
        const suggestionsDiv = document.getElementById('search-suggestions');
        
        if (results.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        suggestionsDiv.innerHTML = '';
        
        results.forEach(place => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <div class="suggestion-name">${place.name}</div>
                <div class="suggestion-address">${place.address}</div>
            `;
            
            item.addEventListener('click', () => {
                this.selectPlace(place);
            });
            
            suggestionsDiv.appendChild(item);
        });
        
        suggestionsDiv.style.display = 'block';
    }
    
    hideSuggestions() {
        const suggestionsDiv = document.getElementById('search-suggestions');
        suggestionsDiv.style.display = 'none';
    }
    
    selectPlace(place) {
        // Update search input
        document.getElementById('location-search').value = place.name;
        
        // Store selected place
        this.selectedPlace = place;
        
        // Pan to location
        this.map.setView([place.lat, place.lng], 12);
        
        // Enable buttons
        document.getElementById('add-goal').disabled = false;
        document.getElementById('add-visited').disabled = false;
        
        // Hide suggestions
        this.hideSuggestions();
    }
    
    disableButtons() {
        document.getElementById('add-goal').disabled = true;
        document.getElementById('add-visited').disabled = true;
        this.selectedPlace = null;
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
            // Remove existing marker
            this.removeMarkerByLocation(this.selectedPlace.lat, this.selectedPlace.lng);
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
        const icon = type === 'visited' ? this.visitedIcon : this.goalIcon;
        
        const marker = L.marker([place.lat, place.lng], { icon })
            .addTo(this.map);
        
        // Create popup content
        const popupContent = this.createPopupContent(place, type);
        marker.bindPopup(popupContent);
        
        // Store marker with metadata
        this.markers.push({
            marker: marker,
            place: place,
            type: type
        });
        
        return marker;
    }
    
    createPopupContent(place, type) {
        const statusIcon = type === 'visited' ? '✅' : '📍';
        const statusText = type === 'visited' ? 'Visited' : 'Goal';
        const bgColor = type === 'visited' ? '#a8e6cf' : '#ffd3a5';
        const textColor = type === 'visited' ? '#2d5a2d' : '#8b4513';
        
        return `
            <div style="padding: 10px; font-family: 'Poppins', sans-serif; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; color: #5a5a5a; font-size: 1.1rem;">${place.name}</h3>
                <p style="margin: 0 0 8px 0; color: #888; font-size: 0.9rem;">${place.address}</p>
                <span style="display: inline-block; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem; font-weight: 500; 
                    background: ${bgColor}; color: ${textColor};">
                    ${statusIcon} ${statusText}
                </span>
            </div>
        `;
    }
    
    removeMarkerByLocation(lat, lng) {
        this.markers = this.markers.filter(markerData => {
            const markerLat = markerData.marker.getLatLng().lat;
            const markerLng = markerData.marker.getLatLng().lng;
            
            if (Math.abs(markerLat - lat) < 0.001 && Math.abs(markerLng - lng) < 0.001) {
                this.map.removeLayer(markerData.marker);
                return false;
            }
            return true;
        });
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
        
        // Fit map to markers after a short delay
        setTimeout(() => this.fitMapToMarkers(), 100);
    }
    
    clearMarkers() {
        this.markers.forEach(markerData => {
            this.map.removeLayer(markerData.marker);
        });
        this.markers = [];
    }
    
    fitMapToMarkers() {
        if (this.markers.length === 0) return;
        
        const group = new L.featureGroup(this.markers.map(m => m.marker));
        this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
        
        // Don't zoom in too much for single marker
        if (this.markers.length === 1) {
            setTimeout(() => {
                if (this.map.getZoom() > 12) {
                    this.map.setZoom(12);
                }
            }, 100);
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
    }
    
    clearSearch() {
        document.getElementById('location-search').value = '';
        this.disableButtons();
        this.hideSuggestions();
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
            this.map.setView([40.7128, -74.0060], 3);
        }
    }
    
    saveData() {
        try {
            localStorage.setItem('freeTravelTracker', JSON.stringify(this.places));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Error saving data to browser storage', 'error');
        }
    }
    
    loadData() {
        try {
            const savedData = localStorage.getItem('freeTravelTracker');
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
        
        document.body.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add loading state
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888; font-family: 'Poppins', sans-serif;">
            <div class="loading"></div>
            <p style="margin-top: 15px;">Loading your free cozy map...</p>
            <p style="font-size: 0.9rem; opacity: 0.7;">✨ No API key required!</p>
        </div>
    `;
    
    // Initialize app after a short delay
    setTimeout(() => {
        window.freeTravelTracker = new FreeTravelTracker();
    }, 1000);
});