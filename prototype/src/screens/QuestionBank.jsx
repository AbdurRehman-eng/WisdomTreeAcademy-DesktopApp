import React, { useState } from 'react';
import './QuestionBank.css';
import { useApp } from '../context/AppContext';
import { mockQuestions, mockClasses } from '../data/mockData';
import AudioControl from '../components/common/AudioControl';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Download, Upload, Filter, Mic, Square, Play, RefreshCw, Sparkles } from 'lucide-react';

export const QuestionBank = () => {
  const { showToast } = useApp();
  const [questions, setQuestions] = useState(mockQuestions);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  // Modal forms states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [formGrade, setFormGrade] = useState('Grade 1');
  const [formSubject, setFormSubject] = useState('Basic Math');
  const [formDifficulty, setFormDifficulty] = useState('Medium');

  // Mock audio recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [audioPlaybackActive, setAudioPlaybackActive] = useState(false);

  // Filters mapping
  const gradesList = ['All', 'Nursery', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
  const subjectsList = ['All', 'English Literacy', 'Basic Math', 'General Science', 'Advanced Math', 'Physics & Biology', 'Chemistry Basics'];
  const difficultiesList = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredQuestions = questions.filter(q => {
    const matchGrade = selectedGrade === 'All' || q.grade === selectedGrade;
    const matchSubject = selectedSubject === 'All' || q.subject === selectedSubject;
    const matchDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    return matchGrade && matchSubject && matchDiff;
  });

  const handleRecordToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setHasRecordedAudio(false);
      showToast('Recording audio prompt... Speak into the microphone.', 'info');
      // Auto stop after 4 seconds
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newQuestionText || !optA || !optB || !optC || !optD) {
      showToast('Please fill in the question text and all four MCQ options.', 'error');
      return;
    }

    const newQ = {
      id: `Q${Date.now().toString().slice(-3)}`,
      grade: formGrade,
      subject: formSubject,
      difficulty: formDifficulty,
      text: newQuestionText,
      options: [optA, optB, optC, optD],
      correct: correctOpt,
      audioText: newQuestionText
    };

    setQuestions([newQ, ...questions]);
    setIsAddModalOpen(false);
    showToast('Question registered in Local Bank successfully.', 'success');

    // Reset Form
    setNewQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOpt('A');
    setHasRecordedAudio(false);
  };

  const triggerImportCSV = () => {
    showToast('Mock Import: Select CSV question bank template.', 'info');
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
          <Button variant="secondary" onClick={triggerImportCSV} icon={Upload}>
            Import CSV Template
          </Button>
          <a href="#" className="csv-download-link" onClick={(e) => { e.preventDefault(); showToast('Downloading CSV template file...', 'success'); }}>
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
                    <div className="qp-badge-group">
                      <span className="qp-badge qp-badge-grade">{q.grade}</span>
                      <span className="qp-badge qp-badge-subject">{q.subject}</span>
                    </div>
                    <span className={`qp-difficulty-tag diff-${q.difficulty.toLowerCase()}`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <p className="qp-question-text">{q.text}</p>

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
                    <div className="qp-actions-links">
                      <button className="qp-action-btn-link edit" onClick={() => showToast(`Edit form for question ${q.id} loaded in modal.`, 'info')}>Edit</button>
                      <button className="qp-action-btn-link delete" onClick={() => {
                        setQuestions(questions.filter(item => item.id !== q.id));
                        showToast(`Question ${q.id} deleted.`, 'error');
                      }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card qb-empty-state">
              🌳
              <h3>No matching questions found</h3>
              <p className="text-muted">Try adjusting the grade levels, subject categories, or add a new question to this pool.</p>
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
              <input
                type="file"
                className="form-input"
                style={{ padding: '6px' }}
                onClick={(e) => { e.preventDefault(); showToast('Mock Attachment: File selector triggered.', 'info'); }}
              />
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
                    onClick={() => {
                      setAudioPlaybackActive(true);
                      setTimeout(() => setAudioPlaybackActive(false), 3000);
                    }}
                    disabled={audioPlaybackActive}
                    className="recorder-preview-play"
                  >
                    <Play size={12} style={{ marginRight: '4px' }} />
                    {audioPlaybackActive ? 'Playing...' : 'Test Playback'}
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
    </div>
  );
};

export default QuestionBank;
