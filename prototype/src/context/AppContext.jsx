import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { name: 'Dr. Sarah Alon', role: 'admin' }
  const [activeScreen, setActiveScreen] = useState('login');
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'offline', 'syncing'
  const [syncProgress, setSyncProgress] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(7);
  const [toasts, setToasts] = useState([]);
  const [licenseKey, setLicenseKey] = useState('WTA-8924-NURS-G5-EXP2028');
  const [licenseActive, setLicenseActive] = useState(true);

  // Load user session from local storage on load
  useEffect(() => {
    const savedUser = localStorage.getItem('wta_user');
    const savedScreen = localStorage.getItem('wta_screen');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setActiveScreen(savedScreen || 'dashboard');
    }
  }, []);

  const login = (role, username) => {
    const userObj = {
      name: role === 'admin' ? 'Administrator' : 'Teacher Williams',
      role: role,
      email: role === 'admin' ? 'admin@wisdomtree.edu' : 'teacher.w@wisdomtree.edu'
    };
    setUser(userObj);
    localStorage.setItem('wta_user', JSON.stringify(userObj));
    setActiveScreen('dashboard');
    localStorage.setItem('wta_screen', 'dashboard');
    showToast(`Welcome back, ${userObj.name}!`, 'success');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wta_user');
    localStorage.removeItem('wta_screen');
    setActiveScreen('login');
    showToast('Logged out successfully.', 'info');
  };

  const setScreen = (screenName) => {
    setActiveScreen(screenName);
    localStorage.setItem('wta_screen', screenName);
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const triggerSync = () => {
    if (syncStatus === 'offline') {
      showToast('Cannot sync in offline mode. Please switch to online first.', 'warning');
      return;
    }
    if (syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    setSyncProgress(0);
    showToast('Database synchronization started...', 'info');

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncStatus('synced');
          setPendingSyncCount(0);
          showToast('Sync completed! Offline local database is fully up to date.', 'success');
          return 0;
        }
        return prev + 20;
      });
    }, 4000);
  };

  const toggleOnlineState = () => {
    setSyncStatus(prev => {
      if (prev === 'offline') {
        showToast('System is now Online. Cloud sync is active.', 'info');
        return 'synced';
      } else {
        showToast('System is now Offline. Working locally.', 'warning');
        return 'offline';
      }
    });
  };

  const addPendingSyncItem = (type, detail) => {
    setPendingSyncCount(prev => prev + 1);
  };

  return (
    <AppContext.Provider value={{
      user,
      activeScreen,
      setScreen,
      login,
      logout,
      syncStatus,
      setSyncStatus,
      syncProgress,
      pendingSyncCount,
      setPendingSyncCount,
      triggerSync,
      toggleOnlineState,
      toasts,
      showToast,
      licenseKey,
      setLicenseKey,
      licenseActive,
      setLicenseActive,
      addPendingSyncItem
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
