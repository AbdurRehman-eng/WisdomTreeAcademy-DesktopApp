import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Users,
  Award,
  Calendar,
  Grid,
  BookOpen,
  UserCheck,
  TrendingUp,
  Moon,
  Sun,
  Eye,
  LogOut,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Key,
  Settings,
  FileText,
  Lock,
  Database
} from 'lucide-react';

async function hashPasswordBrowser(password) {
  const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = encoder.encode(salt);

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 1000,
      hash: 'SHA-512'
    },
    baseKey,
    512
  );

  const hash = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${salt}:${hash}`;
}

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('owner-authenticated') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Modals for Student & Staff Creation State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentRollNumber, setStudentRollNumber] = useState('');
  const [studentClass, setStudentClass] = useState('Nursery');
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('teacher');
  const [staffPassword, setStaffPassword] = useState('');
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // Activity Logs search / filter state
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('All');

  // Staff Password Reset Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [confirmStaffPassword, setConfirmStaffPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleOpenResetPassword = (staff) => {
    setSelectedStaff(staff);
    setNewStaffPassword('');
    setConfirmStaffPassword('');
    setShowPasswordModal(true);
  };

  const handleSaveStaffPassword = async (e) => {
    e.preventDefault();
    if (!newStaffPassword || !confirmStaffPassword) {
      alert('Please fill in both fields.');
      return;
    }
    if (newStaffPassword !== confirmStaffPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (newStaffPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setResettingPassword(true);
    try {
      const passwordHash = await hashPasswordBrowser(newStaffPassword);
      const client = createClient(supabaseUrl, supabaseKey);
      const { error } = await client
        .from('teachers_admins')
        .update({
          password_hash: passwordHash,
          sync_status: 'synced',
          updated_at: Date.now()
        })
        .eq('id', selectedStaff.id);

      if (error) throw error;

      alert(`Password for ${selectedStaff.name} updated successfully.`);
      setShowPasswordModal(false);
      loadDashboardData(client);
    } catch (err) {
      console.error(err);
      alert('Failed to reset password: ' + err.message);
    } finally {
      setResettingPassword(false);
    }
  };
  // Theme state
  const [darkTheme, setDarkTheme] = useState(() => {
    return localStorage.getItem('owner-theme') === 'dark';
  });

  // Question CRUD Modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qClass, setQClass] = useState('Nursery');
  const [qSubject, setQSubject] = useState('Mathematics');
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('A');
  const [qAudioText, setQAudioText] = useState('');
  const [qImagePath, setQImagePath] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Supabase Connection Settings
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return localStorage.getItem('supabase-url') || import.meta.env.VITE_SUPABASE_URL || '';
  });
  const [supabaseKey, setSupabaseKey] = useState(() => {
    return localStorage.getItem('supabase-anon-key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Active Screen
  const [activeTab, setActiveTab] = useState('overview');

  // Loaded Data
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search/Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');

  // Selected Assessment for Modal Details View
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Licensing Tool State
  const [licSchoolCode, setLicSchoolCode] = useState('');
  const [licMaxGrade, setLicMaxGrade] = useState('G5');
  const [licFeatures, setLicFeatures] = useState('FULL');
  const [generatedKey, setGeneratedKey] = useState('');

  const handleGenerateLicenseKey = async () => {
    if (!licSchoolCode.trim()) {
      alert('Please enter a School Branch Code.');
      return;
    }
    
    const schoolCode = licSchoolCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!schoolCode) {
      alert('School Code must contain alphanumeric characters.');
      return;
    }

    const SECRET_PEPPER = 'WisdomTreeAcademySalt2026';
    const msg = `${schoolCode}-${licMaxGrade}-${licFeatures}-${SECRET_PEPPER}`;
    
    try {
      const msgBuffer = new TextEncoder().encode(msg);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const signature = hashHex.substring(0, 8).toUpperCase();
      
      const key = `WTA-${schoolCode}-${licMaxGrade}-${licFeatures}-${signature}`;
      setGeneratedKey(key);
    } catch (err) {
      console.error(err);
      alert('Error generating license signature.');
    }
  };

  // Apply dark class on theme change
  useEffect(() => {
    const root = document.documentElement;
    if (darkTheme) {
      root.classList.add('dark-theme');
      localStorage.setItem('owner-theme', 'dark');
    } else {
      root.classList.remove('dark-theme');
      localStorage.setItem('owner-theme', 'light');
    }
  }, [darkTheme]);

  // Temp inputs for database settings page to avoid mutating active connection state prematurely
  const [tempSupabaseUrl, setTempSupabaseUrl] = useState(supabaseUrl);
  const [tempSupabaseKey, setTempSupabaseKey] = useState(supabaseKey);

  // Sync temp inputs when the main credentials change
  useEffect(() => {
    setTempSupabaseUrl(supabaseUrl);
    setTempSupabaseKey(supabaseKey);
  }, [supabaseUrl, supabaseKey]);

  // Redirect to Settings tab if not connected
  useEffect(() => {
    if (!isConnected && activeTab !== 'settings' && activeTab !== 'licensing') {
      setActiveTab('settings');
    }
  }, [isConnected, activeTab]);

  // Attempt connection on mount if keys are saved
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      handleConnect(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (isAuto = false, customUrl = null, customKey = null) => {
    const targetUrl = customUrl || supabaseUrl;
    const targetKey = customKey || supabaseKey;

    if (!targetUrl || !targetKey) {
      if (!isAuto) setConnectionError('Both Supabase URL and Anon Key are required.');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');
    try {
      const client = createClient(targetUrl, targetKey);
      
      // Test the connection by doing a simple query on the students table.
      const { error } = await client.from('students').select('*').limit(1);

      if (error) {
        throw new Error(error.message);
      }

      // Connection success
      localStorage.setItem('supabase-url', targetUrl);
      localStorage.setItem('supabase-anon-key', targetKey);
      setSupabaseUrl(targetUrl);
      setSupabaseKey(targetKey);
      setIsConnected(true);
      
      // Load all data
      loadDashboardData(client);
    } catch (err) {
      setConnectionError(err.message || 'Could not establish connection to Supabase.');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = (skipWarning = false) => {
    if (skipWarning || window.confirm("Warning: You are about to disconnect from the database. All loaded data will be cleared until you reconnect. Do you want to proceed?")) {
      setIsConnected(false);
      localStorage.removeItem('supabase-url');
      localStorage.removeItem('supabase-anon-key');
      setStudents([]);
      setTeachers([]);
      setAssessments([]);
      setAttendance([]);
      setQuestions([]);
    }
  };

  const handleSaveConnectionKeys = async (e) => {
    e.preventDefault();
    if (!tempSupabaseUrl.trim() || !tempSupabaseKey.trim()) {
      alert('Both Supabase URL and Anon Key are required.');
      return;
    }

    if (isConnected) {
      const ok = window.confirm("Warning: Changing the Supabase credentials will disconnect the current session and try connecting to the new URL. Do you want to proceed?");
      if (!ok) return;
    }

    await handleConnect(false, tempSupabaseUrl.trim(), tempSupabaseKey.trim());
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of this admin session?")) {
      setIsAuthenticated(false);
      sessionStorage.removeItem('owner-authenticated');
    }
  };

  const loadDashboardData = async (clientInstance) => {
    const client = clientInstance || createClient(supabaseUrl, supabaseKey);
    setLoadingData(true);
    try {
      // Fetch all tables
      const [resStudents, resTeachers, resAssessments, resAttendance, resQuestions] = await Promise.all([
        client.from('students').select('*').order('name', { ascending: true }),
        client.from('teachers_admins').select('*').order('name', { ascending: true }),
        client.from('assessments').select('*').order('updated_at', { ascending: false }),
        client.from('attendance').select('*').order('date', { ascending: false }),
        client.from('question_bank').select('*')
      ]);

      if (resStudents.data) setStudents(resStudents.data);
      if (resTeachers.data) setTeachers(resTeachers.data);
      if (resAssessments.data) setAssessments(resAssessments.data);
      if (resAttendance.data) setAttendance(resAttendance.data);
      if (resQuestions.data) setQuestions(resQuestions.data);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQClass('Nursery');
    setQSubject('Mathematics');
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect('A');
    setQAudioText('');
    setQImagePath('');
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setQClass(q.class);
    setQSubject(q.subject);
    setQText(q.text);
    
    let opts = [];
    try {
      opts = JSON.parse(q.options_json || '[]');
    } catch (e) {
      opts = [];
    }
    setQOptA(opts[0] || '');
    setQOptB(opts[1] || '');
    setQOptC(opts[2] || '');
    setQOptD(opts[3] || '');
    
    setQCorrect(q.correct_answer || 'A');
    setQAudioText(q.audio_text || '');
    setQImagePath(q.image_path || '');
    setShowQuestionModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentRollNumber.trim()) {
      alert('Please fill in student name and roll number.');
      return;
    }
    const isDuplicate = students.some(s => s.roll_number?.toLowerCase() === studentRollNumber.trim().toLowerCase() && s.status === 'active');
    if (isDuplicate) {
      alert(`A student with Roll Number "${studentRollNumber.trim()}" already exists.`);
      return;
    }

    setIsSavingStudent(true);
    const client = createClient(supabaseUrl, supabaseKey);
    const newStudent = {
      id: window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now(),
      name: studentName.trim(),
      roll_number: studentRollNumber.trim(),
      class: studentClass,
      status: 'active',
      updated_at: Date.now()
    };

    try {
      const { error } = await client
        .from('students')
        .insert(newStudent);
      if (error) throw error;

      alert(`Student ${studentName.trim()} registered successfully.`);
      setShowAddStudentModal(false);
      loadDashboardData(client);
    } catch (err) {
      alert('Error registering student: ' + err.message);
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffName.trim() || !staffUsername.trim() || !staffPassword.trim()) {
      alert('Please fill in name, username, and password.');
      return;
    }
    if (staffPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    const isDuplicate = teachers.some(t => t.username?.toLowerCase() === staffUsername.trim().toLowerCase() && t.status === 'active');
    if (isDuplicate) {
      alert(`Staff username "${staffUsername.trim()}" is already registered.`);
      return;
    }

    setIsSavingStaff(true);
    try {
      const passwordHash = await hashPasswordBrowser(staffPassword);
      const client = createClient(supabaseUrl, supabaseKey);
      const newStaff = {
        id: window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now(),
        username: staffUsername.trim().toLowerCase(),
        password_hash: passwordHash,
        role: staffRole,
        name: staffName.trim(),
        email: staffEmail.trim() || null,
        status: 'active',
        updated_at: Date.now()
      };

      const { error } = await client
        .from('teachers_admins')
        .insert(newStaff);
      if (error) throw error;

      alert(`Staff account for ${staffName.trim()} registered successfully.`);
      setShowAddStaffModal(false);
      loadDashboardData(client);
    } catch (err) {
      alert('Error registering staff: ' + err.message);
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!qText.trim() || !qOptA.trim() || !qOptB.trim()) {
      alert('Question text and at least Options A and B are required.');
      return;
    }

    setIsSavingQuestion(true);
    const client = createClient(supabaseUrl, supabaseKey);

    const optionsList = [qOptA.trim(), qOptB.trim()];
    if (qOptC.trim()) optionsList.push(qOptC.trim());
    if (qOptD.trim()) optionsList.push(qOptD.trim());

    const questionData = {
      class: qClass,
      subject: qSubject,
      text: qText.trim(),
      options_json: JSON.stringify(optionsList),
      correct_answer: qCorrect,
      audio_text: qAudioText.trim() || null,
      image_path: qImagePath || null,
      updated_at: Date.now()
    };

    try {
      if (editingQuestion) {
        // Update
        const { error } = await client
          .from('question_bank')
          .update(questionData)
          .eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        // Insert
        const newId = 'Q' + Math.floor(Math.random() * 1000000);
        const { error } = await client
          .from('question_bank')
          .insert({ id: newId, ...questionData });
        if (error) throw error;
      }

      setShowQuestionModal(false);
      loadDashboardData(client);
    } catch (err) {
      alert('Error saving question: ' + err.message);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    const client = createClient(supabaseUrl, supabaseKey);
    try {
      const { error } = await client
        .from('question_bank')
        .delete()
        .eq('id', qId);
      if (error) throw error;
      
      loadDashboardData(client);
    } catch (err) {
      alert('Error deleting question: ' + err.message);
    }
  };

  // Helper Stats Calculation
  const totalStudents = students.length;
  const totalAssessments = assessments.length;
  const totalQuestions = questions.length;
  const totalTeachers = teachers.filter(t => t.role === 'teacher').length;

  const schoolAverage = (() => {
    if (assessments.length === 0) return 0;
    const sum = assessments.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0);
    return Math.round(sum / assessments.length);
  })();

  const attendanceRate = (() => {
    const studentAttendance = attendance.filter(a => a.type === 'student');
    if (studentAttendance.length === 0) return 'N/A';
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const late = studentAttendance.filter(a => a.status === 'late').length;
    const total = studentAttendance.length;
    return `${Math.round(((present + late * 0.8) / total) * 100)}%`;
  })();

  // Filter students based on search query and classroom filter
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.roll_number?.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = classFilter === 'All' || s.class === classFilter;
    return matchesSearch && matchesClass;
  });

  const activityLogs = (() => {
    const logs = [];
    
    // 1. Students
    students.forEach(s => {
      logs.push({
        id: `student_${s.id}_${s.updated_at}`,
        timestamp: s.updated_at,
        actor: 'Administrator',
        category: 'Student Registry',
        detail: `Registered student "${s.name}" (Roll: ${s.roll_number}) in ${s.class}`,
        type: 'student'
      });
    });

    // 2. Staff (teachers_admins)
    teachers.forEach(t => {
      logs.push({
        id: `staff_${t.id}_${t.updated_at}`,
        timestamp: t.updated_at,
        actor: 'Super Administrator',
        category: 'Staff Account',
        detail: `Registered staff account "${t.name}" (${t.username}) as ${t.role}`,
        type: 'staff'
      });
    });

    // 3. Question Bank
    questions.forEach(q => {
      logs.push({
        id: `question_${q.id}_${q.updated_at}`,
        timestamp: q.updated_at,
        actor: 'Administrator',
        category: 'Question Bank',
        detail: `Created/Updated MCQ question: "${q.text.substring(0, 50)}${q.text.length > 50 ? '...' : ''}" for ${q.class} ${q.subject}`,
        type: 'question'
      });
    });

    // 4. Assessments
    assessments.forEach(a => {
      const student = students.find(s => s.id === a.student_id);
      const studentName = student ? student.name : 'Unknown Student';
      logs.push({
        id: `assessment_${a.id}_${a.updated_at}`,
        timestamp: a.updated_at,
        actor: 'Teacher',
        category: 'Assessments',
        detail: `Completed Diagnostic Assessment for "${studentName}" - Score: ${a.score}/${a.total_questions} (${Math.round((a.score/a.total_questions)*100)}%)`,
        type: 'assessment'
      });
    });

    // 5. Attendance
    attendance.forEach(att => {
      const student = att.type === 'student' ? students.find(s => s.id === att.target_id) : null;
      const teacher = att.type === 'teacher' ? teachers.find(t => t.id === att.target_id) : null;
      const targetName = student?.name || teacher?.name || 'Unknown';
      logs.push({
        id: `attendance_${att.id}_${att.updated_at}`,
        timestamp: att.updated_at,
        actor: 'Teacher',
        category: 'Attendance',
        detail: `Marked ${att.type} "${targetName}" as ${att.status} for date ${att.date}`,
        type: 'attendance'
      });
    });

    // Sort by timestamp descending
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  })();

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.detail.toLowerCase().includes(logSearch.toLowerCase()) || 
                          log.actor.toLowerCase().includes(logSearch.toLowerCase());
    const matchesType = logTypeFilter === 'All' || log.type === logTypeFilter;
    return matchesSearch && matchesType;
  });

  // Render login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="conn-overlay">
        <div className="card conn-card" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="text-center flex flex-col gap-sm items-center">
            <span style={{ fontSize: '40px' }}>🌳</span>
            <h1 style={{ fontSize: '24px', margin: '8px 0' }} className="brand-title">Wisdom Tree Academy</h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Owner Console Authorization
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (loginUsername === 'superadmin' && loginPassword === 'superadmin123') {
              setIsAuthenticated(true);
              sessionStorage.setItem('owner-authenticated', 'true');
              setLoginError('');
            } else {
              setLoginError('Incorrect username or password. Access denied.');
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="superadmin"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <div style={{
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '13px'
              }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontWeight: 600, fontSize: '14px' }}
            >
              Access Owner Console
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDarkTheme(!darkTheme)}
                className="btn btn-secondary"
                style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                title="Toggle Theme"
              >
                {darkTheme ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isTabLocked = (tabId) => {
    if (tabId === 'settings' || tabId === 'licensing') return false;
    return !isConnected;
  };

  const handleSidebarRefresh = async () => {
    if (!isConnected) return;
    try {
      const client = createClient(supabaseUrl, supabaseKey);
      await loadDashboardData(client);
      alert('Data refreshed successfully from Supabase.');
    } catch (err) {
      alert('Failed to refresh data: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="brand-section">
          <span className="brand-logo">🌳</span>
          <div>
            <h1 className="brand-title">Wisdom Tree</h1>
            <p className="brand-subtitle">Owner Console</p>
          </div>
        </div>

        <nav style={{ flex: 1, marginTop: '24px' }}>
          <ul className="nav-links">
            <li>
              <button
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''} ${isTabLocked('overview') ? 'disabled' : ''}`}
                onClick={() => !isTabLocked('overview') && setActiveTab('overview')}
                style={{ cursor: isTabLocked('overview') ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <Grid size={18} />
                <span>Overview Stats</span>
                {isTabLocked('overview') && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'students' ? 'active' : ''} ${isTabLocked('students') ? 'disabled' : ''}`}
                onClick={() => !isTabLocked('students') && setActiveTab('students')}
                style={{ cursor: isTabLocked('students') ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <Users size={18} />
                <span>Student Roster</span>
                {isTabLocked('students') && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'staff' ? 'active' : ''} ${isTabLocked('staff') ? 'disabled' : ''}`}
                onClick={() => !isTabLocked('staff') && setActiveTab('staff')}
                style={{ cursor: isTabLocked('staff') ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <UserCheck size={18} />
                <span>Staff &amp; Admins</span>
                {isTabLocked('staff') && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'questions' ? 'active' : ''} ${isTabLocked('questions') ? 'disabled' : ''}`}
                onClick={() => !isTabLocked('questions') && setActiveTab('questions')}
                style={{ cursor: isTabLocked('questions') ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <BookOpen size={18} />
                <span>Question Bank</span>
                {isTabLocked('questions') && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'assessments' ? 'active' : ''} ${isTabLocked('assessments') ? 'disabled' : ''}`}
                onClick={() => !isTabLocked('assessments') && setActiveTab('assessments')}
                style={{ cursor: isTabLocked('assessments') ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <Award size={18} />
                <span>Assessments</span>
                {isTabLocked('assessments') && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'attendance' ? 'active' : ''} ${isTabLocked('attendance') ? 'disabled' : ''}`}
                onClick={() => !isTabLocked('attendance') && setActiveTab('attendance')}
                style={{ cursor: isTabLocked('attendance') ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <Calendar size={18} />
                <span>Attendance Logs</span>
                {isTabLocked('attendance') && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'logs' ? 'active' : ''} ${isTabLocked('logs') ? 'disabled' : ''}`}
                onClick={() => !isTabLocked('logs') && setActiveTab('logs')}
                style={{ cursor: isTabLocked('logs') ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <FileText size={18} />
                <span>Activity Logs</span>
                {isTabLocked('logs') && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'licensing' ? 'active' : ''}`}
                onClick={() => setActiveTab('licensing')}
                style={{ width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <Key size={18} />
                <span>Issue License Key</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                style={{ width: '100%', display: 'flex', alignItems: 'center' }}
              >
                <Settings size={18} />
                <span>Database Settings</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer controls */}
        <div className="flex flex-col gap-sm">
          <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button
              onClick={() => setDarkTheme(!darkTheme)}
              className="btn btn-secondary"
              style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
              title="Toggle Theme"
            >
              {darkTheme ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={handleSidebarRefresh}
              className="btn btn-secondary"
              style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
              title="Refresh Data"
              disabled={loadingData || !isConnected}
            >
              <RefreshCw size={16} className={loadingData ? 'spin-anim' : ''} />
            </button>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="top-header">
          <div>
            <h2 className="header-title">
              {activeTab === 'overview' && 'Consolidated Executive Insights'}
              {activeTab === 'students' && 'Central Student Registry'}
              {activeTab === 'staff' && 'Active Teacher & Admin Staff'}
              {activeTab === 'questions' && 'Franchise MCQ Question Bank'}
              {activeTab === 'assessments' && 'Diagnostic Assessment Transcripts'}
              {activeTab === 'attendance' && 'Student & Teacher Attendance Audit'}
              {activeTab === 'logs' && 'Franchise Activity & Operations Audit Logs'}
              {activeTab === 'licensing' && 'Offline License Key Generator'}
              {activeTab === 'settings' && 'Supabase Cluster Settings'}
            </h2>
            <p className="header-subtitle">
              {isConnected ? (
                <span>Connected to Supabase Cluster: <code>{supabaseUrl ? new URL(supabaseUrl).hostname : 'N/A'}</code></span>
              ) : (
                <span style={{ color: 'var(--color-error)' }}>Disconnected: Database Access Restricted</span>
              )}
            </p>
          </div>
        </header>

        {/* OVERVIEW STATS TAB */}
        {activeTab === 'overview' && (
          <div className="fade-in">
            {/* Stat Cards */}
            <div className="dashboard-grid">
              <div className="card">
                <div className="card-title-row">
                  <span>Enrolled Students</span>
                  <Users size={20} className="color-primary" />
                </div>
                <div className="card-value">{totalStudents}</div>
                <div className="card-footer-text">Registered across all classrooms</div>
              </div>

              <div className="card">
                <div className="card-title-row">
                  <span>School Grade Average</span>
                  <TrendingUp size={20} style={{ color: 'var(--color-success)' }} />
                </div>
                <div className="card-value">{schoolAverage}%</div>
                <div className="card-footer-text">Average score of completed evaluations</div>
              </div>

              <div className="card">
                <div className="card-title-row">
                  <span>Assessments Completed</span>
                  <Award size={20} style={{ color: 'var(--color-warning)' }} />
                </div>
                <div className="card-value">{totalAssessments}</div>
                <div className="card-footer-text">Diagnostic runs synced to cloud</div>
              </div>

              <div className="card">
                <div className="card-title-row">
                  <span>Present Rate</span>
                  <UserCheck size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="card-value">{attendanceRate}</div>
                <div className="card-footer-text">Overall student presence average</div>
              </div>
            </div>

            {/* Sub grids for details */}
            <div className="grid-cols-2">
              {/* Recent Assessments Card */}
              <div className="card">
                <h3 className="card-title">Recent Assessment Runs</h3>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Score</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.slice(0, 5).map(item => {
                        const student = students.find(s => s.id === item.student_id);
                        const pct = Math.round((item.score / item.total_questions) * 100);
                        return (
                          <tr key={item.id}>
                            <td>
                              <strong>{student?.name || 'Unknown Student'}</strong>
                            </td>
                            <td>{student?.class || 'N/A'}</td>
                            <td>
                              <span className={`badge ${pct >= 60 ? 'badge-success' : 'badge-error'}`}>
                                {item.score}/{item.total_questions} ({pct}%)
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => setSelectedAssessment({ ...item, student })}
                              >
                                <Eye size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {assessments.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                            No assessments synced yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Classroom Distribution Card */}
              <div className="card">
                <h3 className="card-title">Classroom Roster Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                  {['Nursery', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].map(cls => {
                    const count = students.filter(s => s.class === cls).length;
                    const percent = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                    return (
                      <div key={cls}>
                        <div className="flex justify-between" style={{ fontSize: '13px', marginBottom: '4px' }}>
                          <strong>{cls}</strong>
                          <span style={{ color: 'var(--text-secondary)' }}>{count} students ({percent}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="card fade-in">
            <div className="flex justify-between items-center m-b-md">
              <div className="flex gap-sm items-center">
                <div className="form-group" style={{ width: '240px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by Name or Roll No..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ width: '150px' }}>
                  <select
                    className="form-input"
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                  >
                    <option value="All">All Grades</option>
                    <option value="Nursery">Nursery</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-sm items-center">
                <span className="card-footer-text" style={{ marginRight: '12px' }}>Showing {filteredStudents.length} of {totalStudents} Students</span>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setStudentName('');
                    setStudentRollNumber('');
                    setStudentClass('Nursery');
                    setShowAddStudentModal(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} />
                  Register Student
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Full Name</th>
                    <th>Grade Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.roll_number}</td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.class}</td>
                      <td>
                        <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No matching student records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <div className="card fade-in">
            <div className="flex justify-between items-center m-b-md" style={{ marginBottom: '16px' }}>
              <span className="card-footer-text">Registered Wisdom Tree franchise teachers and administrators.</span>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setStaffName('');
                  setStaffUsername('');
                  setStaffEmail('');
                  setStaffRole('teacher');
                  setStaffPassword('');
                  setShowAddStaffModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={16} />
                Register Staff Account
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>System Role</th>
                    <th>Email Address</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace' }}>{t.username}</td>
                      <td><strong>{t.name}</strong></td>
                      <td>
                        <span className={`badge ${t.role === 'admin' ? 'badge-primary' : 'badge-warning'}`}>
                          {t.role}
                        </span>
                      </td>
                      <td>{t.email || 'N/A'}</td>
                      <td>
                        <span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenResetPassword(t)}
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 10px',
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Key size={12} /> Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No staff accounts registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab === 'questions' && (
          <div className="card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Question Bank Manager</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Manage multiple choice evaluation questions stored in the central database.
                </p>
              </div>
              <button 
                onClick={handleOpenAddQuestion}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-primary, #6366f1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Plus size={16} />
                <span>Add New Question</span>
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Subject</th>
                    <th>Question Prompt</th>
                    <th>Correct Opt</th>
                    <th>Options List</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map(q => {
                    const opts = JSON.parse(q.options_json || '[]');
                    return (
                      <tr key={q.id}>
                        <td>{q.class}</td>
                        <td>{q.subject}</td>
                        <td style={{ maxWidth: '400px', whiteSpace: 'normal' }}>
                          <strong>{q.text}</strong>
                          {q.audio_text && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Audio cue: "{q.audio_text}"</div>}
                          {q.image_path && (
                            <div style={{ marginTop: '6px' }}>
                              <img src={q.image_path} alt="Question Visual" style={{ maxWidth: '100px', maxHeight: '60px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-success">{q.correct_answer}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                            {opts.map((opt, idx) => (
                              <span key={idx} style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                backgroundColor: 'var(--bg-surface)',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)'
                              }}>
                                {String.fromCharCode(65 + idx)}: {opt}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditQuestion(q)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                              }}
                              title="Edit Question"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: 'transparent',
                                color: '#ef4444',
                                cursor: 'pointer'
                              }}
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {questions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No MCQs loaded in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && (
          <div className="card fade-in">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Grade Level</th>
                    <th>Evaluation Date</th>
                    <th>Score / Percentage</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map(item => {
                    const student = students.find(s => s.id === item.student_id);
                    const pct = Math.round((item.score / item.total_questions) * 100);
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{student?.name || 'Unknown Student'}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Roll: {student?.roll_number}</div>
                        </td>
                        <td>{student?.class || 'N/A'}</td>
                        <td>{item.date}</td>
                        <td>
                          <strong>{item.score}</strong> / {item.total_questions}
                          <span className={`badge ${pct >= 60 ? 'badge-success' : 'badge-error'}`} style={{ marginLeft: '12px' }}>
                            {pct}%
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedAssessment({ ...item, student })}
                          >
                            <Eye size={14} style={{ marginRight: '6px' }} />
                            View Transcript
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {assessments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No assessment evaluations have been synced to the cloud.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="card fade-in">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Target Name</th>
                    <th>Type</th>
                    <th>Roster Class</th>
                    <th>Log Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(item => {
                    const student = item.type === 'student' ? students.find(s => s.id === item.target_id) : null;
                    const teacher = item.type === 'teacher' ? teachers.find(t => t.id === item.target_id) : null;
                    const targetName = student?.name || teacher?.name || 'Unknown';
                    const targetClass = student?.class || 'N/A';

                    return (
                      <tr key={item.id}>
                        <td><strong>{targetName}</strong></td>
                        <td>
                          <span className={`badge ${item.type === 'student' ? 'badge-primary' : 'badge-warning'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td>{targetClass}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.date}</td>
                        <td>
                          <span className={`badge ${
                            item.status === 'present' ? 'badge-success' : 
                            item.status === 'late' ? 'badge-warning' : 'badge-error'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No attendance logs synced.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LICENSING TAB */}
        {activeTab === 'licensing' && (
          <div className="card fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} className="color-primary" />
              Generate Branch Activation Key
            </h3>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Wisdom Tree Academy uses offline cryptographic activation. Generate a secure, signed key for a franchise branch school here, which they can paste into their desktop application settings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 'bold' }}>School Branch Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SCH001, WESTSIDE, LHR05"
                  value={licSchoolCode}
                  onChange={e => setLicSchoolCode(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
                <span className="card-footer-text">Alphanumeric code identifying this school branch.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 'bold' }}>Max Grade Level</label>
                  <select
                    className="form-input"
                    value={licMaxGrade}
                    onChange={e => setLicMaxGrade(e.target.value)}
                  >
                    <option value="NURS">Nursery Only</option>
                    <option value="G1">Grade 1 Max</option>
                    <option value="G2">Grade 2 Max</option>
                    <option value="G3">Grade 3 Max</option>
                    <option value="G4">Grade 4 Max</option>
                    <option value="G5">Grade 5 Max (Standard)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 'bold' }}>Feature Level</label>
                  <select
                    className="form-input"
                    value={licFeatures}
                    onChange={e => setLicFeatures(e.target.value)}
                  >
                    <option value="FULL">Full Suite (Assessments + Sync)</option>
                    <option value="LITE">Lite (Local Offline Only)</option>
                  </select>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleGenerateLicenseKey}
                style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <Key size={16} />
                Generate Signed License Key
              </button>

              {generatedKey && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Generated Product Key:</span>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: 'var(--color-primary)',
                    backgroundColor: 'var(--bg-app)',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    wordBreak: 'break-all',
                    textAlign: 'center'
                  }}>
                    {generatedKey}
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      alert('Copied license key to clipboard!');
                    }}
                    style={{ fontSize: '12px', padding: '6px 12px', alignSelf: 'center' }}
                  >
                    Copy Key to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* DATABASE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="card fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} className="color-primary" />
              Supabase Database Connection settings
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Configure the connection keys to your remote cloud database. All franchise branches utilize this shared database to sync assessment scores, attendance logs, and student registrations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                color: isConnected ? 'var(--color-success)' : 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-error)'
                }}></div>
                Database Connection Status: {isConnected ? 'Connected & Operational' : 'Disconnected'}
              </div>

              {!isConnected && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  <strong>⚠️ Restricted Mode Enabled:</strong> When the database is disconnected, access to all other administrative panels (Overview, Students, Staff, Questions, Assessments, and Attendance) is locked for safety.
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 'bold' }}>Supabase Project URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://your-project.supabase.co"
                  value={tempSupabaseUrl}
                  onChange={e => setTempSupabaseUrl(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 'bold' }}>Supabase Anon Key / Service Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  value={tempSupabaseKey}
                  onChange={e => setTempSupabaseKey(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>

              <div className="flex justify-end gap-sm" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px', marginTop: '10px' }}>
                {isConnected && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDisconnect(false)}
                    style={{ color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    Disconnect Database
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleSaveConnectionKeys}
                  disabled={!tempSupabaseUrl.trim() || !tempSupabaseKey.trim()}
                >
                  Save &amp; Establish Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="card fade-in">
            <div className="flex justify-between items-center m-b-md" style={{ gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div className="flex gap-sm items-center" style={{ flex: 1 }}>
                <div className="form-group" style={{ width: '280px', marginBottom: 0 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search logs by actor or description..."
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                  <select
                    className="form-input"
                    value={logTypeFilter}
                    onChange={e => setLogTypeFilter(e.target.value)}
                  >
                    <option value="All">All Operations</option>
                    <option value="student">Student Registries</option>
                    <option value="staff">Staff Accounts</option>
                    <option value="question">Question Bank</option>
                    <option value="assessment">Diagnostic Assessments</option>
                    <option value="attendance">Attendance Logs</option>
                  </select>
                </div>
              </div>
              <span className="card-footer-text">Showing {filteredLogs.length} of {activityLogs.length} audit logs</span>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '160px' }}>Timestamp</th>
                    <th style={{ width: '130px' }}>Category</th>
                    <th style={{ width: '150px' }}>Actor</th>
                    <th>Activity Detail Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${
                          log.type === 'student' ? 'badge-primary' :
                          log.type === 'staff' ? 'badge-success' :
                          log.type === 'question' ? 'badge-info' :
                          log.type === 'assessment' ? 'badge-warning' :
                          'badge-error'
                        }`} style={{
                          backgroundColor:
                            log.type === 'question' ? 'rgba(56, 189, 248, 0.15)' :
                            log.type === 'assessment' ? 'rgba(251, 191, 36, 0.15)' :
                            undefined,
                          color:
                            log.type === 'question' ? '#38bdf8' :
                            log.type === 'assessment' ? '#fbbf24' :
                            undefined
                        }}>
                          {log.category}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '13px' }}>{log.actor}</strong>
                      </td>
                      <td style={{ fontSize: '13.5px', lineHeight: 1.4 }}>
                        {log.detail}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center" style={{ color: 'var(--text-secondary)', padding: '24px' }}>
                        No operations logs found matching the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ASSESSMENT TRANSCRIPT VIEW MODAL */}
      {selectedAssessment && (
        <div className="modal-overlay" onClick={() => setSelectedAssessment(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Student Diagnostic Scorecard Transcript</h3>
              <button className="close-btn" onClick={() => setSelectedAssessment(null)}>&times;</button>
            </div>

            <div className="report-modal-body">
              {/* Header Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Candidate Name:</span>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{selectedAssessment.student?.name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Roll Number:</span>
                  <div style={{ fontWeight: 600 }}>{selectedAssessment.student?.roll_number}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Grade Roster:</span>
                  <div style={{ fontWeight: 600 }}>{selectedAssessment.student?.class}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Assessment Date:</span>
                  <div style={{ fontWeight: 600 }}>{selectedAssessment.date}</div>
                </div>
              </div>

              {/* Score Breakdown Card */}
              <div className="report-summary-box">
                <div className="report-summary-grid">
                  <div>
                    <div className="report-summary-val">{selectedAssessment.score}</div>
                    <div className="report-summary-lbl">Correct Answers</div>
                  </div>
                  <div>
                    <div className="report-summary-val">{selectedAssessment.total_questions}</div>
                    <div className="report-summary-lbl">Total Questions</div>
                  </div>
                  <div>
                    <div className="report-summary-val">
                      {Math.round((selectedAssessment.score / selectedAssessment.total_questions) * 100)}%
                    </div>
                    <div className="report-summary-lbl">Score Obtained</div>
                  </div>
                </div>
              </div>

              {/* Question by Question list */}
              <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Question Breakdown</h4>
              <div className="report-answers-grid">
                {(() => {
                  try {
                    const results = JSON.parse(selectedAssessment.results_json || '[]');
                    return results.map((res, index) => {
                      const isAnsCorrect = res.isCorrect !== undefined ? res.isCorrect : res.correct;
                      return (
                        <div
                          key={index}
                          className={`report-answer-item ${isAnsCorrect ? 'report-answer-correct' : 'report-answer-incorrect'}`}
                        >
                          <span>Q{index + 1}:</span>
                          <span>{isAnsCorrect ? 'Correct' : 'Incorrect'}</span>
                        </div>
                      );
                    });
                  } catch (e) {
                    return <span style={{ color: 'var(--text-secondary)' }}>No question detail logs saved.</span>;
                  }
                })()}
              </div>
            </div>

            <div className="text-right">
              <button className="btn btn-secondary" onClick={() => setSelectedAssessment(null)}>
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION BANK CRUD MODAL */}
      {showQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingQuestion ? 'Modify MCQ Details' : 'Register New MCQ Question'}</h3>
              <button className="close-btn" onClick={() => setShowQuestionModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveQuestion}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Target Grade Level</label>
                    <select
                      className="form-control"
                      value={qClass}
                      onChange={e => setQClass(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      <option value="Nursery">Nursery</option>
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Subject Area</label>
                    <select
                      className="form-control"
                      value={qSubject}
                      onChange={e => setQSubject(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="English">English</option>
                      <option value="Science">Science</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Question Prompt Text</label>
                  <textarea
                    rows={3}
                    placeholder="Enter the question text prompt..."
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)', resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Option A</label>
                    <input
                      type="text"
                      placeholder="Option A text..."
                      value={qOptA}
                      onChange={e => setQOptA(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Option B</label>
                    <input
                      type="text"
                      placeholder="Option B text..."
                      value={qOptB}
                      onChange={e => setQOptB(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Option C (Optional)</label>
                    <input
                      type="text"
                      placeholder="Option C text..."
                      value={qOptC}
                      onChange={e => setQOptC(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Option D (Optional)</label>
                    <input
                      type="text"
                      placeholder="Option D text..."
                      value={qOptD}
                      onChange={e => setQOptD(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Correct Option Letter</label>
                    <select
                      className="form-control"
                      value={qCorrect}
                      onChange={e => setQCorrect(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      {qOptC.trim() && <option value="C">Option C</option>}
                      {qOptD.trim() && <option value="D">Option D</option>}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>TTS Audio Text (Optional)</label>
                    <input
                      type="text"
                      placeholder="Spoken cue text (defaults to Question Text)..."
                      value={qAudioText}
                      onChange={e => setQAudioText(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Illustrative Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setQImagePath(evt.target.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                    {qImagePath && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={qImagePath} alt="Preview" style={{ maxWidth: '80px', maxHeight: '50px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        <button type="button" onClick={() => setQImagePath('')} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQuestionModal(false)}
                  disabled={isSavingQuestion}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: 'var(--color-primary, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  disabled={isSavingQuestion}
                >
                  {isSavingQuestion ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF PASSWORD RESET MODAL */}
      {showPasswordModal && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Password</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveStaffPassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Changing password for staff account: <strong>{selectedStaff.name} ({selectedStaff.username})</strong>.
                </p>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newStaffPassword}
                    onChange={e => setNewStaffPassword(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmStaffPassword}
                    onChange={e => setConfirmStaffPassword(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={resettingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: 'var(--color-primary, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  disabled={resettingPassword}
                >
                  {resettingPassword ? 'Resetting...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Student</h3>
              <button className="close-btn" onClick={() => setShowAddStudentModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveStudent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. LHR-0042"
                    value={studentRollNumber}
                    onChange={e => setStudentRollNumber(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Grade Level Assign</label>
                  <select
                    value={studentClass}
                    onChange={e => setStudentClass(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    <option value="Nursery">Nursery</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddStudentModal(false)}
                  disabled={isSavingStudent}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: 'var(--color-primary, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  disabled={isSavingStudent}
                >
                  {isSavingStudent ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="modal-overlay" onClick={() => setShowAddStaffModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Staff Account</h3>
              <button className="close-btn" onClick={() => setShowAddStaffModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveStaff}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ms. Sarah Jenkins"
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Username</label>
                    <input
                      type="text"
                      placeholder="e.g. sarahj"
                      value={staffUsername}
                      onChange={e => setStaffUsername(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>System Role</label>
                    <select
                      value={staffRole}
                      onChange={e => setStaffRole(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      <option value="teacher">Teacher</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. sarah.j@wisdomtree.edu"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Sign-in Password (min 6 characters)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddStaffModal(false)}
                  disabled={isSavingStaff}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: 'var(--color-primary, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  disabled={isSavingStaff}
                >
                  {isSavingStaff ? 'Registering...' : 'Register Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
