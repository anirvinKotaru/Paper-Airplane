import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { 
  FaHome, 
  FaMap, 
  FaHistory, 
  FaEdit, 
  FaPaintBrush, 
  FaMicrophone, 
  FaCamera,
  FaPaperPlane,
  FaTrash,
  FaPlay,
  FaPause,
  FaStop,
  FaTimes,
  FaUndo,
  FaRedo,
  FaDownload,
  FaShare,
  FaCompass,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaEraser,
  FaFillDrip,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import AuthModal from './components/AuthModal';
import { saveMessage, getUserMessages, deleteMessage, subscribeToDirectionalMessages, getMessagesInDirection } from './firebase/messages';
import { uploadAudio, uploadImage, uploadDrawing, compressImage } from './firebase/storage';
import { signOutUser, signInAnon } from './firebase/auth';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import WriteNote from './components/WriteNote';
import DrawNote from './components/DrawNote';
import RecordNote from './components/RecordNote';
import PictureNote from './components/PictureNote';

// AnimatedPlane component for flight animation
const AnimatedPlane = ({ startPosition, endPosition, duration }) => {
  const [position, setPosition] = useState(startPosition);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const [startLat, startLng] = startPosition;
    const [endLat, endLng] = endPosition;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = easeInOutCubic(progress);
      
      const currentLat = startLat + (endLat - startLat) * easedProgress;
      const currentLng = startLng + (endLng - startLng) * easedProgress;
      
      setPosition([currentLat, currentLng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimationComplete(true);
      }
    };
    
    requestAnimationFrame(animate);
  }, [startPosition, endPosition, duration]);

  if (animationComplete) return null;

  return (
    <Marker position={position}>
      <Popup>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>✈️</div>
          <div>Flying to destination...</div>
        </div>
      </Popup>
    </Marker>
  );
};

