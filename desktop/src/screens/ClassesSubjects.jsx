import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { Landmark, BookOpen, Plus } from 'lucide-react';

export const ClassesSubjects = () => {
  const { showToast, refreshSyncInfo } = useApp();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Form states
  const [className, setClassName] = useState('');
  const [subjectName, setSubjectName] = useState('');

  const fetchData = async () => {
    if (window.api) {
      const clsList = await window.api.getClasses();
      const subList = await window.api.getSubjects();
      setClasses(clsList);
      setSubjects(subList);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!className.trim()) {
      showToast('Please enter a classroom name.', 'error');
      return;
    }

    if (window.api) {
      const res = await window.api.saveClass({ name: className.trim() });
      if (res.success) {
        showToast(`Created class "${className}" locally!`, 'success');
        fetchData();
        refreshSyncInfo();
        setIsClassModalOpen(false);
        setClassName('');
      } else {
        showToast(res.error || 'Failed to create class.', 'error');
      }
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      showToast('Please enter a subject name.', 'error');
      return;
    }

    if (window.api) {
      const res = await window.api.saveSubject({ name: subjectName.trim() });
      if (res.success) {
        showToast(`Created subject "${subjectName}" locally!`, 'success');
        fetchData();
        refreshSyncInfo();
        setIsSubjectModalOpen(false);
        setSubjectName('');
      } else {
        showToast(res.error || 'Failed to create subject.', 'error');
      }
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Classrooms & Curriculum Manager</h1>
          <p className="welcome-subtext">Define grade structures, map educational subjects, and manage curriculum offerings.</p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={() => setIsSubjectModalOpen(true)} icon={BookOpen}>
            Add Subject
          </Button>
          <Button variant="primary" onClick={() => setIsClassModalOpen(true)} icon={Plus}>
            Add Classroom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-lg">
        {/* Classrooms List */}
        <div className="card">
          <h3 className="card-title flex items-center gap-sm">
            <Landmark className="color-primary" size={20} />
            <span>Active Classrooms / Grades</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            {classes.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No classrooms defined yet.</p>
            ) : (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex justify-between items-center"
                  style={{
                    padding: '12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{cls.name}</span>
                  <Badge variant={cls.sync_status === 'synced' ? 'success' : 'warning'}>
                    {cls.sync_status === 'synced' ? 'Synced' : 'Pending'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subjects List */}
        <div className="card">
          <h3 className="card-title flex items-center gap-sm">
            <BookOpen className="color-accent" size={20} />
            <span>Curriculum Subjects</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            {subjects.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No subjects defined yet.</p>
            ) : (
              subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="flex justify-between items-center"
                  style={{
                    padding: '12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{sub.name}</span>
                  <Badge variant={sub.sync_status === 'synced' ? 'success' : 'warning'}>
                    {sub.sync_status === 'synced' ? 'Synced' : 'Pending'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Classroom Modal */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Add New Classroom"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddClass}>Create Classroom</Button>
          </>
        }
      >
        <form onSubmit={handleAddClass} className="form-group">
          <label className="form-label">Classroom Name / Grade</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Grade 6 Alpha"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Add New Subject"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSubjectModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddSubject}>Create Subject</Button>
          </>
        }
      >
        <form onSubmit={handleAddSubject} className="form-group">
          <label className="form-label">Subject Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Geography, World History"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default ClassesSubjects;
