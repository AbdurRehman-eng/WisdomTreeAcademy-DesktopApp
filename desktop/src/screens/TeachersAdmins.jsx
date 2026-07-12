import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { UserPlus } from 'lucide-react';

export const TeachersAdmins = () => {
  const { showToast, refreshSyncInfo } = useApp();
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [email, setEmail] = useState('');

  const fetchTeachers = async () => {
    if (window.api) {
      const list = await window.api.getTeachers();
      // Filter out deleted staff members
      const active = list.filter(t => t.status !== 'deleted');
      setTeachers(active);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const tableColumns = [
    { key: 'id', label: 'Faculty ID' },
    { key: 'name', label: 'Name', render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong> },
    { key: 'username', label: 'Username' },
    { key: 'role', label: 'Role', render: (val) => <Badge variant={val === 'admin' ? 'warning' : 'primary'}>{val.toUpperCase()}</Badge> },
    { key: 'email', label: 'Email', render: (val) => val || 'N/A' },
    { key: 'status', label: 'Status', render: () => <Badge variant="success">Active</Badge> }
  ];

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setRole('teacher');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setUsername(teacher.username);
    setPassword(''); // leave blank to keep unchanged
    setEmail(teacher.email || '');
    setRole(teacher.role);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = async (teacher) => {
    if (confirm(`WARNING: Are you sure you want to delete staff member "${teacher.name}" (${teacher.role.toUpperCase()})? This will revoke their system access.`)) {
      if (window.api) {
        const res = await window.api.deleteTeacher(teacher.id);
        if (res.success) {
          showToast(`Staff member "${teacher.name}" deleted successfully.`, 'success');
          fetchTeachers();
          refreshSyncInfo();
        } else {
          showToast('Failed to delete staff member.', 'error');
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name || !username || (!editingTeacher && !password)) {
      showToast('Please fill in name, username, and passcode.', 'error');
      return;
    }

    const teacherData = {
      id: editingTeacher ? editingTeacher.id : undefined,
      name,
      username: username.toLowerCase().trim(),
      password: password.trim() || undefined,
      role,
      email: email.trim() || null
    };

    if (window.api) {
      const res = await window.api.saveTeacher(teacherData);
      if (res.success) {
        showToast(editingTeacher ? `Updated staff member "${name}" locally!` : `Staff member "${name}" created locally!`, 'success');
        fetchTeachers();
        refreshSyncInfo();
        setIsModalOpen(false);
        // Reset form
        setName('');
        setUsername('');
        setPassword('');
        setEmail('');
        setEditingTeacher(null);
      } else {
        showToast(res.error || 'Failed to save staff member.', 'error');
      }
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Teachers & Administrators Console</h1>
          <p className="welcome-subtext">Manage school staff registry, assign primary roles, and configure credentials.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd} icon={UserPlus}>
          Add Faculty Member
        </Button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table
          data={teachers}
          columns={tableColumns}
          searchPlaceholder="Search staff member name, username, or role..."
          itemsPerPage={6}
          onEdit={handleOpenEdit}
          onDelete={handleDeletePrompt}
        />
      </div>

      {/* Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTeacher(null); }}
        title={editingTeacher ? 'Modify Faculty Details' : 'Register Faculty Member'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingTeacher(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>{editingTeacher ? 'Save Changes' : 'Create Faculty Record'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Sandra Miller"
              value={name}
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
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">System Access Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="teacher">Classroom Teacher</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. sandra.teach"
              value={username}
              disabled={!!editingTeacher}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

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
        </form>
      </Modal>
    </div>
  );
};

export default TeachersAdmins;
