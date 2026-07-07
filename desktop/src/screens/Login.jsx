import React, { useState } from 'react';
import './Login.css';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/common/Button';
import { ShieldCheck, GraduationCap, KeyRound, Monitor, Sun, Moon } from 'lucide-react';

export const Login = () => {
  const { login, showToast } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [role, setRole] = useState('admin'); // admin or teacher
  const [password, setPassword] = useState('password');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      showToast('Please enter your access passcode.', 'error');
      return;
    }

    // Since our database username matches the selected role ('admin' or 'teacher') and passwords are seeded
    await login(role, password);
  };

  return (
    <div className="login-screen-wrapper fade-in">
      {/* Decorative Floating Tree Shapes */}
      <div className="floating-shape shape-1">🌳</div>
      <div className="floating-shape shape-2">📚</div>

      {/* Main card */}
      <div className="login-card-container">
        {/* Toggle Theme in Login */}
        <button onClick={toggleTheme} className="login-theme-toggle" title="Toggle Theme">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <div className="login-card-header">
          <div className="login-logo-badge">🌳</div>
          <h1 className="login-brand-title">Wisdom Tree Academy</h1>
          <p className="login-brand-tagline">Diagnostic Assessment & School Management System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="login-form-block">
          {/* Role selector tiles */}
          <div className="login-role-selector-row">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`role-tile-btn ${role === 'admin' ? 'active' : ''}`}
            >
              <ShieldCheck size={20} className="role-tile-icon" />
              <span className="role-tile-label">Administrator</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`role-tile-btn ${role === 'teacher' ? 'active' : ''}`}
            >
              <GraduationCap size={20} className="role-tile-icon" />
              <span className="role-tile-label">Class Teacher</span>
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Default Access Account</label>
            <select className="form-select" disabled>
              {role === 'admin' ? (
                <option>Principal Vance (vance.admin)</option>
              ) : (
                <option>Clarissa Mercer (mercer.teach)</option>
              )}
            </select>
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