function AppContent() {
  const { user, loading, nearbyMessages, userLocation } = useFirebase();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [noteType, setNoteType] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteHistory, setNoteHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [drawingPath, setDrawingPath] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentColor, setCurrentColor] = useState('#2C2C2C');
  const [brushSize, setBrushSize] = useState(3);
  const [activeTab, setActiveTab] = useState('home');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStrokes, setDrawingStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showCompass, setShowCompass] = useState(false);
  const [compassHeading, setCompassHeading] = useState(0);
  const [compassActive, setCompassActive] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(1.0); // in miles
  const [isDragging, setIsDragging] = useState(false);
  const [showFlightAnimation, setShowFlightAnimation] = useState(false);
  const [flightDestination, setFlightDestination] = useState(null);
  const [drawingTool, setDrawingTool] = useState('brush'); // 'brush', 'eraser', 'fill'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin', 'signup', 'anonymous'
  const [savingMessage, setSavingMessage] = useState(false);
  const [directionalMessages, setDirectionalMessages] = useState([]);
  const [showDirectionalMessages, setShowDirectionalMessages] = useState(false);
  
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const compassRef = useRef(null);

  // Get user location and compass heading
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);
        },
        (error) => {
          setErrorMsg('Location access denied');
          console.error('Location error:', error);
        }
      );
    } else {
      setErrorMsg('Geolocation is not supported by this browser');
    }
  }, []);

  // Load user's message history when user is authenticated
  useEffect(() => {
    if (user) {
      loadUserMessages();
    }
  }, [user]);

  // Use Firebase location if available, fallback to local location
  const currentLocation = userLocation || location;

  // Listen for directional messages when compass is active
  useEffect(() => {
    if (compassActive && currentLocation && user) {
      const unsubscribe = subscribeToDirectionalMessages(
        currentLocation.lat,
        currentLocation.lng,
        compassHeading,
        1, // 1km radius
        45, // 45 degree cone
        (messages) => {
          setDirectionalMessages(messages);
        }
      );

      return () => unsubscribe();
    }
  }, [compassActive, currentLocation, compassHeading, user]);

  // Compass functionality
  useEffect(() => {
    if (compassActive && 'DeviceOrientationEvent' in window) {
      const handleOrientation = (event) => {
        if (event.alpha !== null) {
          setCompassHeading(event.alpha);
        }
      };

      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [compassActive]);

  // Real-time drawing canvas update with proper stroke handling
  useEffect(() => {
    if (noteType === 'drawn' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw all completed strokes
      drawingStrokes.forEach(stroke => {
        if (stroke.length > 1) {
          ctx.beginPath();
          ctx.moveTo(stroke[0].x, stroke[0].y);
          for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
          }
          ctx.strokeStyle = stroke[0].color;
          ctx.lineWidth = stroke[0].size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });
      
      // Draw current stroke being drawn
      if (currentStroke.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) {
          ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
        ctx.strokeStyle = currentStroke[0].color;
        ctx.lineWidth = currentStroke[0].size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }
  }, [drawingStrokes, currentStroke, noteType]);

  const openNoteModal = (type) => {
    setNoteType(type);
    setNoteContent('');
    setDrawingPath([]);
    setDrawingStrokes([]);
    setCurrentStroke([]);
    setSelectedImage(null);
    setRecording(null);
    setUndoStack([]);
    setRedoStack([]);
    setDrawingTool('brush');
    setCurrentColor('#2C2C2C');
  };

  const openCompassForMessage = (type) => {
    setNoteType(type);
    setNoteContent('');
    setDrawingPath([]);
    setDrawingStrokes([]);
    setCurrentStroke([]);
    setSelectedImage(null);
    setRecording(null);
    setUndoStack([]);
    setRedoStack([]);
    setDrawingTool('brush');
    setCurrentColor('#2C2C2C');
    setShowCompass(true);
  };

  const closeNoteModal = () => {
    setNoteType(null);
    setNoteContent('');
    setDrawingPath([]);
    setDrawingStrokes([]);
    setCurrentStroke([]);
    setSelectedImage(null);
    setRecording(null);
    setIsRecording(false);
    setUndoStack([]);
    setRedoStack([]);
    setDrawingTool('brush');
  };

  // Load user's messages from Firebase
  const loadUserMessages = async () => {
    if (!user) return;
    
    const result = await getUserMessages(user.uid);
    if (result.success) {
      setNoteHistory(result.messages);
    }
  };

  const saveNote = async () => {
    if (!noteContent && drawingStrokes.length === 0 && !selectedImage && !recording) {
      showToast('Please add some content to your note', 'error');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!currentLocation) {
      showToast('Location is required to send messages', 'error');
      return;
    }

    setSavingMessage(true);

    try {
      let uploadedFiles = {};

      // Upload files to Firebase Storage
      if (recording && recording.blob) {
        const audioResult = await uploadAudio(recording.blob, user.uid);
        if (audioResult.success) {
          uploadedFiles.audio = audioResult.url;
        }
      }

      if (selectedImage && selectedImage.file) {
        const compressedImage = await compressImage(selectedImage.file);
        const imageResult = await uploadImage(compressedImage, user.uid);
        if (imageResult.success) {
          uploadedFiles.image = imageResult.url;
        }
      }

      if (drawingStrokes.length > 0) {
        const drawingResult = await uploadDrawing(drawingStrokes, user.uid);
        if (drawingResult.success) {
          uploadedFiles.drawing = drawingResult.url;
        }
      }

      // Calculate destination if using compass mode
      let destination = null;
      if (showCompass) {
        destination = calculateDestination(
          currentLocation.lat, 
          currentLocation.lng, 
          compassHeading, 
          selectedDistance
        );
      }

      // Prepare message data for Firebase
      const messageData = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        type: noteType,
        content: noteContent,
        location: currentLocation,
        direction: compassHeading, // Include the direction the message was sent
        distance: showCompass ? selectedDistance : null, // Include distance if using compass
        destination: destination, // Include calculated destination
        files: uploadedFiles,
        // Keep local data for immediate display
        localData: {
          drawing: drawingStrokes,
          image: selectedImage,
          audio: recording
        }
      };

      // Save to Firebase
      const result = await saveMessage(messageData);
      
      if (result.success) {
        // Add to local history for immediate display
        const newNote = {
          id: result.id,
          ...messageData,
          timestamp: new Date()
        };
        setNoteHistory(prev => [newNote, ...prev]);
        
        closeNoteModal();
        showToast('✈️ Paper airplane sent successfully!', 'success');
        
        // Show compass screen after saving
        setTimeout(() => setShowCompass(true), 500);
      } else {
        showToast('Failed to send message: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error saving message:', error);
      showToast('Failed to send message', 'error');
    } finally {
      setSavingMessage(false);
    }
  };

  const closeCompass = () => {
    setShowCompass(false);
  };

  const toggleCompass = () => {
    setCompassActive(!compassActive);
  };

  const getDirection = (heading) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  const getDirectionName = (heading) => {
    if (heading >= 337.5 || heading < 22.5) return 'North';
    if (heading >= 22.5 && heading < 67.5) return 'Northeast';
    if (heading >= 67.5 && heading < 112.5) return 'East';
    if (heading >= 112.5 && heading < 157.5) return 'Southeast';
    if (heading >= 157.5 && heading < 202.5) return 'South';
    if (heading >= 202.5 && heading < 247.5) return 'Southwest';
    if (heading >= 247.5 && heading < 292.5) return 'West';
    if (heading >= 292.5 && heading < 337.5) return 'Northwest';
    return 'North';
  };

  // Calculate destination coordinates based on heading and distance
  const calculateDestination = (lat, lng, heading, distanceMiles) => {
    const R = 3959; // Earth's radius in miles
    const lat1 = lat * Math.PI / 180;
    const lng1 = lng * Math.PI / 180;
    const bearing = heading * Math.PI / 180;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceMiles / R) +
      Math.cos(lat1) * Math.sin(distanceMiles / R) * Math.cos(bearing)
    );
    
    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(distanceMiles / R) * Math.cos(lat1),
      Math.cos(distanceMiles / R) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    return {
      lat: lat2 * 180 / Math.PI,
      lng: lng2 * 180 / Math.PI
    };
  };

  // Handle compass rotation via mouse/touch
  const handleCompassMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleCompassMouseMove = (e) => {
    if (!isDragging) return;
    
    const compass = compassRef.current;
    if (!compass) return;
    
    const rect = compass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    const normalizedAngle = (angle + 90 + 360) % 360;
    setCompassHeading(normalizedAngle);
  };

  const handleCompassMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch events for mobile
  const handleCompassTouchStart = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleCompassTouchMove = (e) => {
    if (!isDragging) return;
    
    const compass = compassRef.current;
    if (!compass) return;
    
    const rect = compass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const touch = e.touches[0];
    const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * 180 / Math.PI;
    const normalizedAngle = (angle + 90 + 360) % 360;
    setCompassHeading(normalizedAngle);
  };

  const handleCompassTouchEnd = () => {
    setIsDragging(false);
  };

  // Send message with compass direction and distance
  const sendCompassMessage = async () => {
    if (!currentLocation) {
      showToast('Location is required to send messages', 'error');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check if user has created content
    if (!noteContent && drawingStrokes.length === 0 && !selectedImage && !recording) {
      showToast('Please create your message first!', 'error');
      return;
    }

    setSavingMessage(true);

    try {
      let uploadedFiles = {};

      // Upload files to Firebase Storage
      if (recording && recording.blob) {
        const audioResult = await uploadAudio(recording.blob, user.uid);
        if (audioResult.success) {
          uploadedFiles.audio = audioResult.url;
        }
      }

      if (selectedImage && selectedImage.file) {
        const compressedImage = await compressImage(selectedImage.file);
        const imageResult = await uploadImage(compressedImage, user.uid);
        if (imageResult.success) {
          uploadedFiles.image = imageResult.url;
        }
      }

      if (drawingStrokes.length > 0) {
        const drawingResult = await uploadDrawing(drawingStrokes, user.uid);
        if (drawingResult.success) {
          uploadedFiles.drawing = drawingResult.url;
        }
      }

      const destination = calculateDestination(
        currentLocation.lat, 
        currentLocation.lng, 
        compassHeading, 
        selectedDistance
      );

      // Prepare message data for Firebase
      const messageData = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        type: noteType,
        content: noteContent,
        location: currentLocation,
        direction: compassHeading,
        distance: selectedDistance,
        destination: destination,
        files: uploadedFiles,
        localData: {
          drawing: drawingStrokes,
          image: selectedImage,
          audio: recording
        }
      };

      // Save to Firebase
      const result = await saveMessage(messageData);
      
      if (result.success) {
        // Add to local history for immediate display
        const newNote = {
          id: result.id,
          ...messageData,
          timestamp: new Date()
        };
        setNoteHistory(prev => [newNote, ...prev]);
        
        showToast('✈️ Paper airplane sent successfully!', 'success');
        
        // Show flight animation
        setFlightDestination(destination);
        setShowFlightAnimation(true);
        setShowCompass(false);
        setActiveTab('map');
        
        // Show flight animation for 3 seconds, then return to normal map view
        setTimeout(() => {
          setShowFlightAnimation(false);
          setFlightDestination(null);
        }, 3000);
      } else {
        showToast('Failed to send message: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error saving message:', error);
      showToast('Failed to send message', 'error');
    } finally {
      setSavingMessage(false);
    }
  };

  // Enhanced drawing functionality with proper stroke separation
  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (noteType !== 'drawn') return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getEventPos(e);
    
    if (drawingTool === 'fill') {
      fillArea(pos.x, pos.y);
      return;
    }
    
    const newPoint = { 
      x: pos.x, 
      y: pos.y, 
      color: drawingTool === 'eraser' ? '#FFFFFF' : currentColor, 
      size: drawingTool === 'eraser' ? brushSize * 2 : brushSize,
      tool: drawingTool
    };
    setCurrentStroke([newPoint]);
  };

  const draw = (e) => {
    if (!isDrawing || noteType !== 'drawn' || drawingTool === 'fill') return;
    e.preventDefault();
    const pos = getEventPos(e);
    const newPoint = { 
      x: pos.x, 
      y: pos.y, 
      color: drawingTool === 'eraser' ? '#FFFFFF' : currentColor, 
      size: drawingTool === 'eraser' ? brushSize * 2 : brushSize,
      tool: drawingTool
    };
    setCurrentStroke(prev => [...prev, newPoint]);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (isDrawing && currentStroke.length > 0) {
      setDrawingStrokes(prev => [...prev, currentStroke]);
      setUndoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
      setRedoStack([]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const fillArea = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const targetColor = getPixelColor(data, x, y, canvas.width);
    const fillColor = hexToRgb(currentColor);
    
    if (colorsEqual(targetColor, fillColor)) return;
    
    const stack = [{x: Math.floor(x), y: Math.floor(y)}];
    const visited = new Set();
    
    while (stack.length > 0) {
      const {x: px, y: py} = stack.pop();
      const key = `${px},${py}`;
      
      if (visited.has(key) || px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
        continue;
      }
      
      const pixelColor = getPixelColor(data, px, py, canvas.width);
      if (!colorsEqual(pixelColor, targetColor)) {
        continue;
      }
      
      visited.add(key);
      setPixelColor(data, px, py, fillColor, canvas.width);
      
      stack.push({x: px + 1, y: py}, {x: px - 1, y: py}, {x: px, y: py + 1}, {x: px, y: py - 1});
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add fill operation to history
    const fillStroke = [{x, y, color: currentColor, size: 1, tool: 'fill'}];
    setDrawingStrokes(prev => [...prev, fillStroke]);
    setUndoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
    setRedoStack([]);
  };

  const getPixelColor = (data, x, y, width) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3]
    };
  };

  const setPixelColor = (data, x, y, color, width) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = 255;
  };

  const colorsEqual = (color1, color2) => {
    return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  };

  const clearDrawing = () => {
    if (drawingStrokes.length > 0 || currentStroke.length > 0) {
      setUndoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
      setRedoStack([]);
    }
    setDrawingStrokes([]);
    setCurrentStroke([]);
  };

  const undoDrawing = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
      setDrawingStrokes(lastState.strokes);
      setCurrentStroke(lastState.currentStroke);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const redoDrawing = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
      setDrawingStrokes(nextState.strokes);
      setCurrentStroke(nextState.currentStroke);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const downloadDrawing = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `paper-airplane-drawing-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setRecording({ url, blob });
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (recording && audioRef.current) {
      audioRef.current.play();
    }
  };

  // Image handling
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage({ url: e.target.result, file });
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteNote = async (id) => {
    try {
      const result = await deleteMessage(id);
      if (result.success) {
        setNoteHistory(prev => prev.filter(note => note.id !== id));
        showToast('Message deleted successfully', 'success');
      } else {
        showToast('Failed to delete message', 'error');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Failed to delete message', 'error');
    }
  };

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      setNoteHistory([]);
      showToast('Signed out successfully', 'success');
    } else {
      showToast('Failed to sign out', 'error');
    }
  };

  const shareNote = (note) => {
    if (navigator.share) {
      navigator.share({
        title: 'Paper Airplane Message',
        text: note.type === 'written' ? note.content : `Check out my ${note.type} message!`,
        url: window.location.href
      }).catch(() => {
        // Fallback to clipboard
        const text = note.type === 'written' ? note.content : `Check out my ${note.type} message!`;
        navigator.clipboard.writeText(text).then(() => {
          showToast('Message copied to clipboard!', 'success');
        });
      });
    } else {
      const text = note.type === 'written' ? note.content : `Check out my ${note.type} message!`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Message copied to clipboard!', 'success');
      });
    }
  };

  const showToast = (message, type = 'info') => {
    const toastDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'linear-gradient(135deg, #A8C8A8, #8BAA8B)' : 
                   type === 'error' ? 'linear-gradient(135deg, #DC143C, #B22222)' : 
                   'linear-gradient(135deg, #D4B896, #C4A484)';
    
    toastDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${bgColor};
      color: white;
      padding: 15px 25px;
      border-radius: 25px;
      font-weight: 700;
      z-index: 2000;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      animation: slideInDown 0.3s ease-out;
    `;
    toastDiv.textContent = message;
    document.body.appendChild(toastDiv);
    
    setTimeout(() => {
      toastDiv.style.animation = 'slideInUp 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toastDiv), 300);
    }, 3000);
  };

  // Show loading screen while Firebase initializes
  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2>Loading Paper Airplane...</h2>
          <p>Getting ready to fly! ✈️</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="container">
        <div className="error-text">{errorMsg}</div>
      </div>
    );
  }

  // Handle anonymous sign in
  const handleAnonymousSignIn = async () => {
    const result = await signInAnon();
    if (result.success) {
      showToast('Welcome! You can start flying anonymously ✈️', 'success');
    } else {
      showToast('Failed to sign in anonymously: ' + result.error, 'error');
    }
  };

  // Handle email sign in
  const handleEmailSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  // Handle sign up
  const handleSignUp = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  // Show authentication screen if user is not signed in
  if (!user) {
    return (
      <div className="container">
        <div className="auth-required-screen">
          <div className="auth-required-content">
            <div className="auth-icon-large">
              <FaPaperPlane size={80} />
            </div>
            <h1 className="auth-required-title">Welcome to Paper Airplane! ✈️</h1>
            <p className="auth-required-subtitle">
              Choose how you'd like to start your journey
            </p>
            <div className="auth-required-actions">
              <button 
                className="auth-button primary"
                onClick={handleEmailSignIn}
              >
                <FaUser size={18} />
                Log In
              </button>
              <button 
                className="auth-button secondary"
                onClick={handleSignUp}
              >
                <FaUser size={18} />
                Sign Up
              </button>
              <button 
                className="auth-button tertiary"
                onClick={handleAnonymousSignIn}
              >
                <FaPaperPlane size={18} />
                Continue as Anonymous
              </button>
            </div>
            <p className="auth-required-note">
              You can always change your account type later
            </p>
          </div>
        </div>

        {/* Authentication Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    );
  }

  // Add these functions before the renderHomeScreen function

  // Handle compass mode toggle
  const handleCompassMode = () => {
    setShowCompass(true);
  };

  // Handle location refresh
  const handleLocationRefresh = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);
          showToast('Location updated! 📍', 'success');
        },
        (error) => {
          showToast('Failed to get location: ' + error.message, 'error');
        }
      );
    } else {
      showToast('Geolocation not supported', 'error');
    }
  };

  // Handle global network info
  const handleGlobalNetwork = () => {
    showToast(`Connected to ${nearbyMessages.length} nearby messages worldwide! ��`, 'info');
  };

  // Handle stats box clicks
  const handleStatsClick = (type) => {
    switch(type) {
      case 'messages':
        setActiveTab('history');
        showToast('Viewing your message history 📨', 'info');
        break;
      case 'nearby':
        setActiveTab('map');
        showToast('Viewing nearby messages on map 🌍', 'info');
        break;
      case 'possibilities':
        showToast('The sky\'s the limit! ✈️', 'info');
        break;
      default:
        break;
    }
  };

  // Handle decoration text click
  const handleReadyToFly = () => {
    showToast('Choose a message type above to get started! ✈️', 'info');
  };

  const renderCompassScreen = () => (
    <div className="compass-screen">
      <div className="compass-header">
        <h1 className="compass-title">🧭 Aim Your Message</h1>
        <p className="compass-subtitle">Create your {noteType} message and choose where to send it</p>
      </div>

      <div className="compass-container">
        <div 
          className="compass-rose interactive-compass" 
          ref={compassRef}
          onMouseDown={handleCompassMouseDown}
          onMouseMove={handleCompassMouseMove}
          onMouseUp={handleCompassMouseUp}
          onMouseLeave={handleCompassMouseUp}
          onTouchStart={handleCompassTouchStart}
          onTouchMove={handleCompassTouchMove}
          onTouchEnd={handleCompassTouchEnd}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div 
            className="compass-needle" 
            style={{ transform: `rotate(${compassHeading}deg)` }}
          >
            <div className="needle-north">N</div>
            <div className="needle-south">S</div>
          </div>
          
          <div className="compass-directions">
            <div className="direction north">N</div>
            <div className="direction northeast">NE</div>
            <div className="direction east">E</div>
            <div className="direction southeast">SE</div>
            <div className="direction south">S</div>
            <div className="direction southwest">SW</div>
            <div className="direction west">W</div>
            <div className="direction northwest">NW</div>
          </div>
        </div>

        <div className="compass-info">
          <div className="heading-display">
            <span className="heading-number">{Math.round(compassHeading)}°</span>
            <span className="heading-direction">{getDirectionName(compassHeading)}</span>
          </div>
        </div>

        {/* Distance Selection */}
        <div className="distance-selection">
          <h3 className="distance-title">How far will it fly?</h3>
          <div className="distance-controls">
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={selectedDistance}
              onChange={(e) => setSelectedDistance(parseFloat(e.target.value))}
              className="distance-slider"
            />
            <div className="distance-display">
              <span className="distance-value">{selectedDistance}</span>
              <span className="distance-unit">miles</span>
            </div>
          </div>
          <div className="distance-presets">
            <button 
              className={`preset-button ${selectedDistance === 0.25 ? 'active' : ''}`}
              onClick={() => setSelectedDistance(0.25)}
            >
              0.25 mi
            </button>
            <button 
              className={`preset-button ${selectedDistance === 0.5 ? 'active' : ''}`}
              onClick={() => setSelectedDistance(0.5)}
            >
              0.5 mi
            </button>
            <button 
              className={`preset-button ${selectedDistance === 1 ? 'active' : ''}`}
              onClick={() => setSelectedDistance(1)}
            >
              1 mi
            </button>
            <button 
              className={`preset-button ${selectedDistance === 2 ? 'active' : ''}`}
              onClick={() => setSelectedDistance(2)}
            >
              2 mi
            </button>
            <button 
              className={`preset-button ${selectedDistance === 5 ? 'active' : ''}`}
              onClick={() => setSelectedDistance(5)}
            >
              5 mi
            </button>
          </div>
        </div>

        <div className="compass-message">
          <p>🖱️ Drag the compass to aim your message</p>
          <p>✈️ Your paper airplane will fly {selectedDistance} mile{selectedDistance !== 1 ? 's' : ''} in that direction!</p>
        </div>
      </div>

      <div className="compass-actions">
        <button className="compass-button primary" onClick={sendCompassMessage}>
          <FaPaperPlane size={20} />
          Send Message & Watch It Fly!
        </button>
        <button className="compass-button secondary" onClick={closeCompass}>
          <FaTimes size={20} />
          Cancel
        </button>
      </div>

      {/* Message Creation Modals */}
      <WriteNote 
        isOpen={noteType === 'written'}
        onClose={closeNoteModal}
        onSave={(content) => {
          setNoteContent(content);
          // Don't auto-save, let user control when to send
        }}
        savingMessage={savingMessage}
      />

      <DrawNote 
        isOpen={noteType === 'drawn'}
        onClose={closeNoteModal}
        onSave={(drawingData) => {
          setDrawingStrokes(drawingData);
          // Don't auto-save, let user control when to send
        }}
        savingMessage={savingMessage}
      />

      <RecordNote 
        isOpen={noteType === 'audio'}
        onClose={closeNoteModal}
        onSave={(audioData) => {
          setRecording(audioData);
          // Don't auto-save, let user control when to send
        }}
        savingMessage={savingMessage}
      />

      <PictureNote 
        isOpen={noteType === 'picture'}
        onClose={closeNoteModal}
        onSave={(imageData) => {
          setSelectedImage(imageData);
          // Don't auto-save, let user control when to send
        }}
        savingMessage={savingMessage}
      />
    </div>
  );

  const renderHomeScreen = () => (
    <div className="home-container">
      {/* Enhanced Decorative background elements */}
      <div className="background-decoration">
        {/* More planes */}
        <div className="floating-plane plane-1">✈️</div>
        <div className="floating-plane plane-2">✈️</div>
        <div className="floating-plane plane-3">✈️</div>
        <div className="floating-plane plane-4">✈️</div>
        <div className="floating-plane plane-5">✈️</div>
        <div className="floating-plane plane-6">✈️</div>
        
        {/* More clouds */}
        <div className="cloud cloud-1">☁️</div>
        <div className="cloud cloud-2">☁️</div>
        <div className="cloud cloud-3">☁️</div>
        <div className="cloud cloud-4">☁️</div>
        <div className="cloud cloud-5">☁️</div>
        <div className="cloud cloud-6">☁️</div>
        <div className="cloud cloud-7">☁️</div>
        <div className="cloud cloud-8">☁️</div>
        
        {/* Twinkling stars */}
        <div className="floating-star star-1">✨</div>
        <div className="floating-star star-2">✨</div>
        <div className="floating-star star-3">✨</div>
        <div className="floating-star star-4">✨</div>
      </div>

      {/* Header - Fixed height */}
      <div className="header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="header-title">✈️ Paper Airplane</h1>
            <p className="header-subtitle">Send your thoughts into the sky</p>
          </div>
          <div className="header-actions">
            {user ? (
              <div className="user-info">
                <span className="user-name">
                  <FaUser size={16} />
                  {user.displayName || 'Anonymous'}
                </span>
                <button 
                  className="sign-out-button"
                  onClick={handleSignOut}
                  title="Sign Out"
                >
                  <FaSignOutAlt size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="sign-in-button"
                onClick={() => setShowAuthModal(true)}
              >
                <FaUser size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats/Info Section - Fixed height */}
      <div className="stats-section">
        <div 
          className="stat-box clickable-stat"
          onClick={() => handleStatsClick('messages')}
          title="Click to view message history"
        >
          <div className="stat-icon">📨</div>
          <div className="stat-content">
            <div className="stat-number">{noteHistory.length}</div>
            <div className="stat-label">Messages Sent</div>
          </div>
        </div>
        <div 
          className="stat-box clickable-stat"
          onClick={() => handleStatsClick('nearby')}
          title="Click to view on map"
        >
          <div className="stat-icon">🌍</div>
          <div className="stat-content">
            <div className="stat-number">{nearbyMessages.length}</div>
            <div className="stat-label">Nearby Messages</div>
          </div>
        </div>
        <div 
          className="stat-box clickable-stat"
          onClick={() => handleStatsClick('possibilities')}
          title="Click for inspiration"
        >
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">∞</div>
            <div className="stat-label">Possibilities</div>
          </div>
        </div>
      </div>

      {/* Main Options Grid - Flexible but constrained */}
      <div className="options-section">
        <div className="section-title">
          <h2>Choose Your Message Type</h2>
          <div className="title-decoration"></div>
        </div>
        
        <div className="options-grid">
          <button 
            className="option-card write-card"
            onClick={() => openCompassForMessage('written')}
          >
            <div className="card-background"></div>
            <div className="card-icon-container">
              <FaEdit size={40} />
            </div>
            <h3 className="card-title">Write</h3>
            <p className="card-subtitle">Text notes</p>
            <div className="card-decoration"></div>
          </button>

          <button 
            className="option-card draw-card"
            onClick={() => openCompassForMessage('drawn')}
          >
            <div className="card-background"></div>
            <div className="card-icon-container">
              <FaPaintBrush size={40} />
            </div>
            <h3 className="card-title">Draw</h3>
            <p className="card-subtitle">Sketch & doodle</p>
            <div className="card-decoration"></div>
          </button>

          <button 
            className="option-card record-card"
            onClick={() => openCompassForMessage('audio')}
          >
            <div className="card-background"></div>
            <div className="card-icon-container">
              <FaMicrophone size={40} />
            </div>
            <h3 className="card-title">Record</h3>
            <p className="card-subtitle">Voice messages</p>
            <div className="card-decoration"></div>
          </button>

          <button 
            className="option-card picture-card"
            onClick={() => openCompassForMessage('picture')}
          >
            <div className="card-background"></div>
            <div className="card-icon-container">
              <FaCamera size={40} />
            </div>
            <h3 className="card-title">Picture</h3>
            <p className="card-subtitle">Photos & images</p>
            <div className="card-decoration"></div>
          </button>
        </div>
      </div>

      {/* Quick Actions Section - Fixed height */}
      <div className="quick-actions">
        <div 
          className="quick-action-item clickable-action"
          onClick={handleCompassMode}
          title="Open compass mode"
        >
          <div className="quick-action-icon">🧭</div>
          <span>Compass Mode</span>
        </div>
        <div 
          className="quick-action-item clickable-action"
          onClick={handleLocationRefresh}
          title="Refresh location"
        >
          <div className="quick-action-icon">📍</div>
          <span>Location: {currentLocation ? 'Active' : 'Inactive'}</span>
        </div>
        <div 
          className="quick-action-item clickable-action"
          onClick={handleGlobalNetwork}
          title="View network status"
        >
          <div className="quick-action-icon">🌐</div>
          <span>Global Network</span>
        </div>
      </div>

      {/* Decorative bottom section - Fixed height */}
      <div className="bottom-decoration">
        <div className="decoration-line"></div>
        <div 
          className="decoration-text clickable-decoration"
          onClick={handleReadyToFly}
          title="Get started!"
        >
          Ready to fly? ✈️
        </div>
        <div className="decoration-line"></div>
      </div>
    </div>
  );

  const renderMapScreen = () => (
    <div className="map-container">
      {currentLocation ? (
        <MapContainer
          center={[currentLocation.lat, currentLocation.lng]}
          zoom={showFlightAnimation ? 12 : 15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Your location marker */}
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>Your Location</Popup>
          </Marker>
          
          {/* Flight destination marker */}
          {flightDestination && (
            <Marker position={[flightDestination.lat, flightDestination.lng]}>
              <Popup>Message Destination</Popup>
            </Marker>
          )}
          
          {/* Flight path line */}
          {showFlightAnimation && flightDestination && (
            <Polyline
              positions={[
                [currentLocation.lat, currentLocation.lng],
                [flightDestination.lat, flightDestination.lng]
              ]}
              color="#FF6B6B"
              weight={3}
              opacity={0.8}
            />
          )}
          
          {/* Animated plane marker */}
          {showFlightAnimation && flightDestination && (
            <AnimatedPlane 
              startPosition={[currentLocation.lat, currentLocation.lng]}
              endPosition={[flightDestination.lat, flightDestination.lng]}
              duration={3000}
            />
          )}
          
          {/* Show nearby messages on map */}
          {!showFlightAnimation && nearbyMessages.map((message) => (
            <Marker 
              key={message.id} 
              position={[message.location.lat, message.location.lng]}
            >
              <Popup>
                <div className="message-popup">
                  <h4>{message.userName}</h4>
                  <p>{message.type === 'written' ? message.content : `${message.type} message`}</p>
                  <small>{message.distance ? `${message.distance.toFixed(1)}km away` : ''}</small>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <div className="loading">Loading map...</div>
      )}
      
      {/* Flight animation overlay */}
      {showFlightAnimation && (
        <div className="flight-animation-overlay">
          <div className="flight-message">
            <div className="plane-icon">✈️</div>
            <h3>Your message is flying!</h3>
            <p>Watch it soar through the sky...</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryScreen = () => (
    <div className="history-container">
      <div className="history-header">
        <h2 className="history-title"> Message History</h2>
        <p className="history-subtitle">Your sent paper airplanes</p>
      </div>
      
      <div className="history-list">
        {noteHistory.length === 0 ? (
          <div className="empty-history">
            <FaPaperPlane size={60} />
            <p className="empty-history-text">No messages yet</p>
            <p className="empty-history-subtext">Start by sending your first paper airplane!</p>
          </div>
        ) : (
          noteHistory.map((note) => (
            <div key={note.id} className="history-item">
              <div className="history-item-header">
                <div className="history-item-type">
                  {note.type === 'written' && <FaEdit size={20} />}
                  {note.type === 'drawn' && <FaPaintBrush size={20} />}
                  {note.type === 'audio' && <FaMicrophone size={20} />}
                  {note.type === 'picture' && <FaCamera size={20} />}
                  <span className="history-item-type-text">
                    {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                  </span>
                </div>
                <div className="history-item-actions">
                  <button 
                    className="action-button share-button"
                    onClick={() => shareNote(note)}
                    title="Share"
                  >
                    <FaShare size={14} />
                  </button>
                  <button 
                    className="action-button delete-button"
                    onClick={() => deleteNote(note.id)}
                    title="Delete"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
              <p className="history-item-time">
                {note.timestamp.toLocaleDateString()} at {note.timestamp.toLocaleTimeString()}
              </p>
              <p className="history-item-content">
                {note.type === 'written' && note.content}
                {note.type === 'drawn' && `Drawing with ${note.drawing.length} strokes`}
                {note.type === 'audio' && 'Audio Message'}
                {note.type === 'picture' && 'Picture'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="container">
      {/* Authentication Required Screen */}
      {!user && !loading && !errorMsg && (
        <div className="auth-required-screen">
          <div className="auth-required-content">
            <div className="auth-icon-large">
              <FaPaperPlane size={80} />
            </div>
            <h1 className="auth-required-title">Welcome to Paper Airplane! ✈️</h1>
            <p className="auth-required-subtitle">
              Choose how you'd like to start your journey
            </p>
            <div className="auth-required-actions">
              <button 
                className="auth-button primary"
                onClick={handleEmailSignIn}
              >
                <FaUser size={18} />
                Log In
              </button>
              <button 
                className="auth-button secondary"
                onClick={handleSignUp}
              >
                <FaUser size={18} />
                Sign Up
              </button>
              <button 
                className="auth-button tertiary"
                onClick={handleAnonymousSignIn}
              >
                <FaPaperPlane size={18} />
                Continue as Anonymous
              </button>
            </div>
            <p className="auth-required-note">
              You can always change your account type later
            </p>
          </div>
        </div>
      )}

      {/* Compass Screen */}
      {user && showCompass && renderCompassScreen()}

      {/* Main Content - Only show if user is authenticated */}
      {user && !showCompass && activeTab === 'home' && renderHomeScreen()}
      {user && !showCompass && activeTab === 'map' && renderMapScreen()}
      {user && !showCompass && activeTab === 'history' && renderHistoryScreen()}

      {/* Bottom Navigation - Only show if user is authenticated */}
      {user && !showCompass && (
        <div className="bottom-nav">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'nav-item-active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <FaHome size={24} />
            <span className="nav-text">Home</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'map' ? 'nav-item-active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <FaMap size={24} />
            <span className="nav-text">Map</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'history' ? 'nav-item-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory size={24} />
            <span className="nav-text">History</span>
          </button>
        </div>
      )}

      {/* Authentication Modal - Only show when needed */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Feature Modals */}
      <WriteNote 
        isOpen={noteType === 'written'}
        onClose={closeNoteModal}
        onSave={(content) => {
          setNoteContent(content);
          saveNote();
        }}
        savingMessage={savingMessage}
      />

      <DrawNote 
        isOpen={noteType === 'drawn'}
        onClose={closeNoteModal}
        onSave={(drawingData) => {
          setDrawingStrokes(drawingData);
          saveNote();
        }}
        savingMessage={savingMessage}
      />

      <RecordNote 
        isOpen={noteType === 'audio'}
        onClose={closeNoteModal}
        onSave={(audioData) => {
          setRecording(audioData);
          saveNote();
        }}
        savingMessage={savingMessage}
      />

      <PictureNote 
        isOpen={noteType === 'picture'}
        onClose={closeNoteModal}
        onSave={(imageData) => {
          setSelectedImage(imageData);
          saveNote();
        }}
        savingMessage={savingMessage}
      />
    </div>
  );
}

// Main App component with Firebase Provider
function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}

export default App;
