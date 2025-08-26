import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentAltitude, setCurrentAltitude] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [isCompassActive, setIsCompassActive] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      setLocationHistory([location]);
    })();
  }, []);

  const startTracking = async () => {
    setIsTracking(true);
    try {
      await Location.startLocationUpdatesAsync('location-tracking', {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
      });
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const stopTracking = async () => {
    setIsTracking(false);
    try {
      await Location.stopLocationUpdatesAsync('location-tracking');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const startCompass = async () => {
    try {
      setIsCompassActive(true);
      // Start watching device orientation for compass heading
      Location.watchHeadingAsync((heading) => {
        setCompassHeading(heading.magHeading);
      });
    } catch (error) {
      console.error('Error starting compass:', error);
      Alert.alert('Error', 'Failed to start compass. Your device may not support compass functionality.');
      setIsCompassActive(false);
    }
  };

  const stopCompass = () => {
    setIsCompassActive(false);
    // Note: watchHeadingAsync doesn't have a stop method, but we can control the state
  };

  const getCurrentLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      setLocationHistory(prev => [...prev, location]);
      
      // Update additional metrics
      if (location.coords.speed !== null) {
        setCurrentSpeed(location.coords.speed * 3.6); // Convert m/s to km/h
      }
      if (location.coords.altitude !== null) {
        setCurrentAltitude(location.coords.altitude);
      }
      setCurrentAccuracy(location.coords.accuracy);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const formatCoordinate = (coord) => {
    if (coord === null || coord === undefined) return 'N/A';
    return coord.toFixed(6);
  };

  const formatSpeed = (speed) => {
    if (speed === null || speed === undefined) return 'N/A';
    return `${speed.toFixed(1)} km/h`;
  };

  const formatAltitude = (altitude) => {
    if (altitude === null || altitude === undefined) return 'N/A';
    return `${altitude.toFixed(1)} m`;
  };

  const formatAccuracy = (accuracy) => {
    if (accuracy === null || accuracy === undefined) return 'N/A';
    return `${accuracy.toFixed(1)} m`;
  };

  const formatHeading = (heading) => {
    if (heading === null || heading === undefined) return 'N/A';
    return `${heading.toFixed(1)}°`;
  };

  const getHeadingDirection = (heading) => {
    if (heading === null || heading === undefined) return 'N/A';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(heading / 22.5) % 16;
    return directions[index];
  };

  const getCompassRotation = () => {
    return {
      transform: [{ rotate: `${-compassHeading}deg` }]
    };
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GPS Tracker</Text>
        <View style={styles.headerSubtitle}>
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.headerSubtitleText}>Real-time GPS Data</Text>
        </View>
      </View>

      {/* Map Section */}
      {location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
              description={`Lat: ${formatCoordinate(location.coords.latitude)}, Lng: ${formatCoordinate(location.coords.longitude)}`}
            />
          </MapView>
        </View>
      )}

      {/* GPS Data Cards */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Coordinates Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Coordinates</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Latitude:</Text>
            <Text style={styles.dataValue}>{formatCoordinate(location?.coords.latitude)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Longitude:</Text>
            <Text style={styles.dataValue}>{formatCoordinate(location?.coords.longitude)}</Text>
          </View>
        </View>

        {/* Compass Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="compass" size={24} color="#FF6B6B" />
            <Text style={styles.cardTitle}>Compass</Text>
            <TouchableOpacity
              style={[styles.compassButton, isCompassActive ? styles.compassButtonActive : styles.compassButtonInactive]}
              onPress={isCompassActive ? stopCompass : startCompass}
            >
              <Text style={styles.compassButtonText}>
                {isCompassActive ? 'Stop' : 'Start'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Compass Display */}
          <View style={styles.compassContainer}>
            <View style={[styles.compassRose, getCompassRotation()]}>
              <View style={styles.compassNeedle}>
                <View style={styles.compassNeedleNorth} />
                <View style={styles.compassNeedleSouth} />
              </View>
              <Text style={styles.compassNorth}>N</Text>
              <Text style={styles.compassEast}>E</Text>
              <Text style={styles.compassSouth}>S</Text>
              <Text style={styles.compassWest}>W</Text>
            </View>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Heading:</Text>
            <Text style={styles.dataValue}>{formatHeading(compassHeading)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Direction:</Text>
            <Text style={styles.dataValue}>{getHeadingDirection(compassHeading)}</Text>
          </View>
        </View>

        {/* Metrics Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer" size={24} color="#34C759" />
            <Text style={styles.cardTitle}>Metrics</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Speed:</Text>
            <Text style={styles.dataValue}>{formatSpeed(currentSpeed)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Altitude:</Text>
            <Text style={styles.dataValue}>{formatAltitude(currentAltitude)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Accuracy:</Text>
            <Text style={styles.dataValue}>{formatAccuracy(currentAccuracy)}</Text>
          </View>
        </View>

        {/* Location History Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color="#FF9500" />
            <Text style={styles.cardTitle}>Location History</Text>
          </View>
          <Text style={styles.historyText}>
            {locationHistory.length} location{locationHistory.length !== 1 ? 's' : ''} recorded
          </Text>
          {locationHistory.length > 0 && (
            <Text style={styles.lastUpdateText}>
              Last update: {new Date(locationHistory[locationHistory.length - 1]?.timestamp).toLocaleTimeString()}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Control Buttons */}
      <View style={styles.controlContainer}>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={getCurrentLocation}
        >
          <Ionicons name="refresh" size={24} color="white" />
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Ionicons 
            name={isTracking ? "stop" : "play"} 
            size={24} 
            color="white" 
          />
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 5,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitleText: {
    fontSize: 16,
    color: '#6c757d',
    marginLeft: 8,
  },
  mapContainer: {
    height: height * 0.3,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  dataLabel: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  historyText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  lastUpdateText: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  controlContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  refreshButton: {
    backgroundColor: '#6c757d',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    margin: 20,
  },
  // Compass styles
  compassButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  compassButtonActive: {
    backgroundColor: '#FF3B30',
  },
  compassButtonInactive: {
    backgroundColor: '#34C759',
  },
  compassButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  compassContainer: {
    alignItems: 'center',
    marginVertical: 15,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  compassRose: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF6B6B',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compassNeedle: {
    width: 4,
    height: 100,
    position: 'absolute',
  },
  compassNeedleNorth: {
    width: 4,
    height: 50,
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
  compassNeedleSouth: {
    width: 4,
    height: 50,
    backgroundColor: '#6c757d',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  compassNorth: {
    position: 'absolute',
    top: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  compassEast: {
    position: 'absolute',
    right: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  compassSouth: {
    position: 'absolute',
    bottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  compassWest: {
    position: 'absolute',
    left: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
}); 