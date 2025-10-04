import React, { useState } from 'react';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

const WriteNote = ({ isOpen, onClose, onSave, savingMessage }) => {
  const [noteContent, setNoteContent] = useState('');

  const handleSave = () => {
    // Fix: Check for trimmed content, not just truthy value
    if (!noteContent.trim()) {
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
      toast.textContent = 'Please add some content to your note';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      return;
    }
    onSave(noteContent.trim()); // Trim whitespace
    setNoteContent('');
  };

  const handleClose = () => {
    setNoteContent('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">✍️ Write a Note</h2>
          <button onClick={handleClose} className="close-button">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="notepad-container">
            <div className="notepad-header">
              <div className="notepad-binding"></div>
              <h3 className="notepad-title">My Note</h3>
            </div>
            <textarea
              className="notepad-input"
              placeholder="Write your message here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={10}
            />
            <div className="character-count">
              {noteContent.length} characters
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={savingMessage || !noteContent.trim()}
          >
            <FaPaperPlane size={20} />
            {savingMessage ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WriteNote;
