import React from 'react';
import './DesktopShell.css';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toast from '../common/Toast';
import { Minus, Square, X, Monitor } from 'lucide-react';

export const DesktopShell = ({ children }) => {
  const { user, activeScreen, syncStatus } = useApp();

  // If the Login or Assessment Runner is active, we render in full viewport
  const isFullViewport = activeScreen === 'login' || activeScreen === 'assessment-runner';

  return (
    <div className="desktop-app-frame">
      {/* Title Bar simulating a Windows OS Window */}
      <div className="desktop-title-bar">
        <div className="title-bar-left">
          <Monitor size={14} className="window-icon" />
          <span className="window-title">
            Wisdom Tree Academy Diagnostic Assessment Software v1.0.4 
            {syncStatus === 'offline' && <span className="window-offline-badge"> [OFFLINE MODE]</span>}
          </span>
        </div>
        <div className="title-bar-drag-area"></div>
        <div className="title-bar-right">
          <button className="title-bar-btn" title="Minimize" onClick={() => window.api?.minimizeWindow()}><Minus size={12} /></button>
          <button className="title-bar-btn" title="Maximize" onClick={() => window.api?.maximizeWindow()}><Square size={10} /></button>
          <button className="title-bar-btn btn-close" title="Close" onClick={() => window.api?.closeWindow()}><X size={12} /></button>
        </div>
      </div>

      {/* Main OS Window Content */}
      <div className="desktop-window-content">
        {user && !isFullViewport ? (
          <div className="app-workspace-layout">
            <Sidebar />
            <div className="app-main-viewport">
              <Topbar />
              <div className="app-content-scroll">
                {children}
              </div>
            </div>
          </div>
        ) : (
          // Render children directly in full viewport
          <div className="app-workspace-layout-full">
            {children}
          </div>
        )}
      </div>

      {/* Global Slide-in Toast Notifications */}
      <Toast />
    </div>
  );
};

export default DesktopShell;
