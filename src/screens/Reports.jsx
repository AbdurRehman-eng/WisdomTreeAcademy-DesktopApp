import React from 'react';
import { useApp } from '../context/AppContext';
import { mockActivityLog } from '../data/mockData';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Printer, CalendarDays, TrendingUp, Info } from 'lucide-react';

export const Reports = () => {
  const { showToast } = useApp();

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
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>88.5% Avg</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Based on 14 completed tests</span>
        </div>

        <div className="card flex flex-col gap-sm">
          <div className="flex items-center gap-sm color-green">
            <TrendingUp size={18} />
            <h4 style={{ margin: 0, fontWeight: 700 }}>Grade 1 Roster</h4>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>92.1% Avg</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Based on 28 completed tests</span>
        </div>

        <div className="card flex flex-col gap-sm">
          <div className="flex items-center gap-sm color-orange">
            <TrendingUp size={18} />
            <h4 style={{ margin: 0, fontWeight: 700 }}>Grade 2 Roster</h4>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>84.3% Avg</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Based on 12 completed tests</span>
        </div>
      </div>

      {/* System Audit logs */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="flex items-center gap-sm header-margin">
          <Info size={16} className="color-primary" />
          <h3 className="card-title" style={{ marginBottom: 0 }}>School System Audit Trails</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="registry-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Operator</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Logged Activity</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockActivityLog.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{log.user}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{log.message}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{log.time}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={log.type === 'sync' ? 'success' : 'primary'}>Logged</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
