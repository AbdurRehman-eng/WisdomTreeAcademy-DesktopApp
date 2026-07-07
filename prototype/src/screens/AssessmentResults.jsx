import React from 'react';
import { useApp } from '../context/AppContext';
import { mockStudentScores } from '../data/mockData';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { FileDown, RefreshCw, BarChart2 } from 'lucide-react';

export const AssessmentResults = () => {
  const { showToast } = useApp();

  const tableColumns = [
    { key: 'studentId', label: 'Student Roll' },
    { key: 'studentName', label: 'Candidate Name', render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong> },
    { key: 'subject', label: 'Assessed Subject' },
    { key: 'date', label: 'Evaluation Date' },
    {
      key: 'score',
      label: 'Score Count',
      render: (val) => {
        const correct = parseInt(val.split('/')[0]);
        const total = parseInt(val.split('/')[1]);
        const percent = Math.round((correct / total) * 100);
        return (
          <span style={{ fontWeight: '700', color: percent >= 80 ? 'var(--color-success)' : percent >= 50 ? 'var(--color-warning)' : 'var(--color-error)' }}>
            {val} ({percent}%)
          </span>
        );
      }
    },
    {
      key: 'performance',
      label: 'Diagnostic Tier',
      render: (val) => {
        const statusType = val === 'Exceeded Expectations' ? 'success' : val === 'Met Expectations' ? 'primary' : 'warning';
        return <Badge variant={statusType}>{val}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button variant="secondary" onClick={() => showToast(`Opening performance detail review for ${row.studentName}...`, 'info')} style={{ padding: '4px 10px', fontSize: '11px' }}>
          Details
        </Button>
      )
    }
  ];

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Diagnostic Assessment Results</h1>
          <p className="welcome-subtext">Review evaluation scores, diagnostic tier assignments, and download classroom records.</p>
        </div>
        <Button variant="secondary" onClick={() => showToast('Downloading school assessment ledger...', 'success')} icon={FileDown}>
          Export PDF ledger
        </Button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table
          data={mockStudentScores}
          columns={tableColumns}
          searchPlaceholder="Search student name, roll, or performance tier..."
          itemsPerPage={8}
        />
      </div>
    </div>
  );
};

export default AssessmentResults;
