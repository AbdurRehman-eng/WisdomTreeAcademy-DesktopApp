import React from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Database, RefreshCw, Radio, HardDrive, ShieldAlert, Sparkles } from 'lucide-react';

export const SyncSettings = () => {
  const {
    syncStatus,
    pendingSyncCount,
    triggerSync,
    toggleOnlineState,
    showToast
  } = useApp();

  const handleResetData = () => {
    showToast('Resetting mock database to defaults... Sync queue cleared.', 'success');
    window.location.reload();
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Local Database & Settings</h1>
          <p className="welcome-subtext">Configure local offline database caches, network sync triggers, and sound hardware preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* Offline Cache Card */}
        <div className="card flex flex-col gap-md">
          <div className="flex items-center gap-sm color-primary">
            <HardDrive size={20} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>SQLite Client Local Storage</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cache Engine</span>
              <strong>SQLite WASM (VFS Local)</strong>
            </div>
            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Database File Size</span>
              <strong>4.24 MB</strong>
            </div>
            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Last Backup Saved</span>
              <strong>Today, 8:44 AM</strong>
            </div>
            <div className="flex justify-between" style={{ paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Cached Records</span>
              <strong>418 Row Entries</strong>
            </div>
          </div>

          <div className="flex gap-sm" style={{ marginTop: 'auto' }}>
            <Button variant="secondary" onClick={() => showToast('Database backup saved to local downloads folder.', 'success')} style={{ flex: 1 }}>
              Backup DB
            </Button>
            <Button variant="secondary" onClick={handleResetData} style={{ flex: 1 }}>
              Reset DB
            </Button>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="card flex flex-col gap-md">
          <div className="flex items-center gap-sm color-accent">
            <Radio size={20} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>Cloud Synchronization Options</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Connection Status:</span>
              <button
                onClick={toggleOnlineState}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <Badge variant={syncStatus === 'offline' ? 'warning' : 'success'}>
                  {syncStatus === 'offline' ? 'Offline Mode' : 'Online Mode'}
                </Badge>
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Pending Changes queue:</span>
              <strong style={{ color: pendingSyncCount > 0 ? 'var(--color-accent)' : 'var(--text-primary)' }}>
                {pendingSyncCount} items
              </strong>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              When online, clicking sync will securely publish local attendance changes and scorecards up to the academy centralized server.
            </p>

            <Button
              variant="primary"
              onClick={triggerSync}
              disabled={syncStatus === 'syncing' || pendingSyncCount === 0}
              icon={RefreshCw}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {syncStatus === 'syncing' ? 'Syncing...' : 'Perform Database Synchronization'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSettings;
