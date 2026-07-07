import React, { useState } from 'react';
import './Attendance.css';
import { useApp } from '../context/AppContext';
import { mockStudents } from '../data/mockData';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Calendar, Check, X, Clock, BarChart3, Save, Users, RefreshCw } from 'lucide-react';

export const Attendance = () => {
  const { showToast, addPendingSyncItem } = useApp();
  const [selectedGrade, setSelectedGrade] = useState('Grade 1');

  // Load students and initialize attendance state
  const initialRecords = mockStudents.reduce((acc, student) => {
    acc[student.id] = 'present'; // default present
    return acc;
  }, {});

  const [attendanceState, setAttendanceState] = useState(initialRecords);
  const [weeklyStats, setWeeklyStats] = useState([
    { day: 'Mon', percent: 96 },
    { day: 'Tue', percent: 94 },
    { day: 'Wed', percent: 91 },
    { day: 'Thu', percent: 95 },
    { day: 'Fri', percent: 93 }
  ]);

  // Filter students based on selected grade
  const filteredStudents = mockStudents.filter(s => s.grade === selectedGrade);

  const handleStatusChange = (studentId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = () => {
    const presentCount = Object.values(attendanceState).filter(s => s === 'present').length;
    const absentCount = Object.values(attendanceState).filter(s => s === 'absent').length;
    const lateCount = Object.values(attendanceState).filter(s => s === 'late').length;

    // Simulate saving and offline queue addition
    addPendingSyncItem('Attendance Run', `Recorded ${presentCount} present, ${absentCount} absent for ${selectedGrade}`);
    showToast(`Attendance saved! (${presentCount} Present, ${absentCount} Absent, ${lateCount} Late). Added 1 pending sync queue item.`, 'success');
  };

  const activeGradeStudentsCount = filteredStudents.length;
  const activePresentCount = filteredStudents.filter(s => attendanceState[s.id] === 'present').length;
  const activeAbsentCount = filteredStudents.filter(s => attendanceState[s.id] === 'absent').length;
  const activeLateCount = filteredStudents.filter(s => attendanceState[s.id] === 'late').length;
  const attendanceRate = activeGradeStudentsCount > 0 
    ? Math.round(((activePresentCount + (activeLateCount * 0.8)) / activeGradeStudentsCount) * 100) 
    : 0;

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
          <div className="registry-header-row">
            {/* Grade Switcher */}
            <div className="grade-selector-tabs">
              {['Nursery', 'Grade 1', 'Grade 2'].map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`grade-tab-btn ${selectedGrade === grade ? 'active' : ''}`}
                >
                  {grade}
                </button>
              ))}
            </div>

            <Button variant="primary" onClick={handleSaveAttendance} icon={Save}>
              Save Attendance
            </Button>
          </div>

          <div className="registry-table-wrapper">
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
                {filteredStudents.map((student) => {
                  const currentStatus = attendanceState[student.id];
                  return (
                    <tr key={student.id} className="registry-row">
                      <td className="row-roll">{student.id}</td>
                      <td>
                        <div className="row-student-name">{student.name}</div>
                      </td>
                      <td>
                        <span className="row-grade-badge">{student.grade}</span>
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
                  // Calculate height (svg height from y=20 to y=100 is 80px)
                  const barHeight = (item.percent / 100) * 80;
                  const startY = 100 - barHeight;

                  return (
                    <g key={item.day} className="chart-bar-group">
                      {/* Background slot */}
                      <rect
                        x={startX}
                        y={20}
                        width={barWidth}
                        height={80}
                        rx="4"
                        className="chart-bar-slot"
                      />
                      {/* Active bar */}
                      <rect
                        x={startX}
                        y={startY}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        className="chart-bar-fill"
                      />
                      {/* Day Label */}
                      <text
                        x={startX + barWidth / 2}
                        y={120}
                        textAnchor="middle"
                        className="chart-bar-label"
                      >
                        {item.day}
                      </text>
                      {/* Percent Label */}
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
