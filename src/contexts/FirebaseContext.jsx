// Firebase Context for managing authentication and app state
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getCurrentUser } from '../firebase/auth';
import { subscribeToMessages, subscribeToDirectionalMessages } from '../firebase/messages';

const FirebaseContext = createContext();

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyMessages, setNearbyMessages] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  }, []);

  // Subscribe to nearby messages when location is available
  useEffect(() => {
    if (userLocation && user) {
      const unsubscribe = subscribeToMessages(
        userLocation.lat,
        userLocation.lng,
        1, // 1km radius
        (messages) => {
          setNearbyMessages(messages);
        }
      );

      return () => unsubscribe();
    }
  }, [userLocation, user]);

  const value = {
    user,
    loading,
    nearbyMessages,
    userLocation,
    setUserLocation
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
