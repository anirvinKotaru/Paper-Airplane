import React, { useState, useRef } from 'react';
import { FaTimes, FaPaperPlane, FaMicrophone, FaStop, FaPlay } from 'react-icons/fa';

const RecordNote = ({ isOpen, onClose, onSave, savingMessage }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);

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

  const handleSave = () => {
    if (!recording) {
      // Use a more user-friendly notification instead of alert
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #DC143C, #B22222);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        font-weight: 700;
        z-index: 2000;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        animation: slideInDown 0.3s ease-out;
      `;
      toast.textContent = 'Please record something first';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      return;
    }
    onSave(recording);
    setRecording(null);
    setIsRecording(false);
  };

  const handleClose = () => {
    setRecording(null);
    setIsRecording(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">🎤 Record Audio</h2>
          <button onClick={handleClose} className="close-button">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="audio-container">
            {!recording ? (
              <button 
                className="record-button"
                onClick={isRecording ? stopRecording : startRecording}
              >
                <FaMicrophone size={40} />
                <span className="record-button-text">Tap to Record</span>
              </button>
            ) : (
              <div className="recording-container">
                <button 
                  className="stop-button"
                  onClick={stopRecording}
                >
                  <FaStop size={40} />
                </button>
                <p className="recording-text">Recording...</p>
              </div>
            )}
            
            {recording && (
              <div className="audio-playback-container">
                <p className="audio-saved">Audio recorded successfully!</p>
                <div className="playback-controls">
                  <button 
                    className="play-button"
                    onClick={playRecording}
                  >
                    <FaPlay size={30} />
                  </button>
                  <audio ref={audioRef} src={recording.url} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={savingMessage || !recording}
          >
            <FaPaperPlane size={20} />
            {savingMessage ? 'Sending...' : 'Send Audio'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordNote;
