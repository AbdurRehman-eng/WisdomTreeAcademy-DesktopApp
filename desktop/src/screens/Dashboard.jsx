import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useApp } from '../context/AppContext';
import {
  Users,
  GraduationCap,
  CalendarCheck2,
  Database,
  PlusCircle,
  Play,
  CheckCircle,
  RefreshCcw,
  FileCheck,
  School
} from 'lucide-react';

export const Dashboard = () => {
  const { user, setScreen, pendingSyncCount, triggerSync, syncStatus } = useApp();
  
  const [dashboardData, setDashboardData] = useState({
    studentCount: 0,
    facultyCount: 0,
    classCount: 0,
    assessmentCount: 0,
    todayAttendanceRate: 'Pending',
    pendingSyncQueue: [],
    activityLog: [],
    activeClasses: []
  });

  const fetchDashboardData = async () => {
    if (window.api) {
      const data = await window.api.getDashboardData();
      setDashboardData(data);
    } else {
      // Browser fallback (Web preview / fallback metrics)
      setDashboardData({
        studentCount: 8,
        facultyCount: 4,
        classCount: 6,
        assessmentCount: 15,
        todayAttendanceRate: '92%',
        pendingSyncQueue: [
          { type: 'Attendance', detail: 'Grade 1 Roster - July 5', date: 'Jul 5, 2026' }
        ],
        activityLog: [
          { id: 'act1', type: 'attendance', message: 'Attendance recorded for Grade 1 (14 present, 1 late, 0 absent)', user: 'Teacher', time: '10 minutes ago' },
          { id: 'act2', type: 'assessment', message: 'Aiden Vance completed the Grade 1 Diagnostic Assessment', user: 'Teacher', time: '1 hour ago' }
        ],
        activeClasses: [
          { name: 'Nursery', studentCount: 2 },
          { name: 'Grade 1', studentCount: 3 },
          { name: 'Grade 2', studentCount: 3 }
        ]
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [pendingSyncCount]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="page-container fade-in">
      <div className="dashboard-header-panel">
        <h1 className="welcome-heading">Welcome back, {user.name}</h1>
        <p className="welcome-subtext">
          {isAdmin 
            ? 'Here is an overview of Wisdom Tree Academy’s operational metrics today.'
            : 'Access your assigned classes, subjects, and conduct active student assessments.'
          }
        </p>
      </div>

      {isAdmin ? (
        /* ==================== ADMIN VIEW ==================== */
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-4">
            <div className="card metric-card">
              <div className="metric-icon-bg primary">
                <Users size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Total Students</span>
                <span className="metric-value">{dashboardData.studentCount}</span>
                <span className="metric-change positive">Registered Locally</span>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-icon-bg accent">
                <GraduationCap size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Total Faculty</span>
                <span className="metric-value">{dashboardData.facultyCount}</span>
                <span className="metric-change">System Accounts</span>
              </div>
            </div>

            <div className="card metric-card" onClick={() => setScreen('attendance')} style={{ cursor: 'pointer' }}>
              <div className="metric-icon-bg success">
                <CalendarCheck2 size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Today's Attendance</span>
                <span className="metric-value">{dashboardData.todayAttendanceRate}</span>
                <span className="metric-change positive">Click to view registry</span>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-icon-bg error">
                <RefreshCcw size={22} className={syncStatus === 'syncing' ? 'spinner' : ''} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Pending Cloud Sync</span>
                <span className="metric-value">{pendingSyncCount} items</span>
                <span className="metric-change warning">{syncStatus === 'offline' ? 'Offline mode active' : 'Sync needed'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Workspace Panel */}
          <div className="dashboard-grid-main">
            {/* Left Column: Actions & Sync Queue */}
            <div className="flex flex-col gap-lg">
              <div className="card dashboard-actions-card">
                <h3 className="card-title">Quick Action Panel</h3>
                <div className="actions-button-grid">
                  <button onClick={() => setScreen('students')} className="action-tile-btn">
                    <PlusCircle size={20} className="action-tile-icon color-blue" />
                    <span className="action-tile-title">Register Student</span>
                    <span className="action-tile-desc">Add a new record to registry</span>
                  </button>

                  <button onClick={() => setScreen('attendance')} className="action-tile-btn">
                    <CheckCircle size={20} className="action-tile-icon color-green" />
                    <span className="action-tile-title">Mark Attendance</span>
                    <span className="action-tile-desc">Take today's daily roll call</span>
                  </button>

                  <button onClick={() => setScreen('question-bank')} className="action-tile-btn">
                    <Database size={20} className="action-tile-icon color-orange" />
                    <span className="action-tile-title">Manage Questions</span>
                    <span className="action-tile-desc">Add or import MCQ templates</span>
                  </button>
                </div>
              </div>

              {/* Sync Queue Card */}
              <div className="card sync-queue-card">
                <div className="flex justify-between items-center header-margin">
                  <h3 className="card-title">Local Database Sync Queue</h3>
                  <button
                    onClick={triggerSync}
                    disabled={syncStatus === 'syncing' || pendingSyncCount === 0}
                    className="sync-now-action-btn"
                  >
                    Sync Now
                  </button>
                </div>

                {pendingSyncCount > 0 && dashboardData.pendingSyncQueue.length > 0 ? (
                  <div className="sync-queue-list">
                    {dashboardData.pendingSyncQueue.map((item, idx) => (
                      <div key={idx} className="sync-queue-item">
                        <div className="sync-item-dot" />
                        <div className="sync-item-info">
                          <span className="sync-item-type">{item.type}</span>
                          <span className="sync-item-detail">{item.detail}</span>
                        </div>
                        <span className="sync-item-date">{item.date}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sync-empty-state">
                    <CheckCircle size={32} className="sync-success-icon" />
                    <span className="sync-empty-text">Local database is fully synchronized.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Activity Feed */}
            <div className="card activity-feed-card">
              <h3 className="card-title">Recent School Activities</h3>
              <div className="activity-timeline">
                {dashboardData.activityLog.map((log) => (
                  <div key={log.id} className="activity-timeline-item">
                    <div className={`activity-icon-badge ${log.type}`}>
                      {log.type === 'attendance' && '📋'}
                      {log.type === 'assessment' && '📝'}
                      {log.type === 'question' && '📚'}
                      {log.type === 'sync' && '🔄'}
                      {log.type === 'student' && '👤'}
                    </div>
                    <div className="activity-log-details">
                      <p className="activity-log-msg">{log.message}</p>
                      <div className="activity-log-meta">
                        <span>by {log.user}</span>
                        <span className="meta-divider">•</span>
                        <span>{log.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {dashboardData.activityLog.length === 0 && (
                  <div className="sync-empty-state">
                    <span className="sync-empty-text">No recent activity.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ==================== TEACHER VIEW ==================== */
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-3">
            <div className="card metric-card">
              <div className="metric-icon-bg primary">
                <School size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">My Assigned Classes</span>
                <span className="metric-value">{dashboardData.classCount} Rooms</span>
                <span className="metric-change">Active Classrooms</span>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-icon-bg success">
                <FileCheck size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Completed Assessments</span>
                <span className="metric-value">{dashboardData.assessmentCount} tests</span>
                <span className="metric-change positive">Evaluated locally</span>
              </div>
            </div>

            <div className="card metric-card" onClick={() => setScreen('attendance')} style={{ cursor: 'pointer' }}>
              <div className="metric-icon-bg accent">
                <CalendarCheck2 size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Today's Attendance Roll</span>
                <span className="metric-value">{dashboardData.todayAttendanceRate}</span>
                <span className="metric-change warning">Click to mark attendance</span>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-main">
            {/* Left Column: My Classrooms & Quick Action */}
            <div className="flex flex-col gap-lg">
              <div className="card classes-panel-card">
                <h3 className="card-title">My Classroom Access</h3>
                <div className="classes-grid">
                  {dashboardData.activeClasses.map((cls, idx) => (
                    <div key={idx} className="class-status-card">
                      <div className="class-card-header">
                        <span className="class-grade-tag">{cls.name}</span>
                        <span className="student-count-pill">{cls.studentCount} Students</span>
                      </div>
                      <p className="class-subject-list">Active roster for evaluation</p>
                      <div className="class-card-footer">
                        <button onClick={() => setScreen('assessment-setup')} className="class-action-btn primary-action">
                          <Play size={12} className="footer-btn-icon" />
                          Run Assessment
                        </button>
                        <button onClick={() => setScreen('attendance')} className="class-action-btn secondary-action">
                          Attendance
                        </button>
                      </div>
                    </div>
                  ))}
                  {dashboardData.activeClasses.length === 0 && (
                    <div className="sync-empty-state">
                      <span className="sync-empty-text">No active classes found.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Quick Launch */}
              <div className="card dashboard-actions-card">
                <h3 className="card-title">Quick Action Hub</h3>
                <div className="actions-button-grid">
                  <button onClick={() => setScreen('assessment-setup')} className="action-tile-btn">
                    <Play size={20} className="action-tile-icon color-blue" />
                    <span className="action-tile-title">Start New Assessment</span>
                    <span className="action-tile-desc">Select student & subject</span>
                  </button>

                  <button onClick={() => setScreen('question-bank')} className="action-tile-btn">
                    <Database size={20} className="action-tile-icon color-orange" />
                    <span className="action-tile-title">Question Bank</span>
                    <span className="action-tile-desc">View subject MCQs bank</span>
                  </button>

                  <button onClick={() => setScreen('reports')} className="action-tile-btn">
                    <FileCheck size={20} className="action-tile-icon color-green" />
                    <span className="action-tile-title">Class Reports</span>
                    <span className="action-tile-desc">View assessment scores</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Activity Logs for my classes */}
            <div className="card activity-feed-card">
              <h3 className="card-title">My Activity Log</h3>
              <div className="activity-timeline">
                {dashboardData.activityLog
                  .filter(l => l.user === 'Teacher' || l.type === 'sync' || l.user === user.name)
                  .map((log) => (
                    <div key={log.id} className="activity-timeline-item">
                      <div className={`activity-icon-badge ${log.type}`}>
                        {log.type === 'attendance' && '📋'}
                        {log.type === 'assessment' && '📝'}
                        {log.type === 'sync' && '🔄'}
                        {log.type === 'student' && '👤'}
                        {log.type === 'question' && '📚'}
                      </div>
                      <div className="activity-log-details">
                        <p className="activity-log-msg">{log.message}</p>
                        <div className="activity-log-meta">
                          <span>{log.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                {dashboardData.activityLog.length === 0 && (
                  <div className="sync-empty-state">
                    <span className="sync-empty-text">No recent activity.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
