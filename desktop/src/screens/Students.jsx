import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { UserPlus } from 'lucide-react';

export const Students = () => {
  const { showToast, refreshSyncInfo } = useApp();
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [grades, setGrades] = useState([]);

  const fetchStudents = async () => {
    if (window.api) {
      const list = await window.api.getStudents();
      // Map DB class to grade so Table column config matches
      const mapped = list.map(s => ({
        ...s,
        grade: s.class,
        syncBadge: s.sync_status === 'synced' ? 'Synced' : 'Pending Sync'
      }));
      setStudents(mapped);
    }
  };

  useEffect(() => {
    fetchStudents();
    const loadGrades = async () => {
      if (window.api) {
        const clsList = await window.api.getClasses();
        const names = clsList.map(c => c.name);
        setGrades(names);
        if (names.length > 0) {
          setGrade(names[0]);
        }
      }
    };
    loadGrades();
  }, []);

  const tableColumns = [
    { key: 'roll_number', label: 'Student Roll' },
    { key: 'name', label: 'Name', render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong> },
    { key: 'grade', label: 'Grade / Class' },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="success">Active Registry</Badge>
    },
    {
      key: 'syncBadge',
      label: 'Database Sync',
      render: (val) => <Badge variant={val === 'Synced' ? 'success' : 'warning'}>{val}</Badge>
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !rollNumber) {
      showToast('Please fill in the student name and roll number.', 'error');
      return;
    }

    const newStudent = {
      name,
      roll_number: rollNumber,
      class: grade
    };

    if (window.api) {
      const res = await window.api.saveStudent(newStudent);
      if (res.success) {
        showToast(`Registered student ${name} locally!`, 'success');
        fetchStudents();
        refreshSyncInfo();
        setIsModalOpen(false);
        // Reset form
        setName('');
        setRollNumber('');
      } else {
        showToast(res.error || 'Failed to save student.', 'error');
      }
    }
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
            <label className="form-label">Roll Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. WTA-0932"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Grade / Classroom Assignment</label>
            <select className="form-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Students;
