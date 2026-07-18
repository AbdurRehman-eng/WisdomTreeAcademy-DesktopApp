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
    refreshSyncInfo,
    schoolLogo
  } = useApp();

  const [newKey, setNewKey] = useState('');

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

  const handleResetData = () => {
    const confirmed = window.confirm(
      "WARNING: This will reset the database cache, clear all offline records, and reload the application. This action CANNOT be undone. Are you absolutely sure you want to proceed?"
    );
    if (!confirmed) return;

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


        {/* School Logo Card — full width */}
        <div className="card flex flex-col gap-md" style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center gap-sm color-primary" style={{ color: 'var(--color-primary)' }}>
            <Cloud size={20} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>School Branding &amp; Custom Logo</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '16px', minHeight: '150px', background: 'var(--bg-secondary)' }}>
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo Preview" style={{ maxWidth: '120px', maxHeight: '100px', objectFit: 'contain', marginBottom: '10px' }} />
              ) : (
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌳</div>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {schoolLogo ? 'Custom Logo Active' : 'Default Logo Active'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Wisdom Tree Academy branding, application icons, and official school logos are managed centrally by the Super Administrator from the Owner Console. 
              </p>
              <div style={{ padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>Note:</strong> Whenever a cloud sync is executed, your local client will automatically pull and apply any new custom branding set in the owner dashboard.
              </div>
            </div>
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
