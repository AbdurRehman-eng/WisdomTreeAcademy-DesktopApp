import React, { createContext, useState, useEffect, useContext, useRef } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeScreen, setActiveScreen] = useState('login');
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'offline', 'syncing'
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [syncConflicts, setSyncConflicts] = useState([]);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseActive, setLicenseActive] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [isPhysicalOffline, setIsPhysicalOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [schoolLogo, setSchoolLogo] = useState(null);

  const syncStatusRef = useRef(syncStatus);
  useEffect(() => {
    syncStatusRef.current = syncStatus;
  }, [syncStatus]);

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
    loadSchoolLogo();
  }, []);

  const loadSchoolLogo = async () => {
    if (window.api) {
      const logo = await window.api.getSchoolLogo();
      setSchoolLogo(logo);
    }
  };

  const updateSchoolLogo = async (base64) => {
    if (window.api) {
      const res = await window.api.saveSchoolLogo(base64);
      if (res.success) {
        setSchoolLogo(base64);
        showToast('School logo updated successfully!', 'success');
        return true;
      } else {
        showToast(res.error || 'Failed to save logo.', 'error');
        return false;
      }
    }
    return false;
  };

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
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerSync = async (options = {}) => {
    if (isPhysicalOffline || syncStatus === 'offline') {
      showToast('Cannot sync in offline mode. Please switch to online first.', 'warning');
      return;
    }
    if (syncStatus === 'syncing') return;

    // Sanitize options to avoid passing React SyntheticEvent objects through the IPC bridge
    let cleanOptions = {};
    if (options && typeof options === 'object' && !options.nativeEvent) {
      if (options.force !== undefined) cleanOptions.force = options.force;
      if (options.overwriteCloud !== undefined) cleanOptions.overwriteCloud = options.overwriteCloud;
      if (options.keepCloud !== undefined) cleanOptions.keepCloud = options.keepCloud;
    }

    setSyncStatus('syncing');
    showToast('Database synchronization started...', 'info');

    if (window.api) {
      const res = await window.api.triggerSync(cleanOptions);
      if (res.success) {
        showToast('Sync completed! Offline database is fully up to date.', 'success');
        setSyncConflicts([]);
        loadSchoolLogo();
      } else if (res.hasConflicts) {
        showToast('Sync paused. Conflicts detected between local and cloud databases.', 'warning');
        setSyncConflicts(res.conflicts);
      } else {
        showToast(res.error || 'Sync failed.', 'error');
      }
      refreshSyncInfo();
    }
  };

  const toggleOnlineState = async () => {
    if (isPhysicalOffline) {
      showToast('Cannot go online. No internet connection detected.', 'warning');
      return;
    }
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
      setIsPhysicalOffline(false);
      showToast('Internet connection restored. Synchronizing data...', 'success');
      if (syncStatusRef.current !== 'offline') {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsPhysicalOffline(true);
      showToast('Internet connection lost. Working in offline mode.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-sync on mount if online
    let timer;
    if (navigator.onLine && syncStatusRef.current !== 'offline') {
      timer = setTimeout(() => {
        triggerSync();
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const effectiveSyncStatus = isPhysicalOffline ? 'offline' : syncStatus;

  return (
    <AppContext.Provider value={{
      user,
      activeScreen,
      setScreen,
      login,
      logout,
      syncStatus: effectiveSyncStatus,
      setSyncStatus,
      pendingSyncCount,
      refreshSyncInfo,
      triggerSync,
      toggleOnlineState,
      toasts,
      showToast,
      removeToast,
      syncConflicts,
      setSyncConflicts,
      licenseKey,
      licenseActive,
      validateLicense,
      refreshLicenseInfo,
      activeAssessment,
      setActiveAssessment,
      schoolLogo,
      updateSchoolLogo
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
