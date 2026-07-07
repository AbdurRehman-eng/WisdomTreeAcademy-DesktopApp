import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Printer, CalendarDays, TrendingUp, Info } from 'lucide-react';

export const Reports = () => {
  const { showToast } = useApp();
  const [assessments, setAssessments] = useState([]);
  const [gradeAverages, setGradeAverages] = useState({
    Nursery: { avg: 0, count: 0 },
    'Grade 1': { avg: 0, count: 0 },
    'Grade 2': { avg: 0, count: 0 }
  });

  useEffect(() => {
    const loadReportsData = async () => {
      if (window.api) {
        const list = await window.api.getAssessments();
        setAssessments(list);

        // Calculate grade averages
        const averages = {
          Nursery: { sum: 0, count: 0 },
          'Grade 1': { sum: 0, count: 0 },
          'Grade 2': { sum: 0, count: 0 }
        };

        list.forEach(a => {
          const cls = a.student_class;
          if (averages[cls] !== undefined) {
            const percent = (a.score / a.total_questions) * 100;
            averages[cls].sum += percent;
            averages[cls].count += 1;
          }
        });

        setGradeAverages({
          Nursery: {
            avg: averages.Nursery.count > 0 ? Math.round(averages.Nursery.sum / averages.Nursery.count) : 0,
            count: averages.Nursery.count
          },
          'Grade 1': {
            avg: averages['Grade 1'].count > 0 ? Math.round(averages['Grade 1'].sum / averages['Grade 1'].count) : 0,
            count: averages['Grade 1'].count
          },
          'Grade 2': {
            avg: averages['Grade 2'].count > 0 ? Math.round(averages['Grade 2'].sum / averages['Grade 2'].count) : 0,
            count: averages['Grade 2'].count
          }
        });
      }
    };
    loadReportsData();
  }, []);

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Printable Reports Center</h1>
          <p className="welcome-subtext">Generate formal student scorecard transcripts, audit system activity logs, and view class statistics.</p>
        </div>
        <Button variant="primary" onClick={() => showToast('Report print queue generated. Initializing PDF print engine...', 'success')} icon={Printer}>
          Print Batch Transcripts
        </Button>
      </div>

      {/* Grid summarizing classes averages */}
      <div className="grid grid-cols-3">
        <div className="card flex flex-col gap-sm">
          <div className="flex items-center gap-sm color-primary">
            <TrendingUp size={18} />
            <h4 style={{ margin: 0, fontWeight: 700 }}>Nursery Roster</h4>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {gradeAverages.Nursery.count > 0 ? `${gradeAverages.Nursery.avg}%` : 'N/A'} Avg
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Based on {gradeAverages.Nursery.count} completed tests
          </span>
        </div>

        <div className="card flex flex-col gap-sm">
          <div className="flex items-center gap-sm color-green">
            <TrendingUp size={18} />
            <h4 style={{ margin: 0, fontWeight: 700 }}>Grade 1 Roster</h4>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {gradeAverages['Grade 1'].count > 0 ? `${gradeAverages['Grade 1'].avg}%` : 'N/A'} Avg
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Based on {gradeAverages['Grade 1'].count} completed tests
          </span>
        </div>

        <div className="card flex flex-col gap-sm">
          <div className="flex items-center gap-sm color-orange">
            <TrendingUp size={18} />
            <h4 style={{ margin: 0, fontWeight: 700 }}>Grade 2 Roster</h4>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {gradeAverages['Grade 2'].count > 0 ? `${gradeAverages['Grade 2'].avg}%` : 'N/A'} Avg
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Based on {gradeAverages['Grade 2'].count} completed tests
          </span>
        </div>
      </div>

      {/* Assessment transcripts */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="flex items-center gap-sm header-margin">
          <Info size={16} className="color-primary" />
          <h3 className="card-title" style={{ marginBottom: 0 }}>Completed Diagnostic Assessment Transcripts</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {assessments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No diagnostic assessments have been completed yet. Go to Diagnostic Setup to launch sessions.
            </div>
          ) : (
            <table className="registry-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Candidate Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Grade Level</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Score Obtained</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Assessment Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Sync Status</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div>{item.student_name}</div>
                      <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-secondary)' }}>Roll: {item.student_roll}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.student_class}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <strong className="color-primary">{item.score}</strong> / {item.total_questions} ({Math.round((item.score / item.total_questions) * 100)}%)
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.date}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge variant={item.sync_status === 'synced' ? 'success' : 'primary'}>
                        {item.sync_status === 'synced' ? 'Cloud Synced' : 'Offline Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
