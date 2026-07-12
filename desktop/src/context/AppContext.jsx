import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeScreen, setActiveScreen] = useState('login');
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'offline', 'syncing'
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseActive, setLicenseActive] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState(null);

  // Load user session from local storage on load
  useEffect(() => {
    const savedUser = localStorage.getItem('wta_user');
    const savedScreen = localStorage.getItem('wta_screen');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setActiveScreen(savedScreen || 'dashboard');
    }
    
    // Load license and sync states
    refreshLicenseInfo();
    refreshSyncInfo();
  }, []);

  const refreshLicenseInfo = async () => {
    if (window.api) {
      const info = await window.api.getLicenseInfo();
      setLicenseKey(info.key || '');
      setLicenseActive(info.active || false);
    }
  };

  const refreshSyncInfo = async () => {
    if (window.api) {
      const info = await window.api.getSyncInfo();
      setPendingSyncCount(info.pendingCount);
      setSyncStatus(info.status);
    }
  };

  const login = async (username, password) => {
    if (!window.api) {
      // Web browser preview mock fallback
      const mockUser = {
        id: username === 'admin' ? 'A1' : 'T1',
        username: username,
        role: username === 'admin' ? 'admin' : 'teacher',
        name: username === 'admin' ? 'System Administrator' : 'Teacher Williams',
        email: username === 'admin' ? 'admin@wisdomtree.edu' : 'teacher@wisdomtree.edu'
      };
      setUser(mockUser);
      localStorage.setItem('wta_user', JSON.stringify(mockUser));
      setActiveScreen('dashboard');
      localStorage.setItem('wta_screen', 'dashboard');
      showToast(`Welcome back, ${mockUser.name}! (Web Preview Mode)`, 'success');
      return true;
    }
    const res = await window.api.login(username, password);
    if (res.success) {
      setUser(res.user);
      localStorage.setItem('wta_user', JSON.stringify(res.user));
      setActiveScreen('dashboard');
      localStorage.setItem('wta_screen', 'dashboard');
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      refreshSyncInfo();
      return true;
    } else {
      showToast(res.error || 'Login failed.', 'error');
      return false;
    }
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

  const triggerSync = async () => {
    if (syncStatus === 'offline') {
      showToast('Cannot sync in offline mode. Please switch to online first.', 'warning');
      return;
    }
    if (syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    showToast('Database synchronization started...', 'info');

    if (window.api) {
      const res = await window.api.triggerSync();
      if (res.success) {
        showToast('Sync completed! Offline database is fully up to date.', 'success');
      } else {
        showToast(res.error || 'Sync failed.', 'error');
      }
      refreshSyncInfo();
    }
  };

  const toggleOnlineState = async () => {
    if (window.api) {
      const res = await window.api.toggleOnline();
      if (res.success) {
        setSyncStatus(res.status);
        showToast(
          res.status === 'offline' 
            ? 'System is now Offline. Working locally.' 
            : 'System is now Online. Cloud sync is active.',
          res.status === 'offline' ? 'warning' : 'info'
        );
      }
    }
  };

  const validateLicense = async (key) => {
    if (window.api) {
      const res = await window.api.validateLicense(key);
      if (res.success) {
        setLicenseKey(key);
        setLicenseActive(true);
        showToast('License key activated successfully!', 'success');
        refreshLicenseInfo();
        return true;
      } else {
        showToast(res.error || 'Invalid license key.', 'error');
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    const handleOnline = () => {
      showToast('Internet connection restored. Synchronizing data...', 'success');
      if (syncStatus !== 'offline') {
        triggerSync();
      }
    };

    const handleOffline = () => {
      showToast('Internet connection lost. Working in offline mode.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-sync on mount if online
    let timer;
    if (navigator.onLine && syncStatus !== 'offline') {
      timer = setTimeout(() => {
        triggerSync();
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus]);

  return (
    <AppContext.Provider value={{
      user,
      activeScreen,
      setScreen,
      login,
      logout,
      syncStatus,
      setSyncStatus,
      pendingSyncCount,
      refreshSyncInfo,
      triggerSync,
      toggleOnlineState,
      toasts,
      showToast,
      licenseKey,
      licenseActive,
      validateLicense,
      refreshLicenseInfo,
      activeAssessment,
      setActiveAssessment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
