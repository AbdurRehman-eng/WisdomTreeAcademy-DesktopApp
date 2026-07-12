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
  Key
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
          updated_at: new Date().toISOString()
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

  // Attempt connection on mount if keys are saved
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      handleConnect(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (isAuto = false) => {
    if (!supabaseUrl || !supabaseKey) {
      if (!isAuto) setConnectionError('Both Supabase URL and Anon Key are required.');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');
    try {
      const client = createClient(supabaseUrl, supabaseKey);
      
      // Test the connection by doing a simple query on the students table.
      // If RLS is enabled and select is restricted, we'll still get a response (even empty array) or metadata check.
      const { error } = await client.from('students').select('*').limit(1);

      if (error) {
        throw new Error(error.message);
      }

      // Connection success
      localStorage.setItem('supabase-url', supabaseUrl);
      localStorage.setItem('supabase-anon-key', supabaseKey);
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

  const handleDisconnect = () => {
    setIsConnected(false);
    setStudents([]);
    setTeachers([]);
    setAssessments([]);
    setAttendance([]);
    setQuestions([]);
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
    if (attendance.length === 0) return 'N/A';
    const present = attendance.filter(a => a.status === 'present').length;
    const total = attendance.length;
    return `${Math.round((present / total) * 100)}%`;
  })();

  // Filter students based on search query and classroom filter
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.roll_number?.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = classFilter === 'All' || s.class === classFilter;
    return matchesSearch && matchesClass;
  });

  // Render Supabase credentials screen if not connected
  if (!isConnected) {
    return (
      <div className="conn-overlay">
        <div className="card conn-card">
          <div className="text-center flex flex-col gap-sm items-center">
            <span style={{ fontSize: '40px' }}>🌳</span>
            <h1 style={{ fontSize: '24px', margin: '8px 0' }} className="brand-title">Wisdom Tree Academy</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Central Franchise &amp; Owner Management Dashboard Setup
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Supabase Project URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://xxxxxxxxxxxxx.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Anon Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
              />
            </div>

            {connectionError && (
              <div style={{
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '13px'
              }}>
                <strong>Connection Failed:</strong> {connectionError}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={isConnecting}
              onClick={() => handleConnect(false)}
            >
              {isConnecting ? 'Establishing Connection...' : 'Securely Connect to Supabase'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <button
                onClick={() => setDarkTheme(!darkTheme)}
                className="btn btn-secondary"
                style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                title="Toggle Theme"
              >
                {darkTheme ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <Grid size={18} />
                <span>Overview Stats</span>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                <Users size={18} />
                <span>Student Roster</span>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
                <UserCheck size={18} />
                <span>Staff &amp; Admins</span>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
                <BookOpen size={18} />
                <span>Question Bank</span>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'assessments' ? 'active' : ''}`} onClick={() => setActiveTab('assessments')}>
                <Award size={18} />
                <span>Assessments</span>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                <Calendar size={18} />
                <span>Attendance Logs</span>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'licensing' ? 'active' : ''}`} onClick={() => setActiveTab('licensing')}>
                <Key size={18} />
                <span>Issue License Key</span>
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
            >
              {darkTheme ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => loadDashboardData()}
              className="btn btn-secondary"
              style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
              title="Refresh Data"
              disabled={loadingData}
            >
              <RefreshCw size={16} className={loadingData ? 'spin-anim' : ''} />
            </button>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleDisconnect}>
            <LogOut size={16} />
            <span>Disconnect</span>
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
              {activeTab === 'licensing' && 'Offline License Key Generator'}
            </h2>
            <p className="header-subtitle">
              Connected to Supabase Cluster: <code>{new URL(supabaseUrl).hostname}</code>
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
              <span className="card-footer-text">Showing {filteredStudents.length} of {totalStudents} Students</span>
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
                    return results.map((res, index) => (
                      <div
                        key={index}
                        className={`report-answer-item ${res.correct ? 'report-answer-correct' : 'report-answer-incorrect'}`}
                      >
                        <span>Q{index + 1}:</span>
                        <span>{res.correct ? 'Correct' : 'Incorrect'}</span>
                      </div>
                    ));
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
    </div>
  );
}
