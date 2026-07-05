import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockTeachers } from '../data/mockData';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { UserPlus, ShieldAlert } from 'lucide-react';

export const TeachersAdmins = () => {
  const { showToast, addPendingSyncItem } = useApp();
  const [teachers, setTeachers] = useState(mockTeachers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('teacher');
  const [subjects, setSubjects] = useState('');

  const tableColumns = [
    { key: 'id', label: 'Faculty ID' },
    { key: 'name', label: 'Name', render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong> },
    { key: 'role', label: 'Role', render: (val) => <Badge variant={val === 'admin' ? 'warning' : 'primary'}>{val.toUpperCase()}</Badge> },
    { key: 'assignedClasses', label: 'Classes & subjects', render: (val) => val ? val.join(', ') : 'N/A' },
    { key: 'status', label: 'Status', render: () => <Badge variant="success">Active</Badge> }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !subjects) {
      showToast('Please fill in faculty name and class assignments.', 'error');
      return;
    }

    const newFaculty = {
      id: `F${Date.now().toString().slice(-3)}`,
      name,
      role,
      assignedClasses: [subjects]
    };

    setTeachers([...teachers, newFaculty]);
    addPendingSyncItem('Register Faculty', `Onboarded ${name} as ${role}`);
    setIsModalOpen(false);
    showToast(`Staff member ${name} created locally! Added 1 item to offline sync queue.`, 'success');

    // Reset
    setName('');
    setSubjects('');
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Teachers & Administrators Console</h1>
          <p className="welcome-subtext">Manage school staff registry, assign primary class teachers, and configure credentials.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={UserPlus}>
          Add Faculty Member
        </Button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table
          data={teachers}
          columns={tableColumns}
          searchPlaceholder="Search staff member name, role, or class..."
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
            <label className="form-label">System Access Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="teacher">Classroom Teacher</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Classes / Subjects</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Grade 1 Reading, Nursery Literacy"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeachersAdmins;
