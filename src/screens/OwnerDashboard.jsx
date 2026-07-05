import React from 'react';
import './OwnerDashboard.css';
import { useApp } from '../context/AppContext';
import { BrowserShell } from '../components/layout/BrowserShell';
import { Building2, Users2, ShieldAlert, Award, CreditCard, LineChart, Globe } from 'lucide-react';

export const OwnerDashboard = () => {
  const { setScreen } = useApp();

  return (
    <BrowserShell>
      <div className="owner-dashboard-container fade-in">
        {/* Header Hero panel */}
        <div className="owner-hero-panel">
          <div className="hero-left">
            <div className="cloud-badge">
              <Globe size={12} className="globe-spinner" />
              <span>Central Cloud Service API v2.1</span>
            </div>
            <h1 className="owner-hero-title">Central Academy Console</h1>
            <p className="owner-hero-subtext">Centralized analytics & licensing audit portal for Wisdom Tree Academy school chains.</p>
          </div>
          <div className="hero-right">
            <span className="owner-license-badge">Enterprise Tier Active</span>
          </div>
        </div>

        {/* Global Network statistics cards */}
        <div className="grid grid-cols-4" style={{ gap: '16px', margin: '20px 0' }}>
          <div className="card owner-stat-card">
            <div className="osc-icon primary"><Building2 size={20} /></div>
            <div className="osc-details">
              <span className="osc-label">Registered Branches</span>
              <span className="osc-val">5 Schools</span>
              <span className="osc-trend positive">All online & active</span>
            </div>
          </div>

          <div className="card owner-stat-card">
            <div className="osc-icon success"><Users2 size={20} /></div>
            <div className="osc-details">
              <span className="osc-label">Total Enrolled Pupils</span>
              <span className="osc-val">840 Students</span>
              <span className="osc-trend positive">+18 new registers</span>
            </div>
          </div>

          <div className="card owner-stat-card">
            <div className="osc-icon warning"><LineChart size={20} /></div>
            <div className="osc-details">
              <span className="osc-label">Completed Evaluations</span>
              <span className="osc-val">2,410 runs</span>
              <span className="osc-trend">Nursery to Grade 5</span>
            </div>
          </div>

          <div className="card owner-stat-card">
            <div className="osc-icon error"><CreditCard size={20} /></div>
            <div className="osc-details">
              <span className="osc-label">Cloud Billing Status</span>
              <span className="osc-val">$184.20 / mo</span>
              <span className="osc-trend">Auto-pay enabled</span>
            </div>
          </div>
        </div>

        {/* Lower Details Grid */}
        <div className="owner-main-grid">
          {/* School Branches list */}
          <div className="card branches-summary-card">
            <h3 className="card-title">Academy Branch Registries</h3>
            <div className="branches-list-table">
              <div className="branch-item-header">
                <span>School Name</span>
                <span>Roll Count</span>
                <span>Active Sync Status</span>
              </div>
              
              <div className="branch-item-row">
                <span className="b-name">🌳 Wisdom Tree - North Campus (Primary)</span>
                <span className="b-count">148 Pupils</span>
                <span className="b-status status-good">Synced (2 min ago)</span>
              </div>

              <div className="branch-item-row">
                <span className="b-name">🌳 Wisdom Tree - South Campus</span>
                <span className="b-count">240 Pupils</span>
                <span className="b-status status-good">Synced (1 hr ago)</span>
              </div>

              <div className="branch-item-row">
                <span className="b-name">🌳 Wisdom Tree - East Gate School</span>
                <span className="b-count">192 Pupils</span>
                <span className="b-status status-good">Synced (24 min ago)</span>
              </div>

              <div className="branch-item-row">
                <span className="b-name">🌳 Wisdom Tree - Valley View Academy</span>
                <span className="b-count">112 Pupils</span>
                <span className="b-status status-warning">Offline (SQLite Local Cache)</span>
              </div>

              <div className="branch-item-row">
                <span className="b-name">🌳 Wisdom Tree - Oakridge School</span>
                <span className="b-count">148 Pupils</span>
                <span className="b-status status-good">Synced (5 min ago)</span>
              </div>
            </div>
          </div>

          {/* Central notifications and cloud backup */}
          <div className="card cloud-backup-card">
            <h3 className="card-title">Cloud Infrastructure Status</h3>
            <div className="cloud-indicator-box">
              <div className="indicator-pulse-green"></div>
              <span className="cloud-indicator-text">All Central Servers fully Operational</span>
            </div>

            <div style={{ marginTop: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Central automated database backups run daily at 02:00 UTC. Redundant caches are replicated across multiple geographic regions to prevent loss.
              </p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Region Hosting</span>
                <strong>US-East (AWS S3 VFS)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Storage Invoiced</span>
                <strong>42.12 GB (Encrypted)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserShell>
  );
};

export default OwnerDashboard;
