import React, { useState } from 'react';
import { FaTimes, FaPaperPlane, FaCamera } from 'react-icons/fa';

const PictureNote = ({ isOpen, onClose, onSave, savingMessage }) => {
  const [selectedImage, setSelectedImage] = useState(null);

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

  const handleSave = () => {
    if (!selectedImage) {
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
      toast.textContent = 'Please select an image first';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      return;
    }
    onSave(selectedImage);
    setSelectedImage(null);
  };

  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">📸 Take/Upload Picture</h2>
          <button onClick={handleClose} className="close-button">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="picture-container">
            {selectedImage ? (
              <div className="image-preview">
                <img src={selectedImage.url} alt="Selected" className="selected-image" />
                <button 
                  className="change-image-button"
                  onClick={() => setSelectedImage(null)}
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div className="picture-options">
                <label className="picture-option">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <FaCamera size={40} />
                  <span className="picture-option-text">Upload Image</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={savingMessage || !selectedImage}
          >
            <FaPaperPlane size={20} />
            {savingMessage ? 'Sending...' : 'Send Picture'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PictureNote;
