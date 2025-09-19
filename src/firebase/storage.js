// Firebase Storage functions for files
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from './config';

// Upload a file to Firebase Storage
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { 
      success: true, 
      url: downloadURL, 
      path: snapshot.ref.fullPath 
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
};

// Upload audio recording
export const uploadAudio = async (audioBlob, userId) => {
  const timestamp = Date.now();
  const path = `audio/${userId}/${timestamp}.wav`;
  return await uploadFile(audioBlob, path);
};

// Upload image
export const uploadImage = async (imageFile, userId) => {
  const timestamp = Date.now();
  const fileExtension = imageFile.name.split('.').pop();
  const path = `images/${userId}/${timestamp}.${fileExtension}`;
  return await uploadFile(imageFile, path);
};

// Upload drawing data (as JSON)
export const uploadDrawing = async (drawingData, userId) => {
  try {
    const timestamp = Date.now();
    const path = `drawings/${userId}/${timestamp}.json`;
    
    // Convert drawing data to blob
    const jsonString = JSON.stringify(drawingData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    return await uploadFile(blob, path);
  } catch (error) {
    console.error('Error uploading drawing:', error);
    return { success: false, error: error.message };
  }
};

// Delete a file from storage
export const deleteFile = async (filePath) => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// Compress image before upload
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};