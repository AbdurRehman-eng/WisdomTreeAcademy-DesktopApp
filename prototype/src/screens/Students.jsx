import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockStudents } from '../data/mockData';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { UserPlus, Search, GraduationCap } from 'lucide-react';

export const Students = () => {
  const { showToast, addPendingSyncItem } = useApp();
  const [students, setStudents] = useState(mockStudents);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Grade 1');
  const [parentContact, setParentContact] = useState('');

  const tableColumns = [
    { key: 'id', label: 'Student Roll' },
    { key: 'name', label: 'Name', render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong> },
    { key: 'grade', label: 'Grade' },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="success">Active Registry</Badge>
    },
    {
      key: 'actions',
      label: 'Database Sync',
      render: () => <Badge variant="info">Synced</Badge>
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !parentContact) {
      showToast('Please fill in the student name and parent contact info.', 'error');
      return;
    }

    const newStudent = {
      id: `S${Date.now().toString().slice(-3)}`,
      name,
      grade,
      parentContact
    };

    setStudents([...students, newStudent]);
    addPendingSyncItem('Register Student', `Created student registry for ${name} (${grade})`);
    setIsModalOpen(false);
    showToast(`Registered student ${name} locally! Added 1 item to offline sync queue.`, 'success');

    // Reset
    setName('');
    setParentContact('');
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Student Registry Manager</h1>
          <p className="welcome-subtext">Register student enrollments, modify classroom assignments, and view profiles.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={UserPlus}>
          Register Student
        </Button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table
          data={students}
          columns={tableColumns}
          searchPlaceholder="Search student name, roll number, or classroom..."
          itemsPerPage={8}
        />
      </div>

      {/* Register Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Student"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>Create Student Record</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Timothy Brown"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Grade / Classroom Assignment</label>
            <select className="form-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="Nursery">Nursery</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Guardian Emergency Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. +1 (555) 019-2834"
              value={parentContact}
              onChange={(e) => setParentContact(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Students;
