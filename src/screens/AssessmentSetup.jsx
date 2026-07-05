import React, { useState } from 'react';
import './AssessmentSetup.css';
import { useApp } from '../context/AppContext';
import { mockStudents } from '../data/mockData';
import Button from '../components/common/Button';
import { PlayCircle, ShieldQuestion, HelpCircle, CheckSquare } from 'lucide-react';

export const AssessmentSetup = () => {
  const { setScreen, showToast } = useApp();
  const [selectedGrade, setSelectedGrade] = useState('Grade 1');
  
  // Filter students based on selected grade
  const gradeStudents = mockStudents.filter(s => s.grade === selectedGrade);
  
  const [selectedStudent, setSelectedStudent] = useState(gradeStudents[0]?.name || '');
  const [subject, setSubject] = useState('Basic Math');
  const [isTestChecked, setIsTestChecked] = useState(true);

  const handleLaunch = () => {
    if (!selectedStudent) {
      showToast('Please select a student from the classroom roster.', 'error');
      return;
    }

    showToast(`Launching assessment for ${selectedStudent} on ${subject}...`, 'info');
    // Lock into child-friendly full viewport assessment runner
    setScreen('assessment-runner');
  };

  return (
    <div className="page-container assessment-setup-page fade-in">
      <div className="setup-heading-section" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '8px' }}>
        <h1 className="welcome-heading">Setup Diagnostic Assessment</h1>
        <p className="welcome-subtext">Configure active assessment sessions for individual students using offline question presets.</p>
      </div>

      <div className="setup-workspace-grid">
        {/* Configuration Card */}
        <div className="card config-card">
          <h3 className="card-title">Session Parameters</h3>

          <div className="form-group">
            <label className="form-label">Step 1: Select Classroom / Grade</label>
            <select
              className="form-select"
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                // Reset student to the first in the new list
                const filtered = mockStudents.filter(s => s.grade === e.target.value);
                setSelectedStudent(filtered[0]?.name || '');
              }}
            >
              <option value="Nursery">Nursery</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Step 2: Select Student Candidate</label>
            <select
              className="form-select"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {gradeStudents.map(s => (
                <option key={s.id} value={s.name}>{s.id} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Step 3: Select Assessment Subject</label>
            <select
              className="form-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="Basic Math">Basic Math (Grade 1 level)</option>
              <option value="English Literacy">English Literacy (Grade 1 level)</option>
              <option value="Advanced Math">Advanced Math (Grade 2 level)</option>
              <option value="Environmental Studies">Environmental Studies</option>
            </select>
          </div>

          <div className="checkbox-form-item">
            <input
              type="checkbox"
              id="audio-helper-cb"
              checked={isTestChecked}
              onChange={(e) => setIsTestChecked(e.target.checked)}
              className="checkbox-widget"
            />
            <label htmlFor="audio-helper-cb" className="checkbox-label">
              Enable Text-To-Speech (TTS) voice reading prompts
            </label>
          </div>

          <Button
            variant="primary"
            onClick={handleLaunch}
            icon={PlayCircle}
            style={{ width: '100%', padding: '12px 20px', fontSize: '15px', marginTop: '10px' }}
          >
            Launch Active Assessment
          </Button>
        </div>

        {/* Info Helper Panel */}
        <div className="card info-card flex flex-col gap-md">
          <div className="flex items-center gap-sm color-primary">
            <ShieldQuestion size={22} />
            <h3 className="card-title" style={{ marginBottom: 0 }}>Offline Guidelines</h3>
          </div>
          
          <div className="guidelines-list">
            <div className="guideline-item">
              <span className="guideline-num">1</span>
              <p className="guideline-txt">Ensure headphones are plugged in if conducting testing in a busy classroom environment.</p>
            </div>
            <div className="guideline-item">
              <span className="guideline-num">2</span>
              <p className="guideline-txt">Let the student sit comfortably. You should remain nearby to observe assessment mechanics.</p>
            </div>
            <div className="guideline-item">
              <span className="guideline-num">3</span>
              <p className="guideline-txt">Assessment scores and answers will be saved to local storage instantly, sync pending.</p>
            </div>
          </div>

          <div className="help-box">
            <HelpCircle size={16} className="help-box-icon" />
            <span className="help-box-text">Having microphone issues? Verify system audio devices in Local Settings.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSetup;
