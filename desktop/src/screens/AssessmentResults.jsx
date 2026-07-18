import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { FileDown, RefreshCw, Eye, CheckCircle2, XCircle } from 'lucide-react';

export const AssessmentResults = () => {
  const { showToast } = useApp();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const list = await window.api.getAssessments();
        setResults(list || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load assessment results from database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleExport = async () => {
    if (window.api?.exportResults) {
      showToast('Exporting student results...', 'info');
      const res = await window.api.exportResults();
      if (res.success) {
        showToast('Student Results exported successfully.', 'success');
      } else {
        showToast(res.error || 'Failed to export results.', 'error');
      }
    } else {
      showToast('Student Results export simulated (web preview mode).', 'info');
    }
  };

  const openDetails = (row) => {
    setSelectedAssessment(row);
    setIsDetailsOpen(true);
  };

  const tableColumns = [
    { 
      key: 'student_roll', 
      label: 'Student Roll' 
    },
    { 
      key: 'student_name', 
      label: 'Candidate Name', 
      render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong> 
    },
    { 
      key: 'student_class', 
      label: 'Classroom / Grade' 
    },
    { 
      key: 'subject', 
      label: 'Assessed Subject',
      render: (_, row) => {
        const responses = Array.isArray(row.results) ? row.results : (row.results?.responses || []);
        const subject = (Array.isArray(row.results) ? row.results[0]?.subject : row.results?.subject) || 'General';
        return subject;
      }
    },
    { 
      key: 'date', 
      label: 'Evaluation Date' 
    },
    {
      key: 'score',
      label: 'Score Count',
      render: (_, row) => {
        const correct = row.score;
        const total = row.total_questions;
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        return (
          <span style={{ fontWeight: '700', color: percent >= 80 ? 'var(--color-success)' : percent >= 50 ? 'var(--color-warning)' : 'var(--color-error)' }}>
            {correct}/{total} ({percent}%)
          </span>
        );
      }
    },
    {
      key: 'performance',
      label: 'Diagnostic Tier',
      render: (_, row) => {
        const percent = row.total_questions > 0 ? Math.round((row.score / row.total_questions) * 100) : 0;
        let tier = 'Below Expectations';
        let variant = 'warning';
        if (percent >= 80) {
          tier = 'Exceeded Expectations';
          variant = 'success';
        } else if (percent >= 50) {
          tier = 'Met Expectations';
          variant = 'primary';
        }
        return <Badge variant={variant}>{tier}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button variant="secondary" onClick={() => openDetails(row)} style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Eye size={12} /> Details
        </Button>
      )
    }
  ];

  // Extract responses for details modal rendering
  const detailsResponses = selectedAssessment 
    ? (Array.isArray(selectedAssessment.results) ? selectedAssessment.results : (selectedAssessment.results?.responses || []))
    : [];

  const detailsPercent = selectedAssessment && selectedAssessment.total_questions > 0
    ? Math.round((selectedAssessment.score / selectedAssessment.total_questions) * 100)
    : 0;

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Diagnostic Assessment Results</h1>
          <p className="welcome-subtext">Review evaluation scores, diagnostic tier assignments, and download classroom records.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={fetchResults} icon={RefreshCw}>
            Refresh
          </Button>
          <Button variant="primary" onClick={handleExport} icon={FileDown}>
            Export CSV Ledger
          </Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading records from database...
          </div>
        ) : results.length > 0 ? (
          <Table
            data={results}
            columns={tableColumns}
            searchPlaceholder="Search student name, roll, or performance tier..."
            itemsPerPage={8}
          />
        ) : (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            🌳
            <h3 style={{ marginTop: '16px', color: 'var(--text-primary)' }}>No assessment records found</h3>
            <p style={{ maxWidth: '400px', margin: '8px auto', fontSize: '13px' }}>
              Run some diagnostic assessments with students to begin generating score sheets and reports.
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Student Performance Evaluation Scorecard"
        maxWidth="680px"
        footer={
          <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Close Review</Button>
        }
      >
        {selectedAssessment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-primary)' }}>
            
            {/* Student metadata header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
              gap: '12px', 
              background: 'var(--bg-secondary)', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)' 
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Candidate Name</span>
                <strong>{selectedAssessment.student_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Roll Number</span>
                <span>{selectedAssessment.student_roll}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Grade / Class</span>
                <span>{selectedAssessment.student_class}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Assessed Date</span>
                <span>{selectedAssessment.date}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Score / Rating</span>
                <strong style={{ 
                  color: detailsPercent >= 80 ? 'var(--color-success)' : detailsPercent >= 50 ? 'var(--color-warning)' : 'var(--color-error)' 
                }}>
                  {selectedAssessment.score}/{selectedAssessment.total_questions} ({detailsPercent}%)
                </strong>
              </div>
            </div>

            {/* Questions detail review */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                Question-by-Question Response Log
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                {detailsResponses.map((resp, idx) => {
                  const isCorrect = (() => {
                    if (resp.isCorrect !== undefined) return resp.isCorrect === true || resp.isCorrect === 'true';
                    if (resp.is_correct !== undefined) return resp.is_correct === true || resp.is_correct === 'true';
                    if (resp.correct !== undefined) {
                      if (typeof resp.correct === 'boolean') return resp.correct;
                      if (resp.correct === 'true') return true;
                      if (resp.correct === 'false') return false;
                    }
                    const sel = resp.selectedAnswer || resp.selected_answer;
                    const cor = resp.correctAnswer || resp.correct_answer;
                    if (sel !== undefined && cor !== undefined) {
                      return String(sel).trim().toLowerCase() === String(cor).trim().toLowerCase();
                    }
                    return false;
                  })();
                  return (
                    <div key={idx} style={{ 
                      padding: '12px 16px', 
                      borderRadius: '6px', 
                      background: 'var(--bg-app)', 
                      borderLeft: `4px solid ${isCorrect ? 'var(--color-success, #10b981)' : 'var(--color-error, #ef4444)'}`,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ flexGrow: 1 }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Question {idx + 1} • {resp.subject || 'Subject Details'}
                          </span>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', lineHeight: '1.4' }}>{resp.questionText}</p>
                          
                          <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '12px' }}>
                            <span>
                              Selected: <strong style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-error)' }}>{resp.selectedAnswer || 'None'}</strong>
                            </span>
                            <span>
                              Correct: <strong style={{ color: 'var(--color-success)' }}>{resp.correctAnswer}</strong>
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ flexShrink: 0, marginTop: '2px' }}>
                          {isCorrect ? (
                            <CheckCircle2 size={18} color="var(--color-success)" style={{ display: 'block' }} />
                          ) : (
                            <XCircle size={18} color="var(--color-error)" style={{ display: 'block' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssessmentResults;
