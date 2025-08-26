# GPS Tracker Mobile App

A modern React Native mobile application that displays real-time GPS data with an intuitive user interface.

## Features

- **Real-time GPS Tracking**: Get current location with high accuracy
- **Interactive Map**: View your location on an interactive map with markers
- **GPS Metrics**: Display coordinates, speed, altitude, and accuracy
- **Compass Heading**: Real-time compass display with magnetic heading and direction
- **Location History**: Track and view location history
- **Background Tracking**: Continuous location monitoring capabilities
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Cross-platform**: Works on both iOS and Android

## Screenshots

The app features:
- Clean, modern interface with card-based design
- Interactive map showing current location
- Real-time GPS data display
- **Interactive compass rose with real-time heading updates**
- Location tracking controls
- Beautiful icons and smooth animations

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- **Device with compass/magnetometer sensor (for compass functionality)**

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gps-tracker-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install Expo CLI globally** (if not already installed)
   ```bash
   npm install -g @expo/cli
   ```

## Running the App

1. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

2. **Run on device/simulator**
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## App Structure

```
gps-tracker-app/
├── App.js                 # Main application component
├── package.json          # Dependencies and scripts
├── app.json             # Expo configuration
├── babel.config.js      # Babel configuration
└── README.md            # This file
```

## Key Components

### App.js
- Main application component with GPS functionality
- Location permission handling
- Real-time location tracking
- **Compass heading tracking with device orientation**
- Interactive map integration
- GPS data display and formatting

### Features
- **Location Services**: Uses Expo Location for GPS access
- **Maps Integration**: React Native Maps for interactive mapping
- **Compass Integration**: Real-time magnetic heading using device sensors
- **State Management**: React hooks for app state
- **Error Handling**: Graceful error handling and user feedback
- **Responsive Design**: Adapts to different screen sizes

## GPS Data Displayed

- **Coordinates**: Latitude and longitude with 6 decimal precision
- **Speed**: Current movement speed in km/h
- **Altitude**: Current elevation above sea level
- **Accuracy**: GPS signal accuracy in meters
- **Compass Heading**: Magnetic heading in degrees (0-360°)
- **Direction**: Cardinal and intercardinal directions (N, NE, E, SE, S, SW, W, NW)
- **Timestamp**: Last location update time

## Compass Features

The app includes a comprehensive compass display:
- **Real-time Heading**: Updates continuously when compass is active
- **Visual Compass Rose**: Interactive compass with rotating needle
- **Direction Labels**: Clear N, E, S, W markers
- **Start/Stop Control**: Toggle compass functionality on/off
- **Magnetic Heading**: Accurate magnetic north readings
- **Direction Conversion**: Automatic conversion to cardinal directions

### Compass Usage
1. Tap the "Start" button in the Compass card to activate
2. Hold your device flat and rotate to see heading changes
3. The red needle always points north
4. Tap "Stop" to deactivate compass tracking

## Permissions

The app requires the following permissions:
- **Location Access**: To display GPS coordinates and track movement
- **Background Location**: For continuous tracking (optional)
- **Device Orientation**: For compass heading functionality

## Configuration

### app.json
- App metadata and configuration
- Permission declarations for iOS and Android
- Expo plugin configuration for location services

### package.json
- Dependencies including Expo, React Native, and location services
- Development scripts for building and running

## Troubleshooting

### Common Issues

1. **Location Permission Denied**
   - Ensure location services are enabled on your device
   - Check app permissions in device settings

2. **Map Not Loading**
   - Verify internet connection
   - Check if map services are available in your region

3. **GPS Not Accurate**
   - Ensure device has clear view of sky
   - Wait for GPS signal to stabilize
   - Check device location settings

4. **Compass Not Working**
   - Ensure your device has a magnetometer/compass sensor
   - Calibrate your device's compass (move in figure-8 pattern)
   - Keep device away from magnetic interference
   - Some older devices may not support compass functionality

### Development Issues

1. **Metro Bundler Errors**
   - Clear Metro cache: `npx expo start --clear`
   - Restart development server

2. **Dependency Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## Building for Production

1. **Build for Android**
   ```bash
   expo build:android
   ```

2. **Build for iOS**
   ```bash
   expo build:ios
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the troubleshooting section above
- Review Expo documentation
- Open an issue in the repository

---

**Note**: This app requires location permissions and may not work properly in all environments. Ensure you have proper GPS signal and location services enabled for optimal performance. **Compass functionality requires a device with magnetometer sensors and may not work on all devices or emulators.** 