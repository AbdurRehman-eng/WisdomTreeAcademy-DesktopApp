import React, { useState, useEffect, useRef } from 'react';
import './QuestionBank.css';
import { useApp } from '../context/AppContext';
import AudioControl from '../components/common/AudioControl';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Download, Upload, Filter, Mic, Square, Play } from 'lucide-react';
import useTTS from '../hooks/useTTS';

export const QuestionBank = () => {
  const { user, showToast, refreshSyncInfo } = useApp();
  const csvFileInputRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal forms states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [formGrade, setFormGrade] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [imagePath, setImagePath] = useState('');

  // Version History Modal states
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [selectedQuestionVersions, setSelectedQuestionVersions] = useState([]);
  const [versionQuestionText, setVersionQuestionText] = useState('');

  // Mock audio recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [audioPlaybackActive, setAudioPlaybackActive] = useState(false);

  const tts = useTTS(newQuestionText);

  const handleTestPlayback = () => {
    if (!newQuestionText.trim()) {
      showToast('Please enter question text before testing playback.', 'warning');
      return;
    }
    tts.speak();
  };

  // Filters mapping
  const [gradesList, setGradesList] = useState(['All']);
  const [subjectsList, setSubjectsList] = useState(['All']);
  const difficultiesList = ['All', 'Easy', 'Medium', 'Hard'];
  const statusList = ['All', 'approved', 'pending', 'archived'];

  const fetchQuestions = async () => {
    if (window.api) {
      const list = await window.api.getQuestions({ includeAll: true });
      const mapped = list.map(q => ({
        id: q.id,
        grade: q.class,
        subject: q.subject,
        difficulty: 'Medium', // Fallback
        text: q.text,
        options: q.options,
        correct: q.correct_answer,
        audioText: q.audio_text || q.text,
        image_path: q.image_path,
        is_approved: q.approval_status === 'approved',
        status: q.status === 'archived' ? 'archived' : (q.approval_status === 'pending_approval' ? 'pending' : 'approved')
      }));
      setQuestions(mapped);
    }
  };

  const handleSelectImage = async () => {
    if (window.api) {
      const res = await window.api.selectImage();
      if (res.success) {
        setImagePath(res.dataUrl);
        showToast('Image attached successfully.', 'success');
      } else if (res.error && res.error !== 'Cancelled') {
        showToast(`Image selection failed: ${res.error}`, 'error');
      }
    }
  };

  useEffect(() => {
    const loadSetupData = async () => {
      if (window.api) {
        const clsList = await window.api.getClasses();
        const subList = await window.api.getSubjects();
        const gNames = clsList.map(c => c.name);
        const sNames = subList.map(s => s.name);
        setGradesList(['All', ...gNames]);
        setSubjectsList(['All', ...sNames]);
        if (gNames.length > 0) setFormGrade(gNames[0]);
        if (sNames.length > 0) setFormSubject(sNames[0]);
      }
    };
    loadSetupData();
    fetchQuestions();
  }, []);

  const filteredQuestions = questions.filter(q => {
    const matchGrade = selectedGrade === 'All' || q.grade === selectedGrade;
    const matchSubject = selectedSubject === 'All' || q.subject === selectedSubject;
    const matchDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    const matchStatus = selectedStatus === 'All' || q.status === selectedStatus;
    return matchGrade && matchSubject && matchDiff && matchStatus;
  });

  const handleRecordToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setHasRecordedAudio(false);
      showToast('Recording audio prompt... Speak into the microphone.', 'info');
      setTimeout(() => {
        setIsRecording(false);
        setHasRecordedAudio(true);
        showToast('Voice recording completed successfully!', 'success');
      }, 4000);
    } else {
      setIsRecording(false);
      setHasRecordedAudio(true);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestionText || !optA || !optB || !optC || !optD) {
      showToast('Please fill in the question text and all four MCQ options.', 'error');
      return;
    }

    const newQ = {
      class: formGrade,
      subject: formSubject,
      text: newQuestionText,
      audioText: newQuestionText,
      options: [optA, optB, optC, optD],
      correct_answer: correctOpt,
      image_path: imagePath || null,
      currentUserId: user?.id
    };

    if (window.api) {
      const res = await window.api.saveQuestion(newQ);
      if (res.success) {
        showToast('Question registered in Local Bank successfully.', 'success');
        fetchQuestions();
        refreshSyncInfo();
        setIsAddModalOpen(false);

        // Reset Form
        setNewQuestionText('');
        setOptA('');
        setOptB('');
        setOptC('');
        setOptD('');
        setCorrectOpt('A');
        setHasRecordedAudio(false);
        setImagePath('');
      } else {
        showToast(res.error || 'Failed to save question.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to permanently delete this question? This action is irreversible.')) {
      if (window.api) {
        const res = await window.api.deleteQuestion(id, user?.id);
        if (res.success) {
          showToast(`Question deleted permanently.`, 'success');
          fetchQuestions();
          refreshSyncInfo();
        } else {
          showToast(res.error || 'Failed to delete question.', 'error');
        }
      }
    }
  };

  const handleArchive = async (id) => {
    if (confirm('Are you sure you want to archive this question? It will no longer be active for student assessments.')) {
      if (window.api) {
        const res = await window.api.archiveQuestion(id, user?.id);
        if (res.success) {
          showToast('Question archived successfully.', 'success');
          fetchQuestions();
          refreshSyncInfo();
        } else {
          showToast(res.error || 'Failed to archive question.', 'error');
        }
      }
    }
  };

  const handleApprove = async (id) => {
    if (window.api) {
      const res = await window.api.approveQuestion(id, user?.id);
      if (res.success) {
        showToast('Question approved successfully.', 'success');
        fetchQuestions();
        refreshSyncInfo();
      } else {
        showToast(res.error || 'Failed to approve question.', 'error');
      }
    }
  };

  const handleViewVersions = async (q) => {
    if (window.api) {
      const versions = await window.api.getQuestionVersions(q.id);
      setSelectedQuestionVersions(versions);
      setVersionQuestionText(q.text);
      setIsVersionModalOpen(true);
    }
  };

  // Parse a CSV string into an array of row objects
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    // Skip header row (index 0)
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Handle quoted fields (fields that contain commas)
      const cols = [];
      let inQuote = false;
      let current = '';
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') {
          inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
          cols.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      cols.push(current.trim());
      if (cols.length < 8) continue; // skip malformed rows
      const [cls, subject, text, option_a, option_b, option_c, option_d, correct_answer, audio_text] = cols;
      const correctUpper = correct_answer?.toUpperCase();
      if (!['A','B','C','D'].includes(correctUpper)) continue;
      rows.push({
        class: cls,
        subject,
        text,
        options: [option_a, option_b, option_c, option_d],
        correct: correctUpper,
        audioText: audio_text || text
      });
    }
    return rows;
  };

  const triggerImportCSV = () => {
    csvFileInputRef.current?.click();
  };

  const handleCSVFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        showToast('No valid questions found in the CSV file. Check the format.', 'error');
        return;
      }
      if (window.api) {
        // Pass currentUserId for audit logs
        const rowsWithUser = rows.map(r => ({ ...r, currentUserId: user?.id }));
        const res = await window.api.importQuestions(rowsWithUser);
        if (res.success) {
          showToast(`Successfully imported ${rows.length} question(s) into the local bank.`, 'success');
          fetchQuestions();
          refreshSyncInfo();
        } else {
          showToast(res.error || 'Import failed.', 'error');
        }
      } else {
        // Web preview fallback
        showToast(`Parsed ${rows.length} question(s) (web preview — not saved).`, 'info');
      }
    };
    reader.onerror = () => showToast('Failed to read the CSV file.', 'error');
    reader.readAsText(file);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'approved':
        return { display: 'inline-block', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', textTransform: 'uppercase', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' };
      case 'pending':
        return { display: 'inline-block', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', textTransform: 'uppercase', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.2)' };
      case 'archived':
        return { display: 'inline-block', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', textTransform: 'uppercase', backgroundColor: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.2)' };
      default:
        return {};
    }
  };

  return (
    <div className="page-container question-bank-page fade-in">
      {/* Top action bar */}
      <div className="qb-top-actions">
        <div className="qb-heading-block">
          <h1 className="qb-main-title">Question Bank</h1>
          <p className="qb-sub-title">Configure assessments, audit MCQ pools, and record audio read-aloud prompts.</p>
        </div>

        <div className="qb-actions-group">
          {/* Hidden file input for CSV import */}
          <input
            type="file"
            accept=".csv,text/csv"
            ref={csvFileInputRef}
            style={{ display: 'none' }}
            onChange={handleCSVFileSelected}
          />
          <Button variant="secondary" onClick={triggerImportCSV} icon={Upload}>
            Import CSV Template
          </Button>
          <a
            href="/templates/sample_questions.csv"
            download="sample_questions.csv"
            className="csv-download-link"
          >
            <Download size={14} style={{ marginRight: '6px' }} />
            Get Template
          </a>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} icon={Plus}>
            Add Question
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout (Split Pane) */}
      <div className="qb-workspace-split">
        {/* Left Filter Panel */}
        <aside className="qb-filters-panel card">
          <div className="filter-panel-header">
            <Filter size={16} />
            <h3 className="filter-title">Filter Bank</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Target Grade Level</label>
            <div className="filter-badge-list">
              {gradesList.map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`filter-pill ${selectedGrade === grade ? 'active' : ''}`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject Category</label>
            <select
              className="form-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjectsList.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty Rating</label>
            <select
              className="form-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              {difficultiesList.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Approval Status</label>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusList.map(st => (
                <option key={st} value={st}>{st === 'All' ? 'All' : st.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="filter-stats-card">
            <span className="stats-header">Question Pool Summary</span>
            <div className="stats-row">
              <span className="stats-label">Total Questions</span>
              <span className="stats-value">{questions.length}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Filtered Matches</span>
              <span className="stats-value highlight">{filteredQuestions.length}</span>
            </div>
          </div>
        </aside>

        {/* Right Questions List */}
        <main className="qb-list-section">
          {filteredQuestions.length > 0 ? (
            <div className="questions-grid-list">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="card question-preview-card fade-in">
                  <div className="qp-card-header">
                    <div className="qp-badge-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="qp-badge qp-badge-grade">{q.grade}</span>
                      <span className="qp-badge qp-badge-subject">{q.subject}</span>
                      <span style={getStatusBadgeStyle(q.status)}>
                        {q.status}
                      </span>
                    </div>
                    <span className={`qp-difficulty-tag diff-${q.difficulty.toLowerCase()}`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <p className="qp-question-text">{q.text}</p>

                  {q.image_path && (
                    <div className="qp-question-image-container" style={{ margin: '12px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '200px', display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                      <img src={q.image_path.startsWith('data:') ? q.image_path : `media://${q.image_path}`} alt="Question visual prompt" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                    </div>
                  )}

                  {/* MCQ choices */}
                  <div className="qp-mcq-grid">
                    {q.options.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const isCorrect = letter === q.correct;
                      return (
                        <div key={oIdx} className={`qp-mcq-option ${isCorrect ? 'correct' : ''}`}>
                          <span className="qp-option-letter">{letter}</span>
                          <span className="qp-option-text">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Audio Controls */}
                  <div className="qp-card-footer">
                    <AudioControl audioText={q.audioText} />
                    <div className="qp-actions-links" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        style={{ color: 'var(--primary-color, #3b82f6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} 
                        onClick={() => handleViewVersions(q)}
                      >
                        History
                      </button>
                      
                      {q.status === 'pending' && ['owner', 'admin', 'head_teacher'].includes(user?.role) && (
                        <button 
                          type="button" 
                          style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }} 
                          onClick={() => handleApprove(q.id)}
                        >
                          Approve
                        </button>
                      )}

                      {user?.role === 'owner' ? (
                        <button 
                          type="button" 
                          className="qp-action-btn-link delete" 
                          onClick={() => handleDelete(q.id)}
                        >
                          Delete
                        </button>
                      ) : (
                        q.status !== 'archived' && (
                          <button 
                            type="button" 
                            style={{ color: 'var(--text-secondary, #9ca3af)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} 
                            onClick={() => handleArchive(q.id)}
                          >
                            Archive
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card qb-empty-state">
              🌳
              <h3>No matching questions found</h3>
              <p className="text-muted">Try adjusting the grade levels, subject categories, status, or add a new question to this pool.</p>
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>Add First Question</Button>
            </div>
          )}
        </main>
      </div>

      {/* Add Question Dialog Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Diagnostic Assessment Question"
        maxWidth="680px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleFormSubmit}>Register Question</Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="qb-add-form">
          <div className="form-row-double">
            <div className="form-group">
              <label className="form-label">Grade Target</label>
              <select className="form-select" value={formGrade} onChange={(e) => setFormGrade(e.target.value)}>
                {gradesList.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select" value={formSubject} onChange={(e) => setFormSubject(e.target.value)}>
                {subjectsList.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={formDifficulty} onChange={(e) => setFormDifficulty(e.target.value)}>
                {difficultiesList.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Question Text Prompts</label>
            <textarea
              className="form-input qb-textarea"
              placeholder="Enter the question text to be displayed to the student..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              rows={3}
            />
          </div>

          {/* Multiple choice inputs */}
          <div className="form-group">
            <label className="form-label">Multiple Choice (MCQ) Choices</label>
            <div className="qb-choices-form-grid">
              <div className="choice-input-item">
                <span className="choice-marker">A</span>
                <input type="text" className="form-input" placeholder="Option A text" value={optA} onChange={(e) => setOptA(e.target.value)} />
              </div>
              <div className="choice-input-item">
                <span className="choice-marker">B</span>
                <input type="text" className="form-input" placeholder="Option B text" value={optB} onChange={(e) => setOptB(e.target.value)} />
              </div>
              <div className="choice-input-item">
                <span className="choice-marker">C</span>
                <input type="text" className="form-input" placeholder="Option C text" value={optC} onChange={(e) => setOptC(e.target.value)} />
              </div>
              <div className="choice-input-item">
                <span className="choice-marker">D</span>
                <input type="text" className="form-input" placeholder="Option D text" value={optD} onChange={(e) => setOptD(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-row-double">
            <div className="form-group" style={{ flexGrow: 1 }}>
              <label className="form-label">Correct Option</label>
              <select className="form-select" value={correctOpt} onChange={(e) => setCorrectOpt(e.target.value)}>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>

            <div className="form-group" style={{ flexGrow: 2 }}>
              <label className="form-label">Illustrative Image Attachment (Optional)</label>
              <div className="flex gap-sm" style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="form-input"
                  style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', flexGrow: 1, textAlign: 'left' }}
                  onClick={handleSelectImage}
                >
                  {imagePath ? (imagePath.startsWith('data:') ? '✓ Image Attached' : `✓ ${imagePath}`) : 'Choose Image File...'}
                </button>
              </div>
              {imagePath && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={imagePath.startsWith('data:') ? imagePath : `media://${imagePath}`}
                    alt="Preview"
                    style={{ maxWidth: '80px', maxHeight: '50px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  />
                  <button
                    type="button"
                    style={{ padding: '6px 12px', background: 'var(--color-error, #ef4444)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => setImagePath('')}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Waveform recorder simulation component */}
          <div className="qb-voice-recorder-mock">
            <span className="form-label">Audio Prompt Recording (TTS / Read Aloud Assistant)</span>
            <div className="recorder-flex-bar">
              <button
                type="button"
                onClick={handleRecordToggle}
                className={`recorder-record-btn ${isRecording ? 'recording' : ''}`}
              >
                {isRecording ? <Square size={16} fill="#E15554" /> : <Mic size={16} />}
                <span>{isRecording ? 'Stop & Save' : 'Record Audio Prompt'}</span>
              </button>

              <div className={`recorder-waveform-visual ${isRecording ? 'active' : ''}`}>
                <svg viewBox="0 0 100 24" className="recorder-svg">
                  <rect x="2" y="4" width="2" height="16" rx="1" className="rec-bar rec-1" />
                  <rect x="8" y="4" width="2" height="16" rx="1" className="rec-bar rec-2" />
                  <rect x="14" y="4" width="2" height="16" rx="1" className="rec-bar rec-3" />
                  <rect x="20" y="4" width="2" height="16" rx="1" className="rec-bar rec-4" />
                  <rect x="26" y="4" width="2" height="16" rx="1" className="rec-bar rec-5" />
                  <rect x="32" y="4" width="2" height="16" rx="1" className="rec-bar rec-6" />
                  <rect x="38" y="4" width="2" height="16" rx="1" className="rec-bar rec-7" />
                  <rect x="44" y="4" width="2" height="16" rx="1" className="rec-bar rec-8" />
                  <rect x="50" y="4" width="2" height="16" rx="1" className="rec-bar rec-9" />
                  <rect x="56" y="4" width="2" height="16" rx="1" className="rec-bar rec-10" />
                  <rect x="62" y="4" width="2" height="16" rx="1" className="rec-bar rec-11" />
                  <rect x="68" y="4" width="2" height="16" rx="1" className="rec-bar rec-12" />
                  <rect x="74" y="4" width="2" height="16" rx="1" className="rec-bar rec-13" />
                  <rect x="80" y="4" width="2" height="16" rx="1" className="rec-bar rec-14" />
                  <rect x="86" y="4" width="2" height="16" rx="1" className="rec-bar rec-15" />
                </svg>
              </div>

              {hasRecordedAudio && !isRecording && (
                <div className="recorder-preview-controls">
                  <button
                    type="button"
                    onClick={handleTestPlayback}
                    className="recorder-preview-play"
                  >
                    <Play size={12} style={{ marginRight: '4px' }} />
                    {tts.isSpeaking ? 'Speaking...' : 'Test Playback'}
                  </button>
                </div>
              )}
            </div>
            <span className="recorder-status-desc">
              {isRecording 
                ? '🔴 Recording active from local microphone. Talk clearly.' 
                : hasRecordedAudio 
                  ? '✓ Voice recording attached and encoded locally.' 
                  : 'Voice recorder is idle. You can also import pre-recorded MP3 prompts.'}
            </span>
          </div>
        </form>
      </Modal>

      {/* Question Versions Modal */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => { setIsVersionModalOpen(false); setSelectedQuestionVersions([]); }}
        title={`Version History - "${versionQuestionText.substring(0, 30)}..."`}
        maxWidth="700px"
        footer={
          <Button variant="secondary" onClick={() => { setIsVersionModalOpen(false); setSelectedQuestionVersions([]); }}>Close</Button>
        }
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {selectedQuestionVersions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedQuestionVersions.map((v) => {
                let opts = [];
                try {
                  opts = JSON.parse(v.options_json || '[]');
                } catch(e) {}
                return (
                  <div key={v.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Version {v.version_number}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        By: <strong style={{ color: 'var(--text-primary)' }}>{v.changed_by}</strong> on {new Date(Number(v.timestamp)).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-primary)' }}>{v.text}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {opts.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isCorrect = letter === v.correct_answer;
                        return (
                          <div key={idx} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'none', color: isCorrect ? 'var(--color-success, #22c55e)' : 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{letter}:</strong> {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No version history found for this question.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default QuestionBank;
