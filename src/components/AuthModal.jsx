// Authentication Modal Component
import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { signInAnon, signInWithEmail, createUser } from '../firebase/auth';

const AuthModal = ({ isOpen, onClose, onSuccess, initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode); // Use initialMode instead of hardcoded 'signin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setError('');
    
    const result = await signInAnon();
    if (result.success) {
      onSuccess(result.user);
      onClose();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await signInWithEmail(email, password);
    if (result.success) {
      onSuccess(result.user);
      onClose();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await createUser(email, password, displayName);
    if (result.success) {
      onSuccess(result.user);
      onClose();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container auth-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'anonymous' && '✈️ Quick Start'}
            {mode === 'signin' && '🔐 Sign In'}
            {mode === 'signup' && '📝 Create Account'}
          </h2>
          <button onClick={onClose} className="close-button">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="modal-content">
          {mode === 'anonymous' && (
            <div className="auth-anonymous">
              <div className="auth-icon">
                <FaUser size={60} />
              </div>
              <h3>Start Flying Right Away!</h3>
              <p>Sign in anonymously to start sending paper airplanes. No registration required!</p>
              <button 
                className="auth-button primary"
                onClick={handleAnonymousSignIn}
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Start Flying ✈️'}
              </button>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <div className="auth-options">
                <button 
                  className="auth-option-button"
                  onClick={() => switchMode('signin')}
                >
                  Sign in with Email
                </button>
                <button 
                  className="auth-option-button"
                  onClick={() => switchMode('signup')}
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="auth-form">
              <div className="form-group">
                <label className="form-label">
                  <FaEnvelope size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FaLock size={16} />
                  Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                type="submit" 
                className="auth-button primary"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="auth-switch">
                <p>Don't have an account? 
                  <button 
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode('signup')}
                  >
                    Create one
                  </button>
                </p>
                <button 
                  type="button"
                  className="auth-link"
                  onClick={() => switchMode('anonymous')}
                >
                  Or start anonymously
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="form-group">
                <label className="form-label">
                  <FaUser size={16} />
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaEnvelope size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FaLock size={16} />
                  Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                type="submit" 
                className="auth-button primary"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="auth-switch">
                <p>Already have an account? 
                  <button 
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode('signin')}
                  >
                    Sign in
                  </button>
                </p>
                <button 
                  type="button"
                  className="auth-link"
                  onClick={() => switchMode('anonymous')}
                >
                  Or start anonymously
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
