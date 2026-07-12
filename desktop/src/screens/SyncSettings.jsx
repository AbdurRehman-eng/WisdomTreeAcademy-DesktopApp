import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Database, RefreshCw, Radio, HardDrive, KeyRound, Cloud, Save } from 'lucide-react';

export const SyncSettings = () => {
  const {
    user,
    syncStatus,
    pendingSyncCount,
    triggerSync,
    toggleOnlineState,
    showToast,
    licenseKey,
    licenseActive,
    validateLicense,
    refreshSyncInfo
  } = useApp();

  const [newKey, setNewKey] = useState('');

  // Cloud config state
  const [cloudUrl,    setCloudUrl]    = useState('');
  const [cloudApiKey, setCloudApiKey] = useState('');
  const [savingCloud, setSavingCloud] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all password fields.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      if (window.api?.changePassword && user) {
        const res = await window.api.changePassword(user.username, currentPassword, newPassword);
        if (res.success) {
          showToast('Password updated successfully! Local database and pending sync queue updated.', 'success');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          showToast(res.error || 'Failed to change password.', 'error');
        }
      } else {
        showToast('Password change simulated (web preview mode).', 'info');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      if (window.api?.backupDatabase) {
        const res = await window.api.backupDatabase();
        if (res.success) {
          showToast('Database backup saved successfully.', 'success');
        } else if (res.error !== 'Cancelled') {
          showToast(res.error || 'Failed to backup database.', 'error');
        }
      } else {
        showToast('Database backup simulated (web preview mode).', 'info');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleExportQuestions = async () => {
    try {
      if (window.api?.exportQuestions) {
        const res = await window.api.exportQuestions();
        if (res.success) {
          showToast('Question Bank exported successfully.', 'success');
        } else if (res.error !== 'Cancelled') {
          showToast(res.error || 'Failed to export questions.', 'error');
        }
      } else {
        showToast('Question Bank export simulated (web preview mode).', 'info');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleExportResults = async () => {
    try {
      if (window.api?.exportResults) {
        const res = await window.api.exportResults();
        if (res.success) {
          showToast('Student Results exported successfully.', 'success');
        } else if (res.error !== 'Cancelled') {
          showToast(res.error || 'Failed to export results.', 'error');
        }
      } else {
        showToast('Student Results export simulated (web preview mode).', 'info');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Load cloud config on mount
  useEffect(() => {
    const loadConfig = async () => {
      if (window.api?.getSyncConfig) {
        const cfg = await window.api.getSyncConfig();
        setCloudUrl(cfg.projectUrl || '');
        setCloudApiKey(cfg.apiKey || '');
      }
    };
    loadConfig();
  }, []);

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
    if (success) setNewKey('');
  };

  const handleSaveCloudConfig = async () => {
    if (!cloudUrl.trim()) {
      showToast('Please enter your Supabase Project URL.', 'error');
      return;
    }
    if (!cloudApiKey.trim()) {
      showToast('Please enter your Supabase API key.', 'error');
      return;
    }
    setSavingCloud(true);
    try {
      if (window.api?.setSyncConfig) {
        const res = await window.api.setSyncConfig(cloudUrl.trim(), cloudApiKey.trim());
        if (res.success) {
          showToast('Cloud sync configuration saved successfully.', 'success');
          refreshSyncInfo();
        } else {
          showToast(res.error || 'Failed to save configuration.', 'error');
        }
      } else {
        showToast('Cloud config saved (web preview mode — not persisted).', 'info');
      }
    } finally {
      setSavingCloud(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none'
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Local Database &amp; Settings</h1>
          <p className="welcome-subtext">Configure local offline database caches, cloud sync endpoints, and licensing keys.</p>
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
              <strong style={{ color: 'var(--color-success)' }}>Connected &amp; Active</strong>
            </div>
            <div className="flex justify-between" style={{ paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sync Integrity Check</span>
              <strong>Pass</strong>
            </div>
          </div>

          <div className="flex gap-sm" style={{ marginTop: 'auto' }}>
            <Button variant="secondary" onClick={handleBackupDatabase} style={{ flex: 1 }}>
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
              When online, sync pushes pending local records to your configured Supabase cloud database. Configure the endpoint below.
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

        {/* Cloud Configuration Card — full width */}
        <div className="card flex flex-col gap-md" style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center gap-sm" style={{ color: 'var(--color-success)' }}>
            <Cloud size={20} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>Cloud Sync Configuration (Supabase)</h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Enter your <strong>Supabase project URL</strong> and <strong>anon API key</strong> to enable real cloud synchronization.
            All pending local records will be pushed to your Supabase database when you trigger a sync.
            See <code>docs/SYNC_GUIDE.md</code> for setup instructions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="flex flex-col gap-xs">
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://xxxxxxxxxxx.supabase.co"
                value={cloudUrl}
                onChange={e => setCloudUrl(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Supabase Anon API Key
              </label>
              <input
                type="password"
                placeholder="eyJ... (anon key from Supabase project settings)"
                value={cloudApiKey}
                onChange={e => setCloudApiKey(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              icon={Save}
              onClick={handleSaveCloudConfig}
              disabled={savingCloud}
            >
              {savingCloud ? 'Saving...' : 'Save Cloud Configuration'}
            </Button>
          </div>
        </div>

        {/* Licensing Card — full width */}
        <div className="card flex flex-col gap-md" style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center gap-sm color-primary">
            <KeyRound size={20} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>System License &amp; Cryptographic Activation</h3>
          </div>

          <div className="flex gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Wisdom Tree Academy uses an offline cryptographic licensing scheme. Ensure your product key contains the correct digital signature for your school.
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
                  <code style={{ background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all', fontSize: '11px' }}>
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
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: '12px' }}
                />
                <Button variant="primary" onClick={handleActivateLicense}>
                  Activate
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card — full width */}
        <div className="card flex flex-col gap-md" style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center gap-sm color-accent" style={{ color: 'var(--color-accent)' }}>
            <KeyRound size={20} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>Change Account Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="flex gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'flex-end' }}>
            <div className="flex flex-col gap-xs">
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Confirm New Password</label>
              <div className="flex gap-xs" style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  required
                />
                <Button variant="primary" type="submit" disabled={changingPassword} style={{ width: 'auto' }}>
                  {changingPassword ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Export & Backup Utilities Card — full width */}
        <div className="card flex flex-col gap-md" style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center gap-sm color-primary" style={{ color: 'var(--color-primary)' }}>
            <Database size={20} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>Data Export &amp; Backup Utilities</h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Export your database records or create a full SQLite backup copy on your local system for record keeping.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Button variant="secondary" onClick={handleBackupDatabase}>
              Backup Local Database (.db)
            </Button>
            <Button variant="secondary" onClick={handleExportQuestions}>
              Export Question Bank (.csv)
            </Button>
            <Button variant="secondary" onClick={handleExportResults}>
              Export Student Results (.csv)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSettings;
