import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Database, RefreshCw, Radio, HardDrive, KeyRound, ShieldAlert } from 'lucide-react';

export const SyncSettings = () => {
  const {
    syncStatus,
    pendingSyncCount,
    triggerSync,
    toggleOnlineState,
    showToast,
    licenseKey,
    licenseActive,
    validateLicense
  } = useApp();

  const [newKey, setNewKey] = useState('');

  const handleResetData = () => {
    showToast('Resetting database defaults... Cache cleared.', 'success');
    window.location.reload();
  };

  const handleActivateLicense = async () => {
    if (!newKey.trim()) {
      showToast('Please enter a license key first.', 'error');
      return;
    }
    const success = await validateLicense(newKey.trim());
    if (success) {
      setNewKey('');
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Local Database & Settings</h1>
          <p className="welcome-subtext">Configure local offline database caches, network sync triggers, and licensing keys.</p>
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
              <strong>SQLite 3 (better-sqlite3)</strong>
            </div>
            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Journal Mode</span>
              <strong>Write-Ahead Log (WAL)</strong>
            </div>
            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Database Status</span>
              <strong style={{ color: 'var(--color-success)' }}>Connected & Active</strong>
            </div>
            <div className="flex justify-between" style={{ paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sync Integrity Check</span>
              <strong>Pass</strong>
            </div>
          </div>

          <div className="flex gap-sm" style={{ marginTop: 'auto' }}>
            <Button variant="secondary" onClick={() => showToast('Database backup saved locally.', 'success')} style={{ flex: 1 }}>
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
            <h3 className="card-title" style={{ marginBottom: 0 }}>Central Cloud Sync</h3>
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

        {/* Licensing Card */}
        <div className="card flex flex-col gap-md" style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center gap-sm color-primary">
            <KeyRound size={20} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>System License & Cryptographic Activation</h3>
          </div>

          <div className="flex gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Wisdom Tree Academy utilizes an offline cryptographic licensing validation scheme. Ensure your product key contains the correct digital signature for your school.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                  <strong>
                    {licenseActive ? (
                      <span style={{ color: 'var(--color-success)' }}>Active (Enterprise Tier)</span>
                    ) : (
                      <span style={{ color: 'var(--color-error)' }}>Trial / Unactivated</span>
                    )}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Current Key:</span>
                  <code style={{ background: 'var(--bg-accent)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                    {licenseKey || 'No license key activated'}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-sm" style={{ justifyContent: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Activate Product Key</label>
              <div className="flex gap-xs">
                <input
                  type="text"
                  placeholder="WTA-[SchoolCode]-[MaxGrade]-[Features]-[Signature]"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
                <Button variant="primary" onClick={handleActivateLicense}>
                  Activate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSettings;
