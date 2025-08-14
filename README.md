# 🗺️ Cozy Travel Tracker

A beautiful, cozy-themed single-page web application for tracking your travel goals and visited destinations using Google Maps.

![Cozy Travel Tracker](https://via.placeholder.com/800x400/f4a6cd/ffffff?text=Cozy+Travel+Tracker)

## ✨ Features

### 🎨 Cozy Design
- **Soft pastel color scheme** with pink, mint green, and warm yellow accents
- **Custom map styling** for a minimal, clutter-free appearance
- **Smooth animations** and micro-interactions
- **Fully responsive** design that works on all devices

### 🗺️ Interactive Map
- **Google Maps integration** with custom cozy styling
- **Places Autocomplete** for easy location searching
- **Animated marker drops** with different colors for goals vs visited places
- **Info windows** showing place details when markers are clicked
- **Auto-zoom** to fit all markers on the map

### 📍 Location Management
- **Add destinations** to your goals list
- **Mark places as visited** and watch them move from goals to completed
- **Smart duplicate detection** prevents adding the same place twice
- **One-click conversion** from goal to visited status

### 📊 Progress Tracking
- **Animated progress bar** showing completion percentage
- **Real-time statistics** displaying goals and visited counts
- **Visual feedback** with color-coded markers and smooth transitions

### 💾 Data Persistence
- **localStorage integration** saves all your data locally
- **Automatic restore** on page refresh
- **Export/import ready** (data stored as JSON)

### 🔄 Additional Features
- **Reset functionality** to clear all data
- **Toast notifications** for user feedback
- **Loading states** and error handling
- **Keyboard shortcuts** and accessibility features

## 🚀 Quick Start

### Prerequisites
- A Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API

### Setup Instructions

1. **Clone or download** this repository
2. **Get a Google Maps API key**:
   - Visit [Google Cloud Console](https://console.developers.google.com)
   - Create a new project or select existing one
   - Enable "Maps JavaScript API" and "Places API"
   - Create credentials (API key)
   - Optionally restrict the key to your domain

3. **Add your API key**:
   - Open `index.html`
   - Replace `YOUR_API_KEY` with your actual Google Maps API key:
   ```html
   <script async defer 
           src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places&callback=initMap">
   </script>
   ```

4. **Open the app**:
   - Simply open `index.html` in your web browser
   - Or serve it using a local web server for development

## 📱 How to Use

1. **Search for a place** using the search box at the top
2. **Select a location** from the autocomplete suggestions
3. **Choose an action**:
   - Click "📍 Add to Goals" to mark it as a future destination
   - Click "✅ Mark as Visited" to add it to your completed list
4. **View your progress** in the progress bar and statistics
5. **Click markers** on the map to see place details
6. **Use the reset button** to clear all data if needed

## 🛠️ Technical Details

### File Structure
```
├── index.html          # Main HTML file
├── style.css           # CSS styles and animations
├── app.js              # JavaScript application logic
└── README.md           # This file
```

### Technologies Used
- **HTML5** for structure
- **CSS3** with custom properties and animations
- **Vanilla JavaScript** (ES6+ classes)
- **Google Maps JavaScript API**
- **Google Places API**
- **localStorage** for data persistence

### Browser Support
- Chrome/Edge 70+
- Firefox 65+
- Safari 12+
- Mobile browsers with modern JavaScript support

## 🎨 Customization

### Changing Colors
Edit the CSS custom properties in `style.css`:
```css
:root {
    --primary-color: #f4a6cd;      /* Main pink accent */
    --secondary-color: #a8e6cf;    /* Mint green for visited */
    --accent-color: #ffd3a5;       /* Warm yellow for goals */
    --text-color: #5a5a5a;         /* Text color */
    --bg-color: #fdfbf7;           /* Background */
}
```

### Map Styling
The map style is defined in `app.js` in the `mapStyle` array. You can:
- Use styles from [Snazzy Maps](https://snazzymaps.com/)
- Create custom styles with the [Google Maps Style Generator](https://mapstyle.withgoogle.com/)
- Modify the existing cozy theme

### Adding Features
The app is built with a modular class structure, making it easy to extend:
- Add new marker types in the `addMarker()` method
- Implement export/import in the `TravelTracker` class
- Add social sharing features
- Integrate with travel APIs

## 🔒 Privacy & Security

- **All data stays local** - nothing is sent to external servers
- **API key security** - consider restricting your Google Maps API key to your domain
- **No user tracking** - the app doesn't collect any personal information

## 🐛 Troubleshooting

### Map not loading?
- Check that your API key is correct
- Ensure Maps JavaScript API and Places API are enabled
- Check browser console for error messages
- Try opening the app with HTTPS or from localhost

### Autocomplete not working?
- Verify Places API is enabled in Google Cloud Console
- Check API key permissions and restrictions
- Ensure you have sufficient API quota

### Data not persisting?
- Check if localStorage is enabled in your browser
- Some browsers in private/incognito mode may not persist localStorage
- Clear browser cache and try again

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 🙏 Acknowledgments

- Google Maps Platform for the mapping services
- [Snazzy Maps](https://snazzymaps.com/) for map style inspiration
- [Google Fonts](https://fonts.google.com/) for the Poppins font family

---

**Happy travels! 🌍✈️**