# Cozy Trip Tracker

A single-page web app to plan cozy adventures on a pastel-styled Google Map. Add places as Goals or Visited, see progress, and keep it all in your browser via localStorage.

## Quick Start

1. Get a Google Maps JavaScript API key with Places API enabled.
2. Open `index.html` and replace `YOUR_GOOGLE_MAPS_API_KEY` in the script URL.
3. Serve the folder locally (recommended):

```bash
python3 -m http.server 5173 --directory .
```

Then open `http://localhost:5173/index.html` in your browser.

Notes:
- Autocomplete requires the Places API.
- If you restrict the key, allow requests from `http://localhost:*`.

## Features
- Cozy custom-styled map (minimal road labels, soft colors)
- Google Places Autocomplete input
- Add as Goal (yellow) or Visited (green)
- Animated drop markers and optional zoom/pan
- Progress bar showing visited goals / total goals
- localStorage persistence
- Show All (fit bounds) and Reset actions

## Data Model
- localStorage keys: `cozyMapGoals`, `cozyMapVisited`
- Each place: `{ placeId, name, lat, lng, address, addedAt }`
- Progress = visited goals / total goals

## Attribution
Map style inspired by cozy/pastel themes from Snazzy Maps.