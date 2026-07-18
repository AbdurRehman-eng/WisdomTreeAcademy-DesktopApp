import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { UserPlus, ClipboardList } from 'lucide-react';

export const TeachersAdmins = () => {
  const { user, showToast, refreshSyncInfo } = useApp();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' or 'audit'

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [accountStatus, setAccountStatus] = useState('active');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const fetchData = async () => {
    if (window.api) {
      const list = await window.api.getTeachers();
      setTeachers(list);
      
      const clsList = await window.api.getClasses();
      setClasses(clsList);
      
      const subjList = await window.api.getSubjects();
      setSubjects(subjList);

      if (['owner', 'admin', 'it_administrator'].includes(user?.role)) {
        const logs = await window.api.getAuditLogs();
        setAuditLogs(logs);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const tableColumns = [
    { key: 'employee_id', label: 'Emp ID', render: (val) => val || 'N/A' },
    { key: 'name', label: 'Name', render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong> },
    { key: 'username', label: 'Username' },
    { key: 'role', label: 'Role', render: (val) => <Badge variant={['owner', 'admin'].includes(val) ? 'warning' : 'primary'}>{val.toUpperCase()}</Badge> },
    { key: 'email', label: 'Email', render: (val) => val || 'N/A' },
    { key: 'phone_number', label: 'Phone', render: (val) => val || 'N/A' },
    { key: 'last_login', label: 'Last Login', render: (val) => val ? new Date(Number(val)).toLocaleString() : 'Never' },
    { key: 'status', label: 'Status', render: (val) => {
        let badgeVariant = 'success';
        if (val === 'suspended') badgeVariant = 'danger';
        else if (val === 'inactive') badgeVariant = 'secondary';
        return <Badge variant={badgeVariant}>{(val || 'active').toUpperCase()}</Badge>;
      } 
    }
  ];

  const auditLogsColumns = [
    { key: 'timestamp', label: 'Time', render: (val) => new Date(Number(val)).toLocaleString() },
    { key: 'user_id', label: 'User ID' },
    { key: 'action', label: 'Action', render: (val) => <Badge variant="primary">{val}</Badge> },
    { key: 'details', label: 'Details' }
  ];

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setIsReadOnly(false);
    setName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhoneNumber('');
    setEmployeeId('');
    setHireDate('');
    setAccountStatus('active');
    setRole('teacher');
    setSelectedClasses([]);
    setSelectedSubjects([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher, readOnly = false) => {
    setEditingTeacher(teacher);
    setIsReadOnly(readOnly);
    setName(teacher.name);
    setUsername(teacher.username);
    setPassword(''); // leave blank to keep unchanged
    setEmail(teacher.email || '');
    setRole(teacher.role);
    setPhoneNumber(teacher.phone_number || '');
    setEmployeeId(teacher.employee_id || '');
    setHireDate(teacher.hire_date || '');
    setAccountStatus(teacher.status || 'active');
    
    // Parse assigned classes/subjects
    let assignedCls = [];
    let assignedSubj = [];
    try {
      assignedCls = JSON.parse(teacher.assigned_classes_json || '[]');
    } catch (e) {}
    try {
      assignedSubj = JSON.parse(teacher.assigned_subjects_json || '[]');
    } catch (e) {}
    setSelectedClasses(assignedCls);
    setSelectedSubjects(assignedSubj);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = async (teacher) => {
    if (teacher.role === 'owner' || teacher.username === 'admin' || teacher.username === 'owner') {
      showToast('Cannot delete the Owner / Super Admin account.', 'error');
      return;
    }
    if (confirm(`WARNING: Are you sure you want to delete staff member "${teacher.name}" (${teacher.role.toUpperCase()})? This will revoke their system access.`)) {
      if (window.api) {
        const res = await window.api.deleteTeacher(teacher.id, user.id);
        if (res.success) {
          showToast(`Staff member "${teacher.name}" deleted successfully.`, 'success');
          fetchData();
          refreshSyncInfo();
        } else {
          showToast(res.error || 'Failed to delete staff member.', 'error');
        }
      }
    }
  };

  const handleClassToggle = (className) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter(c => c !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const handleSubjectToggle = (subjName) => {
    if (selectedSubjects.includes(subjName)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subjName));
    } else {
      setSelectedSubjects([...selectedSubjects, subjName]);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isReadOnly) {
      setIsModalOpen(false);
      setEditingTeacher(null);
      return;
    }

    if (!name || !username || (!editingTeacher && !password)) {
      showToast('Please fill in name, username, and passcode.', 'error');
      return;
    }

    if (editingTeacher && (editingTeacher.role === 'owner' || editingTeacher.username === 'admin' || editingTeacher.username === 'owner')) {
      if (role !== editingTeacher.role || accountStatus !== 'active') {
        showToast('Cannot deactivate or change the role of the Owner / Super Admin account.', 'error');
        return;
      }
    }

    const teacherData = {
      id: editingTeacher ? editingTeacher.id : undefined,
      name,
      username: username.toLowerCase().trim(),
      password: password.trim() || undefined,
      role,
      email: email.trim() || null,
      phone_number: phoneNumber.trim() || null,
      employee_id: employeeId.trim() || null,
      hire_date: hireDate || null,
      assigned_classes_json: JSON.stringify(selectedClasses),
      assigned_subjects_json: JSON.stringify(selectedSubjects),
      status: accountStatus,
      currentUserId: user?.id
    };

    if (window.api) {
      const res = await window.api.saveTeacher(teacherData);
      if (res.success) {
        showToast(editingTeacher ? `Updated staff member "${name}" locally!` : `Staff member "${name}" created locally!`, 'success');
        fetchData();
        refreshSyncInfo();
        setIsModalOpen(false);
        setEditingTeacher(null);
      } else {
        showToast(res.error || 'Failed to save staff member.', 'error');
      }
    }
  };

  const canModify = ['owner', 'admin', 'it_administrator'].includes(user?.role);

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Teachers & Administrators Console</h1>
          <p className="welcome-subtext">Manage school staff registry, assign primary roles, and configure credentials.</p>
        </div>
        {canModify && (
          <Button variant="primary" onClick={handleOpenAdd} icon={UserPlus}>
            Add Faculty Member
          </Button>
        )}
      </div>

      {canModify && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button 
            onClick={() => setActiveTab('registry')}
            className={`tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'registry' ? 'var(--primary-color, #3b82f6)' : 'none',
              color: activeTab === 'registry' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Staff Registry
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'audit' ? 'var(--primary-color, #3b82f6)' : 'none',
              color: activeTab === 'audit' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            System Audit Logs
          </button>
        </div>
      )}

      {activeTab === 'registry' ? (
        <div className="card" style={{ padding: 0 }}>
          <Table
            data={teachers}
            columns={tableColumns}
            searchPlaceholder="Search staff member name, username, or role..."
            itemsPerPage={6}
            onEdit={canModify ? (t) => handleOpenEdit(t, false) : (t) => handleOpenEdit(t, true)}
            onDelete={canModify ? handleDeletePrompt : null}
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <Table
            data={auditLogs}
            columns={auditLogsColumns}
            searchPlaceholder="Search logs by action or details..."
            itemsPerPage={10}
          />
        </div>
      )}

      {/* Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTeacher(null); }}
        title={isReadOnly ? 'Faculty Details (Read Only)' : (editingTeacher ? 'Modify Faculty Details' : 'Register Faculty Member')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingTeacher(null); }}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button variant="primary" onClick={handleSubmit}>
                {editingTeacher ? 'Save Changes' : 'Create Faculty Record'}
              </Button>
            )}
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-md" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Sandra Miller"
              value={name}
              disabled={isReadOnly}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. sandra.miller@wisdomtree.edu"
              value={email}
              disabled={isReadOnly}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. +1 555-0199"
              value={phoneNumber}
              disabled={isReadOnly}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Employee ID (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. EMP-9021"
              value={employeeId}
              disabled={isReadOnly}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hire Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={hireDate}
              disabled={isReadOnly}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">System Access Role</label>
            <select className="form-select" value={role} disabled={isReadOnly || (editingTeacher && (editingTeacher.role === 'owner' || editingTeacher.username === 'admin'))} onChange={(e) => setRole(e.target.value)}>
              <option value="teacher">Classroom Teacher</option>
              <option value="owner">Owner</option>
              <option value="admin">System Administrator</option>
              <option value="it_administrator">IT Administrator</option>
              <option value="head_teacher">Head Teacher</option>
              <option value="accountant">Accountant</option>
              <option value="secretary">Secretary</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Account Status</label>
            <select className="form-select" value={accountStatus} disabled={isReadOnly || (editingTeacher && (editingTeacher.role === 'owner' || editingTeacher.username === 'admin'))} onChange={(e) => setAccountStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. sandra.teach"
              value={username}
              disabled={!!editingTeacher || isReadOnly}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {!isReadOnly && (
            <div className="form-group">
              <label className="form-label">System Access Passcode</label>
              <input
                type="password"
                className="form-input"
                placeholder={editingTeacher ? 'Leave blank to keep unchanged' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {/* Teacher Assignments section */}
          {role === 'teacher' && (
            <>
              <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <label className="form-label" style={{ fontWeight: 'bold' }}>Assigned Classes</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  {classes.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedClasses.includes(c.name)}
                        disabled={isReadOnly}
                        onChange={() => handleClassToggle(c.name)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 'bold' }}>Assigned Subjects</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  {subjects.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedSubjects.includes(s.name)}
                        disabled={isReadOnly}
                        onChange={() => handleSubjectToggle(s.name)}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default TeachersAdmins;
