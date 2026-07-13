import React, { useState } from 'react';
import './Sidebar.css';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  School,
  Database,
  PlayCircle,
  ClipboardList,
  BarChart3,
  CalendarDays,
  FileText,
  RefreshCw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const { user, activeScreen, setScreen, logout } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  // Sidebar configuration items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['admin', 'teacher'] },
    { id: 'teachers-admins', label: 'Teachers & Admins', icon: ShieldCheck, roles: ['admin'] },
    { id: 'classes-subjects', label: 'Classes & Subjects', icon: School, roles: ['admin'] },
    { id: 'question-bank', label: 'Question Bank', icon: Database, roles: ['admin', 'teacher'] },
    { id: 'assessment-setup', label: 'Assessment Setup', icon: ClipboardList, roles: ['admin', 'teacher'] },
    { id: 'assessment-runner', label: 'Assessment Runner', icon: PlayCircle, roles: ['admin', 'teacher'] },
    { id: 'assessment-results', label: 'Assessment Results', icon: BarChart3, roles: ['admin', 'teacher'] },
    { id: 'attendance', label: 'Attendance', icon: CalendarDays, roles: ['admin', 'teacher'] },
    { id: 'reports', label: 'Reports Center', icon: FileText, roles: ['admin', 'teacher'] },
    { id: 'sync-settings', label: 'Sync & Settings', icon: Sliders, roles: ['admin'] }
  ];

  // Filter items based on user role
  const visibleItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">🌳</div>
        {!isCollapsed && <span className="brand-text">Wisdom Tree</span>}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'console-highlight' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="sidebar-nav-icon" />
              {!isCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
              {!isCollapsed && item.highlight && <span className="sidebar-nav-tag">Web</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="sidebar-footer">
        <button
          onClick={logout}
          className="sidebar-nav-item logout-btn"
          title={isCollapsed ? 'Log Out' : undefined}
        >
          <LogOut size={18} className="sidebar-nav-icon" />
          {!isCollapsed && <span className="sidebar-nav-label">Log Out</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sidebar-collapse-btn"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
