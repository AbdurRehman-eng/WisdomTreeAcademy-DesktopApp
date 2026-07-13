import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Printer, TrendingUp, Info, FileText } from 'lucide-react';
import './Reports.css';

function getPerformanceBand(percent) {
  if (percent >= 90) return { label: 'Exceeded Expectations', css: 'exceeded', icon: '🏆' };
  if (percent >= 60) return { label: 'Met Expectations',      css: 'met',      icon: '⭐' };
  return               { label: 'Below Expectations',         css: 'below',    icon: '📌' };
}

export const Reports = () => {
  const { showToast } = useApp();
  const printAreaRef = useRef(null);

  const [assessments, setAssessments]   = useState([]);
  const [grades, setGrades] = useState([]);
  const [gradeAverages, setGradeAverages] = useState({});
  const [printTarget, setPrintTarget] = useState(null); // single assessment | 'all'

  useEffect(() => {
    const loadReportsData = async () => {
      if (window.api) {
        const classesList = await window.api.getClasses();
        const gradesNames = classesList.map(c => c.name);
        setGrades(gradesNames);

        const list = await window.api.getAssessments();
        setAssessments(list);

        // Calculate grade averages for all grades
        const sums = gradesNames.reduce((acc, g) => ({ ...acc, [g]: { sum: 0, count: 0 } }), {});
        list.forEach(a => {
          const cls = a.student_class;
          if (sums[cls]) {
            sums[cls].sum   += (a.score / a.total_questions) * 100;
            sums[cls].count += 1;
          }
        });
        setGradeAverages(
          gradesNames.reduce((acc, g) => ({
            ...acc,
            [g]: {
              avg:   sums[g].count > 0 ? Math.round(sums[g].sum / sums[g].count) : 0,
              count: sums[g].count
            }
          }), {})
        );
      }
    };
    loadReportsData();
  }, []);

  // Build HTML for a single report card
  const buildReportCardHTML = (item) => {
    const pct  = Math.round((item.score / item.total_questions) * 100);
    const band = getPerformanceBand(pct);
    const results = Array.isArray(item.results) ? item.results : [];

    return `
      <div class="report-page" style="page-break-after: always;">
        <div class="report-header">
          <div>
            <div class="report-school-name">🌳 Wisdom Tree Academy</div>
            <div class="report-school-tag">Diagnostic Assessment Software v1.0 — Official Transcript</div>
          </div>
          <span class="report-badge">OFFICIAL REPORT</span>
        </div>
        <div class="report-title-bar">
          <span class="report-title">Student Diagnostic Assessment Report</span>
          <span class="report-date">Assessment Date: ${item.date}</span>
        </div>
        <div class="report-body">
          <div class="student-info-grid">
            <div class="info-row"><span class="info-label">Student Name</span><span class="info-value">${item.student_name}</span></div>
            <div class="info-row"><span class="info-label">Roll Number</span><span class="info-value">${item.student_roll || '—'}</span></div>
            <div class="info-row"><span class="info-label">Grade / Class</span><span class="info-value">${item.student_class}</span></div>
            <div class="info-row"><span class="info-label">Report Generated</span><span class="info-value">${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</span></div>
          </div>
          <div class="score-summary-grid">
            <div class="score-card primary">
              <div class="score-card-value">${item.score}</div>
              <div class="score-card-label">Correct Answers</div>
            </div>
            <div class="score-card neutral">
              <div class="score-card-value">${item.total_questions}</div>
              <div class="score-card-label">Total Questions</div>
            </div>
            <div class="score-card highlight">
              <div class="score-card-value">${pct}%</div>
              <div class="score-card-label">Final Score</div>
            </div>
          </div>
          <div class="performance-band ${band.css}">
            <span class="band-icon">${band.icon}</span>
            <div>
              <div class="band-label">${band.label}</div>
              <div class="band-desc">${
                band.css === 'exceeded' ? 'Score ≥ 90%. Student demonstrates outstanding command of assessed concepts.' :
                band.css === 'met'      ? 'Score 60–89%. Student demonstrates adequate understanding of assessed concepts.' :
                                         'Score < 60%. Student may require additional support in assessed areas.'
              }</div>
            </div>
          </div>
          ${results.length > 0 ? `
          <div class="section-title">Question-by-Question Breakdown</div>
          <div class="answer-grid">
            ${results.map((r, i) => {
              const isCorrect = r.isCorrect !== undefined ? r.isCorrect : r.correct;
              return `
                <div class="answer-item ${isCorrect ? 'correct' : 'wrong'}">
                  <div class="answer-q">Q${i + 1}</div>
                  <div class="answer-mark">${isCorrect ? '✅' : '❌'}</div>
                </div>
              `;
            }).join('')}
          </div>` : ''}
          <div class="signatures-row">
            <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Teacher / Assessor</div></div>
            <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Administrator</div></div>
            <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Parent / Guardian</div></div>
          </div>
        </div>
        <div class="report-footer">
          <span>Generated by Wisdom Tree Academy Diagnostic Assessment Software v1.0</span>
          <span>Confidential — For School Use Only</span>
        </div>
      </div>
    `;
  };

  const PRINT_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #0f172a; }
    .report-page { max-width: 720px; margin: 0 auto 40px; background: #fff; border: 1px solid #e2e8f0; }
    .report-header { background: linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; padding:28px 36px; display:flex; justify-content:space-between; align-items:flex-start; }
    .report-school-name { font-size:20px; font-weight:800; }
    .report-school-tag  { font-size:11px; opacity:.75; margin-top:4px; }
    .report-badge { background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.4); border-radius:20px; padding:5px 12px; font-size:11px; font-weight:600; }
    .report-title-bar { background:#f8fafc; border-bottom:2px solid #e2e8f0; padding:14px 36px; display:flex; justify-content:space-between; align-items:center; }
    .report-title { font-size:13px; font-weight:700; color:#4f46e5; text-transform:uppercase; letter-spacing:.8px; }
    .report-date  { font-size:12px; color:#64748b; }
    .report-body  { padding:28px 36px; }
    .student-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; }
    .info-row { display:flex; flex-direction:column; gap:2px; }
    .info-label { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.5px; font-weight:600; }
    .info-value { font-size:14px; font-weight:600; }
    .score-summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:24px; }
    .score-card { text-align:center; padding:18px 14px; border-radius:10px; border:1px solid #e2e8f0; }
    .score-card.primary   { background:#eef2ff; border-color:#c7d2fe; }
    .score-card.neutral   { background:#f8fafc; }
    .score-card.highlight { background:#fefce8; border-color:#fde68a; }
    .score-card-value { font-size:30px; font-weight:800; color:#4f46e5; line-height:1; }
    .score-card.neutral .score-card-value { color:#0f172a; }
    .score-card.highlight .score-card-value { color:#d97706; }
    .score-card-label { font-size:11px; color:#64748b; margin-top:5px; font-weight:500; }
    .performance-band { padding:12px 18px; border-radius:8px; margin-bottom:24px; display:flex; align-items:center; gap:12px; }
    .performance-band.exceeded { background:#ecfdf5; border:1px solid #6ee7b7; }
    .performance-band.met      { background:#eef2ff; border:1px solid #a5b4fc; }
    .performance-band.below    { background:#fff7ed; border:1px solid #fed7aa; }
    .band-icon  { font-size:22px; }
    .band-label { font-size:13px; font-weight:700; }
    .band-desc  { font-size:11px; color:#64748b; margin-top:2px; }
    .section-title { font-size:12px; font-weight:700; color:#4f46e5; text-transform:uppercase; letter-spacing:.8px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #e2e8f0; }
    .answer-grid { display:grid; grid-template-columns:repeat(10,1fr); gap:6px; margin-bottom:24px; }
    .answer-item { text-align:center; padding:8px 4px; border-radius:6px; border:1px solid #e2e8f0; }
    .answer-item.correct { background:#ecfdf5; border-color:#6ee7b7; }
    .answer-item.wrong   { background:#fef2f2; border-color:#fca5a5; }
    .answer-q    { font-size:10px; color:#64748b; }
    .answer-mark { font-size:14px; margin-top:2px; }
    .signatures-row { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:36px; padding-top:18px; border-top:1px solid #e2e8f0; }
    .sig-block  { display:flex; flex-direction:column; gap:4px; }
    .sig-line   { border-bottom:1px solid #94a3b8; height:32px; }
    .sig-label  { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.5px; margin-top:4px; }
    .report-footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:14px 36px; display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; }
    @media print {
      body { padding:0; }
      .report-page { border:none; margin:0; max-width:100%; page-break-after: always; }
    }
  `;

  const openPrintWindow = (htmlBody) => {
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) {
      showToast('Pop-up blocked. Please allow pop-ups for this application.', 'error');
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Wisdom Tree — Report</title><style>${PRINT_STYLES}</style></head>
        <body>${htmlBody}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    // Small delay so content renders before print dialog opens
    setTimeout(() => { win.print(); }, 400);
  };

  const handlePrintSingle = (item) => {
    openPrintWindow(buildReportCardHTML(item));
  };

  const handlePrintAll = () => {
    if (assessments.length === 0) {
      showToast('No assessments to print.', 'warning');
      return;
    }
    const allHTML = assessments.map(buildReportCardHTML).join('');
    openPrintWindow(allHTML);
  };

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Printable Reports Center</h1>
          <p className="welcome-subtext">Generate formal student scorecard transcripts, view class statistics, and print official report cards.</p>
        </div>
        <Button variant="primary" onClick={handlePrintAll} icon={Printer}>
          Print All Transcripts
        </Button>
      </div>

      {/* Grade averages grid */}
      <div className="grid grid-cols-3" style={{ gap: '16px' }}>
        {grades.map(grade => {
          const { avg, count } = gradeAverages[grade] || { avg: 0, count: 0 };
          const band = getPerformanceBand(avg);
          return (
            <div key={grade} className="card flex flex-col gap-sm">
              <div className="flex items-center gap-sm color-primary">
                <TrendingUp size={18} />
                <h4 style={{ margin: 0, fontWeight: 700 }}>{grade}</h4>
              </div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
                {count > 0 ? `${avg}%` : 'N/A'}
              </span>
              <div className="flex items-center gap-sm">
                {count > 0 && (
                  <Badge variant={band.css === 'exceeded' ? 'success' : band.css === 'met' ? 'primary' : 'warning'}>
                    {band.label}
                  </Badge>
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Based on {count} completed test{count !== 1 ? 's' : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Assessment transcripts table */}
      <div className="card" style={{ marginTop: '24px', padding: 0 }}>
        <div className="flex items-center gap-sm" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <Info size={16} className="color-primary" />
          <h3 className="card-title" style={{ marginBottom: 0 }}>Completed Diagnostic Assessment Transcripts</h3>
        </div>

        {assessments.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No diagnostic assessments completed yet.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Go to Assessment Setup to launch a session.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--bg-app)' }}>
                  {['Candidate Name', 'Grade Level', 'Score', 'Assessment Date', 'Performance', 'Cloud Sync', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assessments.map((item) => {
                  const pct  = Math.round((item.score / item.total_questions) * 100);
                  const band = getPerformanceBand(pct);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{item.student_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Roll: {item.student_roll}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.student_class}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                        <strong style={{ color: 'var(--color-primary)' }}>{item.score}</strong>
                        <span style={{ color: 'var(--text-secondary)' }}> / {item.total_questions} ({pct}%)</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={band.css === 'exceeded' ? 'success' : band.css === 'met' ? 'primary' : 'warning'}>
                          {band.icon} {band.label}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={item.sync_status === 'synced' ? 'success' : 'warning'}>
                          {item.sync_status === 'synced' ? 'Synced' : 'Pending'}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handlePrintSingle(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            transition: 'var(--transition-normal)'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-app)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
                          <Printer size={12} /> Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
