# Paper Airplane PWA

A Progressive Web App (PWA) version of the Paper Airplane app that allows users to send their thoughts into the sky.

## Features

- **Write Notes**: Create text-based messages
- **Draw Pictures**: Sketch and doodle with a drawing canvas
- **Record Audio**: Capture voice messages
- **Take Pictures**: Upload or capture photos
- **Location Tracking**: GPS coordinates display
- **Message History**: View all sent paper airplanes
- **Offline Support**: Works without internet connection
- **Installable**: Can be installed on devices like a native app

## PWA Features

- ✅ **Service Worker**: Offline functionality and caching
- ✅ **Web App Manifest**: Installable on devices
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Fast Loading**: Optimized for performance
- ✅ **Secure**: HTTPS required for full PWA features

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with PWA support

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run web
```

3. Open your browser and navigate to `http://localhost:19006`

### Building for Production

1. Build the PWA:
```bash
npm run build:web
```

2. Serve the built files:
```bash
npm run serve
```

## PWA Installation

### Desktop (Chrome/Edge)
1. Open the app in Chrome or Edge
2. Look for the install icon in the address bar
3. Click "Install" to add to your desktop

### Mobile (Android)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen"
4. Follow the prompts to install

### Mobile (iOS)
1. Open the app in Safari
2. Tap the share button
3. Select "Add to Home Screen"
4. Follow the prompts to install

## Browser Compatibility

- ✅ Chrome 68+
- ✅ Firefox 63+
- ✅ Safari 11.1+
- ✅ Edge 79+

## File Structure

```
├── App.js                 # Original React Native app
├── App.web.js            # Web-compatible version
├── public/
│   ├── index.html        # Main HTML template
│   ├── manifest.json     # PWA manifest
│   ├── sw.js            # Service worker
│   └── icons/           # PWA icons
├── assets/              # App assets
├── package.json         # Dependencies and scripts
├── app.json            # Expo configuration
└── metro.config.js     # Metro bundler config
```

## Key Differences from Native App

- **Location**: Uses browser's Geolocation API instead of Expo Location
- **Audio Recording**: Uses Web Audio API and MediaRecorder
- **Image Capture**: Uses HTML5 file input and camera API
- **Maps**: Simplified map view (can be enhanced with Google Maps API)
- **Storage**: Uses browser's localStorage for data persistence

## Customization

### Adding Real Icons
Replace the placeholder icon files in `public/icons/` with actual PNG images:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Enhancing Maps
To add real map functionality, integrate with:
- Google Maps JavaScript API
- Mapbox GL JS
- Leaflet

### Adding Push Notifications
Implement push notifications using:
- Firebase Cloud Messaging
- Web Push API

## Deployment

### Netlify
1. Build the app: `npm run build:web`
2. Deploy the `dist` folder to Netlify

### Vercel
1. Connect your GitHub repository
2. Set build command: `npm run build:web`
3. Set output directory: `dist`

### GitHub Pages
1. Build the app: `npm run build:web`
2. Push the `dist` folder to a `gh-pages` branch

## Troubleshooting

### Service Worker Issues
- Clear browser cache and reload
- Check browser console for errors
- Ensure HTTPS is enabled in production

### Installation Issues
- Verify manifest.json is valid
- Check that all required icons are present
- Ensure the app is served over HTTPS

### Performance Issues
- Enable compression on your server
- Optimize images and assets
- Use a CDN for static assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple browsers
5. Submit a pull request

## License

This project is licensed under the MIT License.
