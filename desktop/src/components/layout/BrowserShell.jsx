import React from 'react';
import './BrowserShell.css';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, ArrowRight, RotateCw, Home, Shield, ExternalLink, AppWindow } from 'lucide-react';

export const BrowserShell = ({ children }) => {
  const { setScreen } = useApp();

  return (
    <div className="browser-mock-container">
      {/* Browser Tab Bar */}
      <div className="browser-tab-bar">
        <div className="browser-tabs">
          <div className="browser-tab active">
            <span className="browser-tab-title">Wisdom Tree Cloud Console</span>
            <div className="browser-tab-indicator"></div>
          </div>
          <button className="browser-new-tab">+</button>
        </div>

        {/* Escape hatch to return to the offline desktop software */}
        <button
          onClick={() => setScreen('dashboard')}
          className="browser-return-app-btn"
          title="Exit Owner Dashboard & Return to School Software"
        >
          <AppWindow size={14} style={{ marginRight: '6px' }} />
          Return to Desktop App
        </button>
      </div>

      {/* Browser Toolbar (URL & Actions) */}
      <div className="browser-toolbar">
        <div className="browser-nav-actions">
          <button className="browser-nav-btn" disabled><ArrowLeft size={16} /></button>
          <button className="browser-nav-btn" disabled><ArrowRight size={16} /></button>
          <button className="browser-nav-btn" onClick={() => window.location.reload()}><RotateCw size={14} /></button>
          <button className="browser-nav-btn" onClick={() => setScreen('dashboard')}><Home size={15} /></button>
        </div>

        <div className="browser-address-bar">
          <Shield size={14} className="address-lock-icon" />
          <span className="address-protocol">https://</span>
          <span className="address-host">owner.wisdomtreeacademy.org</span>
          <span className="address-path">/dashboard/analytics</span>
        </div>

        <div className="browser-options-menu">
          <span className="browser-badge-live">LIVE CLOUD</span>
        </div>
      </div>

      {/* Browser Window Viewport Content */}
      <div className="browser-viewport">
        {children}
      </div>
    </div>
  );
};

export default BrowserShell;
