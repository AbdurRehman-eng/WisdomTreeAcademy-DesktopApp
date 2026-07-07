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

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [email, setEmail] = useState('');

  const fetchTeachers = async () => {
    if (window.api) {
      const list = await window.api.getTeachers();
      setTeachers(list);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !password) {
      showToast('Please fill in name, username, and passcode.', 'error');
      return;
    }

    const newFaculty = {
      name,
      username: username.toLowerCase().trim(),
      password: password.trim(),
      role,
      email: email.trim() || null
    };

    if (window.api) {
      const res = await window.api.saveTeacher(newFaculty);
      if (res.success) {
        showToast(`Staff member ${name} created locally!`, 'success');
        fetchTeachers();
        refreshSyncInfo();
        setIsModalOpen(false);
        // Reset form
        setName('');
        setUsername('');
        setPassword('');
        setEmail('');
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
        <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={UserPlus}>
          Add Faculty Member
        </Button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table
          data={teachers}
          columns={tableColumns}
          searchPlaceholder="Search staff member name, username, or role..."
          itemsPerPage={6}
        />
      </div>

      {/* Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Faculty Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>Create Faculty Record</Button>
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
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">System Access Passcode</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
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
