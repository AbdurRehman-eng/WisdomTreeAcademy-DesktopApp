import React from 'react';
import './Topbar.css';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, CloudLightning, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export const Topbar = () => {
  const {
    user,
    activeScreen,
    syncStatus,
    syncProgress,
    pendingSyncCount,
    triggerSync,
    toggleOnlineState
  } = useApp();

  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  // Map screen ID to clean title
  const getScreenTitle = (id) => {
    switch (id) {
      case 'dashboard': return 'School Overview Dashboard';
      case 'students': return 'Student Registry Manager';
      case 'teachers-admins': return 'Teachers & Admins Console';
      case 'classes-subjects': return 'Classrooms & Subjects Manager';
      case 'question-bank': return 'Diagnostic Question Bank';
      case 'assessment-setup': return 'Setup Assessment';
      case 'assessment-runner': return 'Diagnostic Assessment Session';
      case 'assessment-results': return 'Diagnostic Assessment Results';
      case 'attendance': return 'Daily Attendance Register';
      case 'reports': return 'Printable Reports Center';
      case 'sync-settings': return 'Local Database & Settings';
      default: return 'School Management System';
    }
  };

  return (
    <header className="app-topbar">
      {/* Page Title & Scope */}
      <div className="topbar-left">
        <h2 className="topbar-page-title">{getScreenTitle(activeScreen)}</h2>
      </div>

      {/* Profile, Theme, and Sync Controls */}
      <div className="topbar-right">
        {/* Connection & Sync Status Widget */}
        <div className="sync-status-widget">
          {syncStatus === 'offline' ? (
            <button
              onClick={toggleOnlineState}
              className="sync-badge badge-offline-interactive"
              title="System is Offline. Click to go Online."
            >
              <AlertCircle size={14} className="sync-badge-icon" />
              <span>Offline Mode</span>
            </button>
          ) : syncStatus === 'syncing' ? (
            <div className="sync-badge badge-syncing">
              <RefreshCw size={14} className="sync-badge-icon spinner" />
              <span>Syncing ({syncProgress}%)</span>
            </div>
          ) : (
            <button
              onClick={toggleOnlineState}
              className="sync-badge badge-online-interactive"
              title="System is Online. Click to go Offline."
            >
              <CheckCircle size={14} className="sync-badge-icon" />
              <span>Synced</span>
            </button>
          )}

          {pendingSyncCount > 0 && syncStatus !== 'offline' && (
            <button
              onClick={triggerSync}
              className="sync-trigger-btn"
              disabled={syncStatus === 'syncing'}
              title={`Click to synchronize ${pendingSyncCount} local changes to cloud.`}
            >
              <RefreshCw size={12} className={syncStatus === 'syncing' ? 'spinner' : ''} />
              <span>{pendingSyncCount} pending</span>
            </button>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User Card */}
        <div className="topbar-user-card">
          <div className="user-avatar-circle">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="user-details-wrapper">
            <span className="user-profile-name">{user.name}</span>
            <span className="user-profile-role-badge">
              {user.role === 'admin' ? 'Administrator' : 'Teacher'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
