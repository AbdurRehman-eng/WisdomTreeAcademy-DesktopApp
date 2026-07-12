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
  'dashboard': ['admin', 'teacher'],
  'students': ['admin', 'teacher'],
  'teachers-admins': ['admin'],
  'classes-subjects': ['admin'],
  'question-bank': ['admin', 'teacher'],
  'assessment-setup': ['admin', 'teacher'],
  'assessment-runner': ['admin', 'teacher'],
  'assessment-results': ['admin', 'teacher'],
  'attendance': ['admin', 'teacher'],
  'reports': ['admin'],
  'sync-settings': ['admin']
};

function MainAppContent() {
  const { user, activeScreen } = useApp();

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
