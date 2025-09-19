// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABWoCa3GiKb35AfHHC1V7OGU4kXkvF9ZY",
  authDomain: "airplane-seeker-app.firebaseapp.com",
  projectId: "airplane-seeker-app",
  storageBucket: "airplane-seeker-app.firebasestorage.app",
  messagingSenderId: "979838009578",
  appId: "1:979838009578:web:337c9e60535de04f889793",
  measurementId: "G-017Y9X646B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;