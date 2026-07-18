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
  'sync-settings': ['owner', 'admin', 'it_administrator']
};

function MainAppContent() {
  const { user, activeScreen, syncConflicts, setSyncConflicts, triggerSync, showToast } = useApp();

  const handleOverwrite = async () => {
    if (confirm('Are you absolutely sure you want to force sync and overwrite the cloud database versions for these records?')) {
      setSyncConflicts([]);
      await triggerSync({ force: true });
    }
  };

  const handleKeepCloud = () => {
    setSyncConflicts([]);
    showToast('Sync cancelled. Keeping cloud versions.', 'info');
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <DesktopShell>
      {renderScreen()}
      {syncConflicts && syncConflicts.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-primary, #ffffff)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', width: '90%', maxWidth: '550px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              ⚠️ Cloud Sync Conflict Detected
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
              The following local records have differences compared to the cloud version. Pushing your changes will overwrite the cloud database.
            </p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', marginBottom: '20px', background: 'var(--bg-secondary)' }}>
              {syncConflicts.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < syncConflicts.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '13px' }}>
                  <span style={{ fontWeight: '600' }}>{c.table.toUpperCase()} - {c.displayName}</span>
                  <span style={{ opacity: 0.6 }}>Conflict</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleKeepCloud}
                style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                Keep Cloud Versions
              </button>
              <button
                onClick={handleOverwrite}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: 'var(--danger-color, #ef4444)', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                Overwrite Cloud
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
