import React, { useState, useEffect } from 'react';
import './Attendance.css';
import { useApp } from '../context/AppContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Calendar, Check, X, Clock, BarChart3, Save } from 'lucide-react';

export const Attendance = () => {
  const { showToast, refreshSyncInfo } = useApp();
  const [classes, setClasses] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});

  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      if (window.api) {
        const clsList = await window.api.getClasses();
        setClasses(clsList);
        if (clsList.length > 0) {
          setSelectedGrade(clsList[0].name);
        }
      }
    };
    loadClasses();
  }, []);

  // Load student rosters and any existing attendance records for selected grade and date
  useEffect(() => {
    if (!selectedGrade) return;

    const loadRosterAndAttendance = async () => {
      if (window.api) {
        // Fetch all students
        const allStudents = await window.api.getStudents();
        // Filter by selected classroom
        const gradeStudents = allStudents.filter(s => s.class === selectedGrade);
        setStudents(gradeStudents);

        // Fetch attendance logs for type 'student'
        const logs = await window.api.getAttendance(todayStr, 'student');
        
        // Build initial state (if log exists, use it; otherwise default to present)
        const initial = {};
        gradeStudents.forEach(student => {
          const existing = logs.find(l => l.target_id === student.id);
          initial[student.id] = existing ? existing.status : 'present';
        });
        setAttendanceState(initial);
      }
    };
    loadRosterAndAttendance();
  }, [selectedGrade]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      showToast('No students registered in this class to mark attendance.', 'error');
      return;
    }

    const records = students.map(student => ({
      type: 'student',
      target_id: student.id,
      date: todayStr,
      status: attendanceState[student.id] || 'present'
    }));

    if (window.api) {
      const res = await window.api.saveAttendance(records);
      if (res.success) {
        showToast(`Attendance saved successfully for ${selectedGrade}!`, 'success');
        refreshSyncInfo();
      } else {
        showToast('Failed to save attendance.', 'error');
      }
    }
  };

  const activeGradeStudentsCount = students.length;
  const activePresentCount = students.filter(s => attendanceState[s.id] === 'present').length;
  const activeAbsentCount = students.filter(s => attendanceState[s.id] === 'absent').length;
  const activeLateCount = students.filter(s => attendanceState[s.id] === 'late').length;
  const attendanceRate = activeGradeStudentsCount > 0 
    ? Math.round(((activePresentCount + (activeLateCount * 0.8)) / activeGradeStudentsCount) * 100) 
    : 0;

  const weeklyStats = [
    { day: 'Mon', percent: 96 },
    { day: 'Tue', percent: 94 },
    { day: 'Wed', percent: 91 },
    { day: 'Thu', percent: 95 },
    { day: 'Fri', percent: 93 }
  ];

  return (
    <div className="page-container attendance-page fade-in">
      <div className="attendance-header-section">
        <div>
          <h1 className="welcome-heading">Daily Attendance Register</h1>
          <p className="welcome-subtext">Manage student registries, log absenteeism, and sync rosters offline.</p>
        </div>
        <div className="current-date-badge">
          <Calendar size={16} />
          <span>Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="attendance-grid-layout">
        {/* Left Side: Student Registry List */}
        <div className="card registry-card">
          <div className="registry-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {/* Grade Switcher Dropdown */}
            <div className="grade-selector-dropdown-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                Classroom:
              </span>
              <select
                className="form-select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                style={{ width: '180px', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="primary" onClick={handleSaveAttendance} icon={Save}>
              Save Attendance
            </Button>
          </div>

          <div className="registry-table-wrapper">
            {students.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No students enrolled in {selectedGrade || 'this class'}. Go to Student Registry to add students.
              </div>
            ) : (
              <table className="registry-table">
                <thead>
                  <tr>
                    <th>Roll #</th>
                    <th>Student Name</th>
                    <th>Grade</th>
                    <th style={{ textAlign: 'center' }}>Attendance Status Roster</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const currentStatus = attendanceState[student.id];
                    return (
                      <tr key={student.id} className="registry-row">
                        <td className="row-roll">{student.roll_number}</td>
                        <td>
                          <div className="row-student-name">{student.name}</div>
                        </td>
                        <td>
                          <span className="row-grade-badge">{student.class}</span>
                        </td>
                        <td>
                          <div className="status-selector-button-group">
                            <button
                              onClick={() => handleStatusChange(student.id, 'present')}
                              className={`status-btn btn-present ${currentStatus === 'present' ? 'active' : ''}`}
                              title="Mark Present"
                            >
                              <Check size={14} className="status-icon" />
                              <span>Present</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'late')}
                              className={`status-btn btn-late ${currentStatus === 'late' ? 'active' : ''}`}
                              title="Mark Late"
                            >
                              <Clock size={14} className="status-icon" />
                              <span>Late</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'absent')}
                              className={`status-btn btn-absent ${currentStatus === 'absent' ? 'active' : ''}`}
                              title="Mark Absent"
                            >
                              <X size={14} className="status-icon" />
                              <span>Absent</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Roll Stats & Charts */}
        <div className="flex flex-col gap-lg">
          {/* Roster stats */}
          <div className="card roster-stats-card">
            <h3 className="card-title">Classroom Stats Summary</h3>
            <div className="stats-metric-display">
              <span className="stats-percent">{attendanceRate}%</span>
              <span className="stats-desc">Overall Attendance Rate today</span>
            </div>
            
            <div className="stats-breakdown-pills">
              <div className="breakdown-item present">
                <span className="breakdown-label">Present</span>
                <span className="breakdown-val">{activePresentCount}</span>
              </div>
              <div className="breakdown-item late">
                <span className="breakdown-label">Late</span>
                <span className="breakdown-val">{activeLateCount}</span>
              </div>
              <div className="breakdown-item absent">
                <span className="breakdown-label">Absent</span>
                <span className="breakdown-val">{activeAbsentCount}</span>
              </div>
            </div>
          </div>

          {/* SVG Weekly Chart Card */}
          <div className="card weekly-analytics-card">
            <div className="chart-header">
              <BarChart3 size={16} className="color-primary" />
              <h3 className="card-title" style={{ marginBottom: 0 }}>Weekly Trend Analytics</h3>
            </div>
            
            <div className="svg-chart-container">
              <svg viewBox="0 0 240 140" className="analytics-svg">
                {/* Horizontal gridlines */}
                <line x1="20" y1="20" x2="230" y2="20" className="chart-gridline" />
                <line x1="20" y1="60" x2="230" y2="60" className="chart-gridline" />
                <line x1="20" y1="100" x2="230" y2="100" className="chart-gridline" />
                
                {/* Left labels */}
                <text x="5" y="24" className="chart-label-text">100%</text>
                <text x="5" y="64" className="chart-label-text">50%</text>
                <text x="5" y="104" className="chart-label-text">0%</text>

                {/* Bars */}
                {weeklyStats.map((item, idx) => {
                  const barWidth = 22;
                  const gap = 18;
                  const startX = 35 + idx * (barWidth + gap);
                  const barHeight = (item.percent / 100) * 80;
                  const startY = 100 - barHeight;

                  return (
                    <g key={item.day} className="chart-bar-group">
                      <rect
                        x={startX}
                        y={20}
                        width={barWidth}
                        height={80}
                        rx="4"
                        className="chart-bar-slot"
                      />
                      <rect
                        x={startX}
                        y={startY}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        className="chart-bar-fill"
                      />
                      <text
                        x={startX + barWidth / 2}
                        y={120}
                        textAnchor="middle"
                        className="chart-bar-label"
                      >
                        {item.day}
                      </text>
                      <text
                        x={startX + barWidth / 2}
                        y={startY - 6}
                        textAnchor="middle"
                        className="chart-bar-value"
                      >
                        {item.percent}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
