import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockClasses } from '../data/mockData';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { School, BookOpen, Plus, Landmark } from 'lucide-react';

export const ClassesSubjects = () => {
  const { showToast } = useApp();
  const [classList, setClassList] = useState(mockClasses);

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Classrooms & Subjects Manager</h1>
          <p className="welcome-subtext">Define grade structures, map educational subjects, and link primary instructors.</p>
        </div>
        <Button variant="primary" onClick={() => showToast('Classroom creation is restricted in this demo.', 'warning')} icon={Plus}>
          Add Classroom
        </Button>
      </div>

      <div className="grid grid-cols-3">
        {classList.map((cls) => (
          <div key={cls.id} className="card flex flex-col gap-md" style={{ position: 'relative' }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-sm">
                <Landmark size={20} className="color-primary" />
                <h3 className="card-title" style={{ marginBottom: 0 }}>{cls.name}</h3>
              </div>
              <Badge variant="primary">{cls.studentsCount} Students</Badge>
            </div>

            <div style={{ fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Primary Instructor:</strong>
              <div style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>{cls.teacher}</div>
            </div>

            <div style={{ fontSize: '13px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Curriculum Subjects:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {cls.subjects.map((sub, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '11px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-sm" style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <Button variant="secondary" onClick={() => showToast(`Opening schedule planner for ${cls.name}`, 'info')} style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}>
                Schedule
              </Button>
              <Button variant="secondary" onClick={() => showToast(`Loading curriculum materials for ${cls.name}`, 'info')} style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}>
                Materials
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassesSubjects;
