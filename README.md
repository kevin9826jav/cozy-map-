# 🌍 Cozy Travel Progress

A beautiful, cozy-themed web app to track your travel goals and visited destinations using Google Maps with a custom pastel color scheme.

## ✨ Features

- **Cozy Styled Map**: Custom Google Maps styling with soft, pastel colors and minimal clutter
- **Smart Location Search**: Google Places Autocomplete API for easy location finding
- **Dual Tracking**: Add places as goals (🎯) or mark them as visited (✅)
- **Animated Progress Bar**: Real-time progress tracking with smooth animations
- **Interactive Markers**: Click markers to see location details and type
- **Data Persistence**: All data saved in browser localStorage
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Keyboard Shortcuts**: Quick actions with Ctrl+G (goal), Ctrl+V (visited), Ctrl+R (reset)

## 🚀 Quick Start

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Setup the App

1. **Clone or download** this repository
2. **Replace the API key** in `index.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places"></script>
   ```
3. **Open `index.html`** in your web browser

### 3. Alternative: Use a Local Server

For better development experience, use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have it installed)
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 🎨 Customization

### Map Styles
The app uses a custom cozy map style defined in `script.js`. You can modify the `cozyMapStyle` array to change colors, hide/show features, or use styles from [Snazzy Maps](https://snazzymaps.com/).

### Colors & Theme
Modify the CSS variables in `styles.css` to change the color scheme:
- Background gradients
- Button colors
- Progress bar colors
- Marker colors

## 🔧 How It Works

1. **Search**: Type a location name and select from autocomplete suggestions
2. **Add**: Choose to add as a goal (🎯) or mark as visited (✅)
3. **Track**: Watch your progress bar update in real-time
4. **Explore**: Click markers to see location details
5. **Persist**: All data automatically saves to your browser

## 📱 Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🛠️ Technical Details

- **Frontend**: Pure HTML, CSS, JavaScript
- **Maps**: Google Maps JavaScript API v3
- **Places**: Google Places Autocomplete API
- **Storage**: Browser localStorage
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Animations**: CSS transitions and Google Maps animations

## 🎯 Future Enhancements

- Export/import travel data
- Travel statistics and insights
- Photo attachments for visited places
- Travel timeline view
- Social sharing features
- Offline map support

## 🐛 Troubleshooting

### Map Not Loading
- Check your API key is correct
- Ensure Maps JavaScript API is enabled
- Check browser console for errors
- Verify Places API is enabled

### Search Not Working
- Confirm Places API is enabled
- Check API key restrictions
- Clear browser cache

### Data Not Saving
- Check localStorage is enabled in your browser
- Try in a different browser
- Check browser console for errors

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the app!

---

**Happy Traveling! ✈️🌍**