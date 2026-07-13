import React, { useState } from 'react';
import './Login.css';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { KeyRound, Monitor, Sun, Moon, User } from 'lucide-react';

export const Login = () => {
  const { login, showToast } = useApp();
  const { theme, toggleTheme } = useTheme();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Please enter your username or email address.', 'error');
      return;
    }
    if (!password) {
      showToast('Please enter your access passcode.', 'error');
      return;
    }

    await login(username.toLowerCase().trim(), password);
  };

  return (
    <div className="login-screen-wrapper fade-in">
      {/* Decorative Floating Tree Shapes */}
      <div className="floating-shape shape-1">🌳</div>
      <div className="floating-shape shape-2">📚</div>

      {/* Main card */}
      <div className="login-card-container">
        {/* Toggle Theme in Login */}
        <button type="button" onClick={toggleTheme} className="login-theme-toggle" title="Toggle Theme">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <div className="login-card-header">
          <div className="login-logo-badge">🌳</div>
          <h1 className="login-brand-title">Wisdom Tree Academy</h1>
          <p className="login-brand-tagline">Diagnostic Assessment & School Management System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="login-form-block">
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div className="password-input-wrapper">
              <User size={16} className="passcode-input-icon" />
              <input
                type="text"
                className="form-input password-input-field"
                placeholder="Enter username or email..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">System Access Passcode</label>
            <div className="password-input-wrapper">
              <KeyRound size={16} className="passcode-input-icon" />
              <input
                type="password"
                className="form-input password-input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="login-submit-action-btn">
            Authenticate & Launch Registry
          </button>
        </form>

        <div className="login-card-footer">
          <div className="offline-indicator-pill">
            <Monitor size={12} style={{ marginRight: '6px' }} />
            <span>Local Database Offline-First Client</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
