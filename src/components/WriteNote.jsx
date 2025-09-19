import React, { useState } from 'react';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

const WriteNote = ({ isOpen, onClose, onSave, savingMessage }) => {
  const [noteContent, setNoteContent] = useState('');

  const handleSave = () => {
    // Fix: Check for trimmed content, not just truthy value
    if (!noteContent.trim()) {
      alert('Please add some content to your note');
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
