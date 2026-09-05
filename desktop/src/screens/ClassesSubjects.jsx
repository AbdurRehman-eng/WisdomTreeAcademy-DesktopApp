import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { Landmark, BookOpen, Plus, Edit2, Trash2, Archive } from 'lucide-react';

export const ClassesSubjects = () => {
  const { showToast, refreshSyncInfo } = useApp();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Modal open states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  
  // Editing target state
  const [editingClass, setEditingClass] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

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

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassName('');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    if (e) e.preventDefault();
    if (!className.trim()) {
      showToast('Please enter a classroom name.', 'error');
      return;
    }

    if (window.api) {
      const payload = {
        id: editingClass ? editingClass.id : undefined,
        name: className.trim(),
        status: editingClass ? (editingClass.status || 'active') : 'active'
      };
      const res = await window.api.saveClass(payload);
      if (res.success) {
        showToast(editingClass ? `Updated class "${className}"` : `Created class "${className}"`, 'success');
        fetchData();
        refreshSyncInfo();
        setIsClassModalOpen(false);
        setClassName('');
        setEditingClass(null);
      } else {
        showToast(res.error || 'Failed to save class.', 'error');
      }
    }
  };

  const handleDeleteClass = async (cls) => {
    if (confirm(`Are you sure you want to delete classroom "${cls.name}"? This action cannot be undone.`)) {
      if (window.api) {
        const res = await window.api.deleteClass(cls.id);
        if (res.success) {
          showToast(`Deleted classroom "${cls.name}".`, 'success');
          fetchData();
          refreshSyncInfo();
        } else {
          showToast(res.error || 'Failed to delete classroom.', 'error');
        }
      }
    }
  };

  const handleArchiveClass = async (cls) => {
    const nextStatus = cls.status === 'archived' ? 'active' : 'archived';
    if (window.api) {
      const res = await window.api.saveClass({ id: cls.id, name: cls.name, status: nextStatus });
      if (res.success) {
        showToast(`${nextStatus === 'archived' ? 'Archived' : 'Reactivated'} classroom "${cls.name}".`, 'success');
        fetchData();
        refreshSyncInfo();
      } else {
        showToast(res.error || 'Failed to update classroom status.', 'error');
      }
    }
  };

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectName('');
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub) => {
    setEditingSubject(sub);
    setSubjectName(sub.name);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    if (e) e.preventDefault();
    if (!subjectName.trim()) {
      showToast('Please enter a subject name.', 'error');
      return;
    }

    if (window.api) {
      const payload = {
        id: editingSubject ? editingSubject.id : undefined,
        name: subjectName.trim(),
        status: editingSubject ? (editingSubject.status || 'active') : 'active'
      };
      const res = await window.api.saveSubject(payload);
      if (res.success) {
        showToast(editingSubject ? `Updated subject "${subjectName}"` : `Created subject "${subjectName}"`, 'success');
        fetchData();
        refreshSyncInfo();
        setIsSubjectModalOpen(false);
        setSubjectName('');
        setEditingSubject(null);
      } else {
        showToast(res.error || 'Failed to save subject.', 'error');
      }
    }
  };

  const handleDeleteSubject = async (sub) => {
    if (confirm(`Are you sure you want to delete subject "${sub.name}"? This action cannot be undone.`)) {
      if (window.api) {
        const res = await window.api.deleteSubject(sub.id);
        if (res.success) {
          showToast(`Deleted subject "${sub.name}".`, 'success');
          fetchData();
          refreshSyncInfo();
        } else {
          showToast(res.error || 'Failed to delete subject.', 'error');
        }
      }
    }
  };

  const handleArchiveSubject = async (sub) => {
    const nextStatus = sub.status === 'archived' ? 'active' : 'archived';
    if (window.api) {
      const res = await window.api.saveSubject({ id: sub.id, name: sub.name, status: nextStatus });
      if (res.success) {
        showToast(`${nextStatus === 'archived' ? 'Archived' : 'Reactivated'} subject "${sub.name}".`, 'success');
        fetchData();
        refreshSyncInfo();
      } else {
        showToast(res.error || 'Failed to update subject status.', 'error');
      }
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Classrooms &amp; Curriculum Manager</h1>
          <p className="welcome-subtext">Define grade structures, map educational subjects, and manage curriculum offerings.</p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={handleOpenAddSubject} icon={BookOpen}>
            Add Subject
          </Button>
          <Button variant="primary" onClick={handleOpenAddClass} icon={Plus}>
            Add Classroom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-lg">
        {/* Classrooms List */}
        <div className="card">
          <h3 className="card-title flex items-center gap-sm">
            <Landmark className="color-primary" size={20} />
            <span>Classrooms / Grade Levels</span>
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
                    borderRadius: '8px',
                    opacity: cls.status === 'archived' ? 0.6 : 1
                  }}
                >
                  <div className="flex items-center gap-sm">
                    <span style={{ fontWeight: '600', textDecoration: cls.status === 'archived' ? 'line-through' : 'none' }}>{cls.name}</span>
                    {cls.status === 'archived' && <Badge variant="secondary">Archived</Badge>}
                    <Badge variant={cls.sync_status === 'synced' ? 'success' : 'warning'}>
                      {cls.sync_status === 'synced' ? 'Synced' : 'Pending'}
                    </Badge>
                  </div>

                  <div className="flex gap-xs items-center">
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                      title="Edit Classroom Name"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleArchiveClass(cls)}
                      style={{ background: 'none', border: 'none', color: cls.status === 'archived' ? 'var(--color-success, #22c55e)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                      title={cls.status === 'archived' ? 'Reactivate Classroom' : 'Archive Classroom'}
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Delete Classroom"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                    borderRadius: '8px',
                    opacity: sub.status === 'archived' ? 0.6 : 1
                  }}
                >
                  <div className="flex items-center gap-sm">
                    <span style={{ fontWeight: '600', textDecoration: sub.status === 'archived' ? 'line-through' : 'none' }}>{sub.name}</span>
                    {sub.status === 'archived' && <Badge variant="secondary">Archived</Badge>}
                    <Badge variant={sub.sync_status === 'synced' ? 'success' : 'warning'}>
                      {sub.sync_status === 'synced' ? 'Synced' : 'Pending'}
                    </Badge>
                  </div>

                  <div className="flex gap-xs items-center">
                    <button
                      onClick={() => handleOpenEditSubject(sub)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                      title="Edit Subject Name"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleArchiveSubject(sub)}
                      style={{ background: 'none', border: 'none', color: sub.status === 'archived' ? 'var(--color-success, #22c55e)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                      title={sub.status === 'archived' ? 'Reactivate Subject' : 'Archive Subject'}
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Delete Subject"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
        title={editingClass ? "Edit Classroom" : "Add New Classroom"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveClass}>{editingClass ? "Save Changes" : "Create Classroom"}</Button>
          </>
        }
      >
        <form onSubmit={handleSaveClass} className="form-group">
          <label className="form-label">Classroom Name / Grade</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Pre-K, Kindergarten, Grade 6"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? "Edit Subject" : "Add New Subject"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSubjectModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveSubject}>{editingSubject ? "Save Changes" : "Create Subject"}</Button>
          </>
        }
      >
        <form onSubmit={handleSaveSubject} className="form-group">
          <label className="form-label">Subject Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Mathematics, Phonics, Science"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default ClassesSubjects;
