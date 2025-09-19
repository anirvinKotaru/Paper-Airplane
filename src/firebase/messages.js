// Firebase Firestore functions for messages
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// Collection name for messages
const MESSAGES_COLLECTION = 'messages';

// Save a new message to Firestore
export const saveMessage = async (messageData) => {
  try {
    const messageWithTimestamp = {
      ...messageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving message:', error);
    return { success: false, error: error.message };
  }
};

// Get messages near a specific location
export const getMessagesNearLocation = async (latitude, longitude, radiusKm = 1) => {
  try {
    // For now, we'll get all messages and filter by distance
    // In a production app, you'd use GeoFirestore for better performance
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(50) // Limit to 50 most recent messages
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.location) {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          data.location.lat, 
          data.location.lng
        );
        
        if (distance <= radiusKm) {
          messages.push({
            id: doc.id,
            ...data,
            distance: distance
          });
        }
      }
    });
    
    return { success: true, messages };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { success: false, error: error.message };
  }
};

// Get all messages for a specific user
export const getUserMessages = async (userId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, messages };
  } catch (error) {
    console.error('Error getting user messages:', error);
    return { success: false, error: error.message };
  }
};

// Listen for real-time message updates near a location
export const subscribeToMessages = (latitude, longitude, radiusKm, callback) => {
  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.location) {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          data.location.lat, 
          data.location.lng
        );
        
        if (distance <= radiusKm) {
          messages.push({
            id: doc.id,
            ...data,
            distance: distance
          });
        }
      }
    });
    
    callback(messages);
  });
};

// Delete a message
export const deleteMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, MESSAGES_COLLECTION, messageId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { success: false, error: error.message };
  }
};

// Update a message
export const updateMessage = async (messageId, updateData) => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(messageRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating message:', error);
    return { success: false, error: error.message };
  }
};

// Calculate distance between two coordinates (in kilometers)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Subscribe to directional messages (messages within a cone of direction)
export const subscribeToDirectionalMessages = (latitude, longitude, heading, radiusKm, coneAngle, callback) => {
  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.location && data.direction !== undefined) {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          data.location.lat, 
          data.location.lng
        );
        
        if (distance <= radiusKm) {
          // Calculate angle between user's heading and message direction
          const messageAngle = data.direction;
          const angleDiff = Math.abs(heading - messageAngle);
          const normalizedAngleDiff = Math.min(angleDiff, 360 - angleDiff);
          
          // Check if message is within the cone
          if (normalizedAngleDiff <= coneAngle / 2) {
            messages.push({
              id: doc.id,
              ...data,
              distance: distance,
              angleFromHeading: normalizedAngleDiff
            });
          }
        }
      }
    });
    
    callback(messages);
  });
};

// Get messages in a specific direction (non-real-time version)
export const getMessagesInDirection = async (latitude, longitude, heading, radiusKm = 1, coneAngle = 45) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.location && data.direction !== undefined) {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          data.location.lat, 
          data.location.lng
        );
        
        if (distance <= radiusKm) {
          // Calculate angle between user's heading and message direction
          const messageAngle = data.direction;
          const angleDiff = Math.abs(heading - messageAngle);
          const normalizedAngleDiff = Math.min(angleDiff, 360 - angleDiff);
          
          // Check if message is within the cone
          if (normalizedAngleDiff <= coneAngle / 2) {
            messages.push({
              id: doc.id,
              ...data,
              distance: distance,
              angleFromHeading: normalizedAngleDiff
            });
          }
        }
      }
    });
    
    return { success: true, messages };
  } catch (error) {
    console.error('Error getting directional messages:', error);
    return { success: false, error: error.message };
  }
};