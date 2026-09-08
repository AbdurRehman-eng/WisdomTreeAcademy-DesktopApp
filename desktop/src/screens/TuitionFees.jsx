import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { 
  CreditCard, 
  Search, 
  DollarSign, 
  History, 
  User, 
  Calendar, 
  ArrowLeft, 
  Coins, 
  Printer, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import './TuitionFees.css';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateTuitionStatus = (totalCharged, amountPaid) => {
  const charged = Number(totalCharged) || 0;
  const paid = Number(amountPaid) || 0;

  if (charged <= 0) {
    if (paid > 0) return 'Unallocated Credit';
    return 'No Fee Assigned';
  }
  if (paid > charged) {
    return 'Overpaid (Credit)';
  }
  if (paid >= charged) {
    return 'Paid';
  }
  if (paid > 0) {
    return 'Partially Paid';
  }
  return 'Outstanding';
};

export const TuitionFees = () => {
  const { user, schoolLogo, currencySetting, showToast, refreshSyncInfo } = useApp();

  // Data states
  const [tuitionList, setTuitionList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal open states
  const [isEditFeesOpen, setIsEditFeesOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);

  // Form states
  const [totalChargedInput, setTotalChargedInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [dateInput, setDateInput] = useState(getLocalDateString());
  const [methodInput, setMethodInput] = useState('Cash');
  const [notesInput, setNotesInput] = useState('');

  const loadTuitionData = async () => {
    if (window.api?.getTuitionFees) {
      const data = await window.api.getTuitionFees();
      const processed = data.map(item => {
        const outstanding = Math.max(0, item.total_charged - item.amount_paid);
        const status = calculateTuitionStatus(item.total_charged, item.amount_paid);
        return {
          ...item,
          outstanding,
          status
        };
      });
      setTuitionList(processed);
    } else {
      // Mock data for web preview
      const mockData = [
        { student_id: 's1', student_name: 'Timothy Brown', roll_number: 'WTA-0932', student_class: 'Grade 1', total_charged: 1200, amount_paid: 1200, outstanding: 0, status: 'Paid' },
        { student_id: 's2', student_name: 'Emma Watson', roll_number: 'WTA-0145', student_class: 'Grade 2', total_charged: 1500, amount_paid: 500, outstanding: 1000, status: 'Partially Paid' },
        { student_id: 's3', student_name: 'Aiden Vance', roll_number: 'WTA-0599', student_class: 'Grade 1', total_charged: 1200, amount_paid: 0, outstanding: 1200, status: 'Outstanding' },
        { student_id: 's4', student_name: 'Sophia Loren', roll_number: 'WTA-0888', student_class: 'Nursery', total_charged: 0, amount_paid: 0, outstanding: 0, status: 'No Fee Assigned' }
      ];
      setTuitionList(mockData);
    }
  };

  const loadClasses = async () => {
    if (window.api?.getClasses) {
      const list = await window.api.getClasses();
      setClasses(list.map(c => c.name));
    } else {
      setClasses(['Nursery', 'Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5']);
    }
  };

  useEffect(() => {
    loadTuitionData();
    loadClasses();
  }, []);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    if (window.api?.getStudentPaymentHistory) {
      const history = await window.api.getStudentPaymentHistory(student.student_id);
      setPaymentHistory(history);
    } else {
      if (student.amount_paid > 0) {
        setPaymentHistory([
          { id: 'p1', amount: student.amount_paid, payment_date: '2026-07-15', payment_method: 'Cash', notes: 'First Term installment' }
        ]);
      } else {
        setPaymentHistory([]);
      }
    }
  };

  const handleOpenEditFees = () => {
    if (!selectedStudent) return;
    setTotalChargedInput(selectedStudent.total_charged.toString());
    setIsEditFeesOpen(true);
  };

  const handleSaveFees = async (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(totalChargedInput);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid amount (>= 0).', 'error');
      return;
    }

    if (window.api?.updateStudentTuition) {
      const res = await window.api.updateStudentTuition({
        studentId: selectedStudent.student_id,
        totalCharged: val
      });
      if (res.success) {
        showToast('Outstanding tuition charges updated.', 'success');
        setIsEditFeesOpen(false);
        refreshSyncInfo();
        await loadTuitionData();
        const currentList = await window.api.getTuitionFees();
        const updated = currentList.find(s => s.student_id === selectedStudent.student_id);
        if (updated) {
          const outstanding = Math.max(0, updated.total_charged - updated.amount_paid);
          const status = calculateTuitionStatus(updated.total_charged, updated.amount_paid);
          setSelectedStudent({ ...updated, outstanding, status });
        }
      } else {
        showToast(res.error || 'Failed to update tuition.', 'error');
      }
    } else {
      showToast('Tuition updated (Preview Mode).', 'info');
      setIsEditFeesOpen(false);
    }
  };

  const handleOpenRecordPayment = () => {
    if (!selectedStudent) return;
    setAmountInput('');
    setDateInput(getLocalDateString());
    setMethodInput('Cash');
    setNotesInput('');
    setIsRecordPaymentOpen(true);
  };

  const handleSavePayment = async (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid payment amount (> 0).', 'error');
      return;
    }

    if (window.api?.recordTuitionPayment) {
      const res = await window.api.recordTuitionPayment({
        studentId: selectedStudent.student_id,
        amount: val,
        paymentDate: dateInput,
        paymentMethod: methodInput,
        notes: notesInput
      });

      if (res.success) {
        const symbol = currencySetting === 'GHS' ? '₵' : '$';
        showToast(`Payment of ${symbol}${val} recorded locally!`, 'success');
        setIsRecordPaymentOpen(false);
        refreshSyncInfo();
        await loadTuitionData();
        const currentList = await window.api.getTuitionFees();
        const updated = currentList.find(s => s.student_id === selectedStudent.student_id);
        if (updated) {
          const outstanding = Math.max(0, updated.total_charged - updated.amount_paid);
          const status = calculateTuitionStatus(updated.total_charged, updated.amount_paid);
          const updatedStudentObj = { ...updated, outstanding, status };
          setSelectedStudent(updatedStudentObj);
          const history = await window.api.getStudentPaymentHistory(selectedStudent.student_id);
          setPaymentHistory(history);
          
          const latestPayment = history.find(h => Number(h.amount) === val && h.payment_date === dateInput) || history[0];
          if (latestPayment) {
            setSelectedPaymentForReceipt({ payment: latestPayment, student: updatedStudentObj });
            setIsReceiptModalOpen(true);
          }
        }
      } else {
        showToast(res.error || 'Failed to record payment.', 'error');
      }
    } else {
      showToast('Payment recorded (Preview Mode).', 'info');
      setIsRecordPaymentOpen(false);
    }
  };

  const handlePrintReceiptPrompt = (pm) => {
    setSelectedPaymentForReceipt({ payment: pm, student: selectedStudent });
    setIsReceiptModalOpen(true);
  };

  const handlePrintReceiptWindow = () => {
    const elem = document.getElementById('printable-receipt-area');
    if (!elem) return;
    const printWin = window.open('', '_blank', 'width=800,height=700');
    printWin.document.write(`
      <html>
        <head>
          <title>Wisdom Tree Academy - Tuition Receipt</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          ${elem.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Helper formats
  const formatMoney = (amount) => {
    const isGHS = currencySetting === 'GHS';
    return new Intl.NumberFormat(isGHS ? 'en-GH' : 'en-US', {
      style: 'currency',
      currency: isGHS ? 'GHS' : 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Aggregated Stats
  const stats = tuitionList.reduce(
    (acc, curr) => {
      acc.totalCharged += curr.total_charged;
      acc.totalPaid += curr.amount_paid;
      acc.totalOutstanding += curr.outstanding;
      return acc;
    },
    { totalCharged: 0, totalPaid: 0, totalOutstanding: 0 }
  );

  const collectionRate = stats.totalCharged > 0 
    ? Math.round((stats.totalPaid / stats.totalCharged) * 100) 
    : 100;

  // Filter logic
  const filteredTuition = tuitionList.filter(item => {
    const matchesSearch = 
      item.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'All' || item.student_class === classFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const columns = [
    { key: 'roll_number', label: 'Roll Number' },
    { key: 'student_name', label: 'Student Name', render: (val) => <strong>{val}</strong> },
    { key: 'student_class', label: 'Grade / Class' },
    { key: 'total_charged', label: 'Tuition Fee', render: (val) => formatMoney(val) },
    { key: 'amount_paid', label: 'Paid', render: (val) => <span className="color-green font-semibold">{formatMoney(val)}</span> },
    { key: 'outstanding', label: 'Outstanding Balance', render: (val) => <span className={val > 0 ? "color-error font-semibold" : "color-green"}>{formatMoney(val)}</span> },
    { 
      key: 'status', 
      label: 'Payment Status', 
      render: (val) => (
        <Badge variant={
          val === 'Paid' || val === 'Overpaid (Credit)' ? 'success' :
          val === 'Partially Paid' ? 'warning' :
          val === 'Unallocated Credit' ? 'warning' :
          val === 'No Fee Assigned' ? 'secondary' :
          'danger'
        }>
          {val}
        </Badge>
      )
    },
    {
      key: 'student_id',
      label: 'Action',
      render: (_, row) => (
        <Button size="sm" variant="secondary" onClick={() => handleSelectStudent(row)}>
          Manage Ledger
        </Button>
      )
    }
  ];

  return (
    <div className="page-container fade-in">
      {/* Header Panel */}
      <div className="flex justify-between items-center header-margin" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 className="welcome-heading">Tuition &amp; Fees Ledger</h1>
          <p className="welcome-subtext">Set student tuition balances, log collection receipts, and print official payment receipts.</p>
        </div>
      </div>

      {selectedStudent ? (
        /* ================= STUDENT DETAIL LEDGER VIEW ================= */
        <div className="ledger-detail-container fade-in">
          <button className="back-link-btn" onClick={() => setSelectedStudent(null)}>
            <ArrowLeft size={16} /> Back to Student Fee Register
          </button>

          <div className="grid grid-cols-3 gap-lg" style={{ marginTop: '16px' }}>
            {/* Student Info Card */}
            <div className="card student-summary-card flex flex-col gap-md">
              <div className="flex items-center gap-sm">
                <User size={24} className="color-primary" />
                <div>
                  <h3 className="card-title" style={{ marginBottom: 0 }}>{selectedStudent.student_name}</h3>
                  <span className="welcome-subtext" style={{ fontSize: '12px' }}>Roll: {selectedStudent.roll_number} | Class: {selectedStudent.student_class}</span>
                </div>
              </div>

              <div className="tuition-breakdown-details" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', marginTop: '12px' }}>
                <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Fee Charged</span>
                  <strong>{formatMoney(selectedStudent.total_charged)}</strong>
                </div>
                <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Amount Paid</span>
                  <strong className="color-green">{formatMoney(selectedStudent.amount_paid)}</strong>
                </div>
                <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Outstanding Balance</span>
                  <strong className={selectedStudent.outstanding > 0 ? "color-error" : "color-green"}>
                    {formatMoney(selectedStudent.outstanding)}
                  </strong>
                </div>
                <div className="flex justify-between items-center" style={{ paddingTop: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payment Status</span>
                  <Badge variant={
                    selectedStudent.status === 'Paid' || selectedStudent.status === 'Overpaid (Credit)' ? 'success' :
                    selectedStudent.status === 'Partially Paid' ? 'warning' :
                    selectedStudent.status === 'Unallocated Credit' ? 'warning' :
                    selectedStudent.status === 'No Fee Assigned' ? 'secondary' :
                    'danger'
                  }>
                    {selectedStudent.status}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-sm" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <Button variant="primary" icon={Coins} onClick={handleOpenRecordPayment}>
                  Record Collection Payment
                </Button>
                <Button variant="secondary" icon={CreditCard} onClick={handleOpenEditFees}>
                  Modify Tuition Charge
                </Button>
              </div>
            </div>

            {/* Payment Ledger History */}
            <div className="card col-span-2 flex flex-col gap-md">
              <div className="flex items-center gap-sm">
                <History size={20} className="color-accent" />
                <h3 className="card-title" style={{ marginBottom: 0 }}>Payment Ledger History</h3>
              </div>

              <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Payment Date</th>
                      <th>Amount Received</th>
                      <th>Method</th>
                      <th>Notes / Reference</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.length > 0 ? (
                      paymentHistory.map((pm, idx) => (
                        <tr key={pm.id || idx}>
                          <td>
                            <div className="flex items-center gap-xs">
                              <Calendar size={14} style={{ opacity: 0.6 }} />
                              {pm.payment_date}
                            </div>
                          </td>
                          <td className="color-green font-semibold">
                            {formatMoney(pm.amount)}
                          </td>
                          <td>
                            <Badge variant="secondary">{pm.payment_method}</Badge>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {pm.notes || '—'}
                          </td>
                          <td>
                            <Button size="sm" variant="secondary" icon={Printer} onClick={() => handlePrintReceiptPrompt(pm)}>
                              Print Receipt
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="table-empty">
                          No payments recorded in ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= MAIN REGISTER GRID VIEW ================= */
        <>
          {/* Metrics summary cards */}
          <div className="grid grid-cols-4" style={{ marginBottom: '24px' }}>
            <div className="card metric-card">
              <div className="metric-icon-bg primary">
                <DollarSign size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">School Tuition Charged</span>
                <span className="metric-value">{formatMoney(stats.totalCharged)}</span>
                <span className="metric-change positive">Total fee obligations</span>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-icon-bg success">
                <CheckCircle size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Total Fees Collected</span>
                <span className="metric-value color-green">{formatMoney(stats.totalPaid)}</span>
                <span className="metric-change positive">Total deposits received</span>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-icon-bg error">
                <AlertCircle size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Outstanding Balances</span>
                <span className="metric-value color-error">{formatMoney(stats.totalOutstanding)}</span>
                <span className="metric-change warning">School receivable assets</span>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-icon-bg accent">
                <TrendingUp size={22} />
              </div>
              <div className="metric-details">
                <span className="metric-label">Collection Rate</span>
                <span className="metric-value">{collectionRate}%</span>
                <span className="metric-change positive">Receipt percentage</span>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          <div className="card filter-panel" style={{ padding: '16px', marginBottom: '20px' }}>
            <div className="flex gap-md items-center filter-layout" style={{ flexWrap: 'wrap' }}>
              <div className="form-group flex-grow" style={{ minWidth: '250px', marginBottom: 0 }}>
                <div className="search-input-wrapper" style={{ position: 'relative' }}>
                  <Search size={18} className="search-icon-inside" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '38px', width: '100%' }}
                    placeholder="Search student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ minWidth: '160px', marginBottom: 0 }}>
                <select className="form-select" style={{ width: '100%' }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                  <option value="All">All Grades</option>
                  {classes.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ minWidth: '160px', marginBottom: 0 }}>
                <select className="form-select" style={{ width: '100%' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Outstanding">Outstanding</option>
                  <option value="Unallocated Credit">Unallocated Credit</option>
                  <option value="No Fee Assigned">No Fee Assigned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Table Register */}
          <div className="card" style={{ padding: 0 }}>
            <Table
              data={filteredTuition}
              columns={columns}
              searchPlaceholder="Use toolbar above to search registry..."
              searchKey="student_name"
            />
          </div>
        </>
      )}

      {/* ================= MODALS ================= */}

      {/* Modify Tuition Charge Modal */}
      {selectedStudent && (
        <Modal
          isOpen={isEditFeesOpen}
          onClose={() => setIsEditFeesOpen(false)}
          title="Modify Student Tuition Charge"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditFeesOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveFees}>Apply Changes</Button>
            </>
          }
        >
          <form onSubmit={handleSaveFees} className="flex flex-col gap-md">
            <div className="form-group">
              <label className="form-label">Student Name</label>
              <input type="text" className="form-input" disabled value={selectedStudent.student_name} />
            </div>

            <div className="form-group">
              <label className="form-label">Total Charged Fee Amount ({currencySetting === 'GHS' ? '₵' : '$'})</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="e.g. 1200"
                value={totalChargedInput}
                onChange={(e) => setTotalChargedInput(e.target.value)}
              />
              <span className="welcome-subtext" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                Specify the gross tuition and facility fee charges assigned to this student registry card.
              </span>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Collection Payment Modal */}
      {selectedStudent && (
        <Modal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          title="Record Collection Receipt"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsRecordPaymentOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSavePayment}>Log Collection Payment</Button>
            </>
          }
        >
          <form onSubmit={handleSavePayment} className="flex flex-col gap-md">
            {selectedStudent.total_charged <= 0 && (
              <div style={{ padding: '10px 12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#f59e0b' }} />
                Note: No tuition fee has been assigned to this student yet. Recording this payment will be logged as an <strong>Unallocated Credit</strong>.
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Student Name</label>
              <input type="text" className="form-input" disabled value={selectedStudent.student_name} />
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="form-group">
                <label className="form-label">Payment Amount ({currencySetting === 'GHS' ? '₵' : '$'})</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 300"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={methodInput} onChange={(e) => setMethodInput(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money (Ghana)</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card Payment</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Reference (Optional)</label>
              <textarea
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Reference numbers, receipts, terms info..."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {selectedPaymentForReceipt && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="Official Tuition Payment Receipt"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsReceiptModalOpen(false)}>Close</Button>
              <Button variant="primary" icon={Printer} onClick={handlePrintReceiptWindow}>Print Receipt</Button>
            </>
          }
        >
          <div id="printable-receipt-area" style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4f46e5', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {schoolLogo ? (
                  <img src={schoolLogo} alt="WTA Logo" style={{ maxHeight: '48px', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '32px' }}>🌳</span>
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b' }}>WISDOM TREE ACADEMY</h2>
                  <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>Official Tuition Payment Receipt</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5' }}>
                  RECEIPT #{selectedPaymentForReceipt.payment.id ? `REC-${selectedPaymentForReceipt.payment.id.slice(0, 8).toUpperCase()}` : 'REC-OFFLINE'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Date: {selectedPaymentForReceipt.payment.payment_date}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '12px', marginBottom: '20px' }}>
              <div><strong>Student Name:</strong> {selectedPaymentForReceipt.student.student_name}</div>
              <div><strong>Roll Number:</strong> {selectedPaymentForReceipt.student.roll_number}</div>
              <div><strong>Classroom / Grade:</strong> {selectedPaymentForReceipt.student.student_class}</div>
              <div><strong>Payment Method:</strong> {selectedPaymentForReceipt.payment.payment_method}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#e0e7ff', color: '#3730a3', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #c7d2fe' }}>Description</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #c7d2fe', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Amount Paid in Transaction</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                    {formatMoney(selectedPaymentForReceipt.payment.amount)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Total Tuition &amp; Fees Charged</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                    {formatMoney(selectedPaymentForReceipt.student.total_charged)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Total Paid to Date</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>
                    {formatMoney(selectedPaymentForReceipt.student.amount_paid)}
                  </td>
                </tr>
                <tr style={{ fontWeight: 'bold', background: '#f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>Outstanding Balance Remaining</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: selectedPaymentForReceipt.student.outstanding > 0 ? '#dc2626' : '#16a34a' }}>
                    {formatMoney(selectedPaymentForReceipt.student.outstanding)}
                  </td>
                </tr>
              </tbody>
            </table>

            {selectedPaymentForReceipt.payment.notes && (
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '20px' }}>
                <strong>Notes / Reference:</strong> {selectedPaymentForReceipt.payment.notes}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '40px' }}>
                  Received By: <strong>{user?.name || user?.username || 'System Administrator'}</strong> ({user?.role?.toUpperCase() || 'ADMIN'})
                </div>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
                  Staff Authorized Signature
                </div>
              </div>
              <div>
                <div style={{ height: '40px' }}></div>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
                  Parent / Payer Signature
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TuitionFees;
