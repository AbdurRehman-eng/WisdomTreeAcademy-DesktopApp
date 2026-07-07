import React, { useState, useEffect } from 'react';
import './AssessmentSetup.css';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import { PlayCircle, ShieldQuestion, HelpCircle } from 'lucide-react';

export const AssessmentSetup = () => {
  const { setScreen, showToast, setActiveAssessment } = useApp();
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isTestChecked, setIsTestChecked] = useState(true);

  // Load setup options from DB on mount
  useEffect(() => {
    const loadSetupData = async () => {
      if (window.api) {
        const clsList = await window.api.getClasses();
        const subList = await window.api.getSubjects();
        const stdList = await window.api.getStudents();
        
        setClasses(clsList);
        setSubjects(subList);
        setAllStudents(stdList);

        if (clsList.length > 0) {
          setSelectedGrade(clsList[0].name);
        }
        if (subList.length > 0) {
          setSelectedSubject(subList[0].name);
        }
      }
    };
    loadSetupData();
  }, []);

  // Filter students based on selected grade
  const gradeStudents = allStudents.filter(s => s.class === selectedGrade);

  // Update selected student when classroom changes
  useEffect(() => {
    if (gradeStudents.length > 0) {
      setSelectedStudentId(gradeStudents[0].id);
    } else {
      setSelectedStudentId('');
    }
  }, [selectedGrade, allStudents]);

  const handleLaunch = () => {
    if (!selectedStudentId) {
      showToast('Please select a student from the classroom roster.', 'error');
      return;
    }

    const studentObj = gradeStudents.find(s => s.id === selectedStudentId);
    if (!studentObj) return;

    setActiveAssessment({
      studentId: studentObj.id,
      studentName: studentObj.name,
      class: selectedGrade,
      subject: selectedSubject,
      enableTts: isTestChecked
    });

    showToast(`Launching assessment for ${studentObj.name} on ${selectedSubject}...`, 'info');
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
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              {classes.length === 0 ? (
                <option value="">No classrooms available</option>
              ) : (
                classes.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Step 2: Select Student Candidate</label>
            <select
              className="form-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {gradeStudents.length === 0 ? (
                <option value="">No students in this class</option>
              ) : (
                gradeStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.roll_number} - {s.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Step 3: Select Assessment Subject</label>
            <select
              className="form-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.length === 0 ? (
                <option value="">No subjects available</option>
              ) : (
                subjects.map(sub => (
                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                ))
              )}
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
