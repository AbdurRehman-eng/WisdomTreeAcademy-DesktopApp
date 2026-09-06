import React from 'react';
import './App.css';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import DesktopShell from './components/layout/DesktopShell';

// Import Screens
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Students from './screens/Students';
import TeachersAdmins from './screens/TeachersAdmins';
import ClassesSubjects from './screens/ClassesSubjects';
import QuestionBank from './screens/QuestionBank';
import AssessmentSetup from './screens/AssessmentSetup';
import AssessmentRunner from './screens/AssessmentRunner';
import AssessmentResults from './screens/AssessmentResults';
import Attendance from './screens/Attendance';
import Reports from './screens/Reports';
import SyncSettings from './screens/SyncSettings';
import TuitionFees from './screens/TuitionFees';

const screenRoles = {
  'dashboard': ['owner', 'admin', 'it_administrator', 'head_teacher', 'accountant', 'secretary', 'teacher'],
  'students': ['owner', 'admin', 'head_teacher', 'secretary', 'teacher'],
  'teachers-admins': ['owner', 'admin', 'it_administrator', 'head_teacher'],
  'classes-subjects': ['owner', 'admin', 'it_administrator', 'head_teacher'],
  'question-bank': ['owner', 'admin', 'head_teacher', 'teacher'],
  'assessment-setup': ['owner', 'admin', 'head_teacher', 'teacher'],
  'assessment-runner': ['owner', 'admin', 'head_teacher', 'teacher'],
  'assessment-results': ['owner', 'admin', 'head_teacher', 'teacher'],
  'attendance': ['owner', 'admin', 'head_teacher', 'secretary', 'teacher'],
  'reports': ['owner', 'admin', 'head_teacher', 'accountant', 'secretary', 'teacher'],
  'sync-settings': ['owner', 'admin', 'it_administrator'],
  'tuition-fees': ['owner', 'admin', 'accountant', 'secretary']
};

function MainAppContent() {
  const { user, activeScreen, syncConflicts, setSyncConflicts, triggerSync, showToast, refreshSyncInfo, setSyncStatus } = useApp();

  // Resolve all conflicts keeping LOCAL versions (push local → cloud).
  // Marks each conflicting row as 'pending' then force-pushes.
  const handleOverwriteCloud = async () => {
    if (!window.confirm('Are you sure you want to overwrite the cloud versions with your local data? Your local changes will be pushed to the cloud.')) return;
    showToast('Sending local data to cloud...', 'info');
    const conflictsToResolve = syncConflicts.map(c => ({ ...c, direction: 'keep_local' }));
    setSyncConflicts([]);
    setSyncStatus('syncing');

    if (window.api) {
      const res = await window.api.resolveConflicts(conflictsToResolve);
      if (res.success) {
        showToast('Local data pushed to cloud. Sync complete!', 'success');
      } else if (res.hasConflicts) {
        showToast('Additional conflicts detected.', 'warning');
        setSyncConflicts(res.conflicts);
      } else {
        showToast(res.error || 'Failed to push local data.', 'error');
      }
      if (res.pendingCount !== undefined) {
        await refreshSyncInfo(res.pendingCount);
      } else {
        await refreshSyncInfo();
      }
    }
  };

  // Resolve all conflicts keeping CLOUD versions (discard local, accept cloud).
  const handleKeepCloud = async () => {
    showToast('Accepting cloud versions and completing sync...', 'info');
    const conflictsToResolve = syncConflicts.map(c => ({ ...c, direction: 'keep_cloud' }));
    setSyncConflicts([]);
    setSyncStatus('syncing');

    if (window.api) {
      const res = await window.api.resolveConflicts(conflictsToResolve);
      if (res.success) {
        showToast('Cloud versions accepted. Sync complete!', 'success');
      } else if (res.hasConflicts) {
        showToast('Remaining conflicts detected.', 'warning');
        setSyncConflicts(res.conflicts);
      } else {
        showToast(res.error || 'Failed to complete synchronization.', 'error');
      }
      if (res.pendingCount !== undefined) {
        await refreshSyncInfo(res.pendingCount);
      } else {
        await refreshSyncInfo();
      }
      setTimeout(refreshSyncInfo, 500);
    }
  };

  // If no user is logged in, show the Login screen
  if (!user) {
    return <Login />;
  }

  // State-based Screen Router
  const renderScreen = () => {
    const allowedRoles = screenRoles[activeScreen] || ['admin', 'teacher'];
    if (!allowedRoles.includes(user.role)) {
      return <Dashboard />;
    }

    switch (activeScreen) {
      case 'login':
        return <Login />;
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students />;
      case 'teachers-admins':
        return <TeachersAdmins />;
      case 'classes-subjects':
        return <ClassesSubjects />;
      case 'question-bank':
        return <QuestionBank />;
      case 'assessment-setup':
        return <AssessmentSetup />;
      case 'assessment-runner':
        return <AssessmentRunner />;
      case 'assessment-results':
        return <AssessmentResults />;
      case 'attendance':
        return <Attendance />;
      case 'reports':
        return <Reports />;
      case 'sync-settings':
        return <SyncSettings />;
      case 'tuition-fees':
        return <TuitionFees />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DesktopShell>
      {renderScreen()}
      {syncConflicts && syncConflicts.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '28px', borderRadius: '12px', border: '1px solid var(--border-color)', width: '90%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              ⚠️ Cloud Sync Conflict Detected
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
              The following records differ between your local database and the cloud. Choose how to resolve each conflict, then click a button below to apply your decision to <strong>all</strong> conflicts at once.
            </p>

            {/* Conflict list */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '20px', background: 'var(--bg-secondary)' }}>
              {syncConflicts.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: idx < syncConflicts.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{c.table.replace(/_/g, ' ').toUpperCase()}</span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>{c.displayName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.7 }}>
                      Local: {c.localUpdatedAt ? new Date(Number(c.localUpdatedAt)).toLocaleTimeString() : '—'}
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontWeight: '600' }}>
                      CONFLICT
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Explanation boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', fontSize: '12px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.25)' }}>
                <strong style={{ color: '#4f46e5' }}>📤 Overwrite Cloud</strong>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Push your local edits to the cloud. Use this when your local changes are the correct version.</p>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <strong style={{ color: '#059669' }}>☁️ Keep Cloud Versions</strong>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Discard local changes and accept the cloud version. Use this when the cloud has the correct data.</p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleKeepCloud}
                style={{ padding: '9px 18px', border: '1px solid #059669', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#059669', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                ☁️ Keep Cloud Versions
              </button>
              <button
                onClick={handleOverwriteCloud}
                style={{ padding: '9px 18px', border: 'none', borderRadius: '6px', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                📤 Overwrite Cloud
              </button>
            </div>
          </div>
        </div>
      )}
    </DesktopShell>
  );
}


function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
