import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Download,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import analyticsService from '../services/analyticsService';
import accountService from '../services/accountService';
import { useAuth } from '../context/useAuth';
import OverviewStatCards from '../components/analytics/OverviewStatCards';
import './Analytics.css';

// Helper for Indian Rupee currency formatting
const formatCurrency = (val) => {
  return `₹${Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Helper for Month format (e.g. "2026-09" -> "Sep 2026")
const formatMonthLabel = (monthStr) => {
  if (!monthStr) return '';
  const parts = String(monthStr).split('-');
  if (parts.length >= 2) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const date = new Date(year, month, 1);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }
  return monthStr;
};

// Helper to format Date (e.g. "2026-11-10" -> "10 Nov 2026")
const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return dateStr;
};

// Dark-themed custom tooltip for Recharts
function DarkTooltip({ active, payload, label, isCurrency = true }) {
  if (active && payload && payload.length) {
    return (
      <div className="analytics-custom-tooltip">
        <div className="analytics-tooltip-label">{label}</div>
        {payload.map((item, idx) => (
          <div key={idx} className="analytics-tooltip-item">
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                backgroundColor: item.color || item.fill,
                borderRadius: '50%',
              }}
            />
            <span style={{ color: '#9a9aa2' }}>{item.name}:</span>
            <span style={{ color: item.color || item.fill, fontWeight: 600 }}>
              {isCurrency ? formatCurrency(item.value) : Number(item.value).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function Analytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Tab 1: Overview State
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  // Tab 2: Monthly State
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState('');

  // Tab 3: Daily State
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const defaultRange = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [dateError, setDateError] = useState('');
  const [dailyData, setDailyData] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState('');

  // Tab 4: Statement State
  const [accountId, setAccountId] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState('');

  // 1. Fetch Overview when Overview tab opens
  const fetchOverview = useCallback(async () => {
    if (overviewData) return;
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const data = await analyticsService.getOverview();
      setOverviewData(data);
    } catch (err) {
      setOverviewError(err.response?.data?.message || 'Failed to retrieve overview analytics.');
    } finally {
      setOverviewLoading(false);
    }
  }, [overviewData]);

  // 2. Fetch Monthly when Monthly tab opens
  const fetchMonthly = useCallback(async () => {
    if (monthlyData) return;
    setMonthlyLoading(true);
    setMonthlyError('');
    try {
      const data = await analyticsService.getMonthly();
      setMonthlyData(data);
    } catch (err) {
      setMonthlyError(err.response?.data?.message || 'Failed to retrieve monthly analytics.');
    } finally {
      setMonthlyLoading(false);
    }
  }, [monthlyData]);

  // 3. Fetch Daily
  const fetchDaily = useCallback(async (start, end) => {
    if (start && end && start > end) {
      setDateError('Start date cannot be after end date.');
      return;
    }
    setDateError('');
    setDailyLoading(true);
    setDailyError('');
    try {
      const data = await analyticsService.getDaily(start, end);
      setDailyData(data);
    } catch (err) {
      setDailyError(err.response?.data?.message || 'Failed to retrieve daily analytics.');
    } finally {
      setDailyLoading(false);
    }
  }, []);

  // 4. Fetch Statement
  const fetchStatement = useCallback(async () => {
    if (statementData) return;
    setStatementLoading(true);
    setStatementError('');
    try {
      let targetAccId = accountId;
      if (!targetAccId) {
        const acc = await accountService.getAccount();
        targetAccId = acc?._id;
        setAccountId(targetAccId);
      }

      if (!targetAccId) {
        setStatementError('No active account found to generate statement.');
        return;
      }

      const data = await analyticsService.getAccountStatement(targetAccId);
      setStatementData(data);
    } catch (err) {
      setStatementError(err.response?.data?.message || 'Failed to retrieve account statement.');
    } finally {
      setStatementLoading(false);
    }
  }, [accountId, statementData]);

  // Fetch only when tab is opened
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    } else if (activeTab === 'monthly') {
      fetchMonthly();
    } else if (activeTab === 'daily') {
      if (!dailyData) {
        fetchDaily(startDate, endDate);
      }
    } else if (activeTab === 'statement') {
      fetchStatement();
    }
  }, [activeTab, fetchOverview, fetchMonthly, fetchDaily, fetchStatement, dailyData, startDate, endDate]);

  const handleApplyDailyRange = (e) => {
    e.preventDefault();
    fetchDaily(startDate, endDate);
  };

  // Donut chart dataset for Overview tab
  const donutData = [
    { name: 'Credit Transactions', value: overviewData?.creditCount || 0, color: '#3ddc97' },
    { name: 'Debit Transactions', value: overviewData?.debitCount || 0, color: '#ff6b6b' },
  ];
  const totalVolumeCount = (overviewData?.creditCount || 0) + (overviewData?.debitCount || 0);

  const handleDownloadPDF = () => {
    if (!statementData || statementData.length === 0) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // 182mm

    // Avoids Unicode '₹' corruption in standard jsPDF fonts
    const formatPDFCurrency = (val) => {
      const num = Number(val || 0);
      return `INR ${num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    // Calculate Statement Totals
    let totalCredits = 0;
    let totalDebits = 0;
    statementData.forEach((row) => {
      const amt = Number(row.amount || 0);
      if (row.type === 'CREDIT') totalCredits += amt;
      else if (row.type === 'DEBIT') totalDebits += amt;
    });

    const closingBalance = statementData[statementData.length - 1]?.balanceAfter || 0;
    const generatedDate = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // 1. Sleek Top Accent Bar
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // 2. Executive Header (Bank Ledger Letterhead)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39); // #111827
    doc.text('BANK LEDGER', margin, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128); // #6b7280
    doc.text('INSTITUTIONAL DOUBLE-ENTRY AUDIT RECORD // ACID SECURED', margin, 24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('OFFICIAL ACCOUNT STATEMENT', pageWidth - margin, 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${generatedDate}`, pageWidth - margin, 24, { align: 'right' });

    // Subtle header divider
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, 28, pageWidth - margin, 28);

    // 3. Client & Statement Summary Cards (Side by side)
    const boxY = 33;
    const boxHeight = 35;
    const halfWidth = (contentWidth - 6) / 2;

    // Left Card: Account Metadata
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, boxY, halfWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('ACCOUNT HOLDER', margin + 6, boxY + 7);
    doc.text('ACCOUNT IDENTIFIER', margin + 6, boxY + 18);
    doc.text('LEDGER PROTOCOL', margin + 6, boxY + 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(String(user?.name || 'Verified Client'), margin + 6, boxY + 12);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text(String(accountId || 'primary_account'), margin + 6, boxY + 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text('Double-Entry Real-Time Reconciled (INR)', margin + 6, boxY + 32);

    // Right Card: Financial Closing Totals
    const rightX = margin + halfWidth + 6;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(rightX, boxY, halfWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('TOTAL CREDITS', rightX + 6, boxY + 7);
    doc.text('TOTAL DEBITS', rightX + 6, boxY + 16);
    doc.text('NET CLOSING BALANCE', rightX + 6, boxY + 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61); // #15803d
    doc.text(`+ ${formatPDFCurrency(totalCredits)}`, rightX + halfWidth - 6, boxY + 7, { align: 'right' });

    doc.setTextColor(185, 28, 28); // #b91c1c
    doc.text(`- ${formatPDFCurrency(totalDebits)}`, rightX + halfWidth - 6, boxY + 16, { align: 'right' });

    doc.setFontSize(10.5);
    doc.setTextColor(17, 24, 39);
    doc.text(formatPDFCurrency(closingBalance), rightX + halfWidth - 6, boxY + 26, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Total Records: ${statementData.length} entries`, rightX + 6, boxY + 32);

    // 4. Statement Table
    let tableY = 74;

    const drawTableHeader = (y) => {
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y + 8, margin + contentWidth, y + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text('DATE', margin + 4, y + 5.5);
      doc.text('TYPE', margin + 35, y + 5.5);
      doc.text('AMOUNT', margin + 110, y + 5.5, { align: 'right' });
      doc.text('RUNNING BALANCE', margin + contentWidth - 4, y + 5.5, { align: 'right' });
    };

    drawTableHeader(tableY);
    tableY += 8;

    statementData.forEach((row, i) => {
      // Page break calculation
      if (tableY > pageHeight - 22) {
        doc.addPage();

        doc.setFillColor(9, 9, 11);
        doc.rect(0, 0, pageWidth, 4, 'F');

        tableY = 16;
        drawTableHeader(tableY);
        tableY += 8;
      }

      // Alternating row zebra striping
      if (i % 2 === 1) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, tableY, contentWidth, 7.5, 'F');
      }

      const isCredit = row.type === 'CREDIT';

      // Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      doc.text(formatDateLabel(row.date), margin + 4, tableY + 5);

      // Type Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (isCredit) {
        doc.setTextColor(21, 128, 61);
        doc.text('CREDIT', margin + 35, tableY + 5);
      } else {
        doc.setTextColor(185, 28, 28);
        doc.text('DEBIT', margin + 35, tableY + 5);
      }

      // Amount (right aligned with plenty of space)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (isCredit) {
        doc.setTextColor(21, 128, 61);
        doc.text(`+ ${formatPDFCurrency(row.amount)}`, margin + 110, tableY + 5, { align: 'right' });
      } else {
        doc.setTextColor(185, 28, 28);
        doc.text(`- ${formatPDFCurrency(row.amount)}`, margin + 110, tableY + 5, { align: 'right' });
      }

      // Running Balance (right aligned safely within table bounds)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(formatPDFCurrency(row.balanceAfter), margin + contentWidth - 4, tableY + 5, { align: 'right' });

      // Subtle row border line
      doc.setDrawColor(243, 244, 246);
      doc.line(margin, tableY + 7.5, margin + contentWidth, tableY + 7.5);

      tableY += 7.5;
    });

    // 5. Official Cryptographic Footers across all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(
        'CONFIDENTIAL // BANK LEDGER CRYPTOGRAPHIC DOUBLE-ENTRY AUDIT STATEMENT',
        margin,
        pageHeight - 7.5
      );
      doc.text(`Page ${p} of ${totalPages}`, margin + contentWidth, pageHeight - 7.5, { align: 'right' });
    }

    doc.save(`Bank_Ledger_Statement_${accountId || 'account'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="analytics-page">
      {/* Page Header */}
      <div className="analytics-header">
        <h1 className="analytics-title">Ledger Analytics</h1>
        <p className="analytics-subtitle">
          Real-time financial intelligence, volumetric breakdown, and audit statements.
        </p>
      </div>

      {/* Tabs Toolbar */}
      <div className="analytics-tabs-toolbar">
        <div className="analytics-tabs-group">
          {[
            { id: 'overview', label: 'OVERVIEW' },
            { id: 'monthly', label: 'MONTHLY' },
            { id: 'daily', label: 'DAILY' },
            { id: 'statement', label: 'STATEMENT' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`analytics-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="analytics-meta-badge">
          <TrendingUp size={14} color="#9a9aa2" />
          <span>RECONCILED IN REAL TIME</span>
        </div>
      </div>

      {/* ======================================================================
          TAB 1: OVERVIEW
          ====================================================================== */}
      {activeTab === 'overview' && (
        <div className="analytics-tab-content">
          <OverviewStatCards
            data={overviewData}
            loading={overviewLoading}
            error={overviewError}
          />

          <div className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <h2 className="analytics-card-title">Transaction Distribution</h2>
                <p className="analytics-card-desc">
                  Proportion of credit deposits versus debit disbursements.
                </p>
              </div>
            </div>

            {overviewLoading ? (
              <div className="analytics-state-box">Loading distribution chart...</div>
            ) : overviewError ? (
              <div className="analytics-state-box is-error">{overviewError}</div>
            ) : totalVolumeCount === 0 ? (
              <div className="analytics-state-box">No data available</div>
            ) : (
              <div className="analytics-donut-container">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip isCurrency={false} />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => (
                        <span style={{ color: '#c9c9ce', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                          {val}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB 2: MONTHLY
          ====================================================================== */}
      {activeTab === 'monthly' && (
        <div className="analytics-tab-content">
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <h2 className="analytics-card-title">Monthly Cash Flow</h2>
                <p className="analytics-card-desc">
                  Aggregated credits and debits grouped on a month-by-month basis.
                </p>
              </div>
            </div>

            {monthlyLoading ? (
              <div className="analytics-state-box">Loading monthly trends...</div>
            ) : monthlyError ? (
              <div className="analytics-state-box is-error">{monthlyError}</div>
            ) : !monthlyData || monthlyData.length === 0 ? (
              <div className="analytics-state-box">No data available</div>
            ) : (
              <div className="analytics-chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                    <XAxis
                      dataKey="month"
                      stroke="#6b6b73"
                      tickFormatter={formatMonthLabel}
                      tick={{ fill: '#9a9aa2', fontSize: 12, fontFamily: 'Outfit' }}
                    />
                    <YAxis
                      stroke="#6b6b73"
                      tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                      tick={{ fill: '#9a9aa2', fontSize: 12, fontFamily: 'Outfit' }}
                    />
                    <Tooltip content={<DarkTooltip isCurrency={true} />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => (
                        <span style={{ color: '#c9c9ce', fontSize: '12px', fontFamily: 'Outfit, sans-serif', textTransform: 'capitalize' }}>
                          {val}
                        </span>
                      )}
                    />
                    <Bar dataKey="credits" name="Credits" fill="#3ddc97" radius={[2, 2, 0, 0]} maxBarSize={48} />
                    <Bar dataKey="debits" name="Debits" fill="#ff6b6b" radius={[2, 2, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB 3: DAILY
          ====================================================================== */}
      {activeTab === 'daily' && (
        <div className="analytics-tab-content">
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <h2 className="analytics-card-title">Daily Fluctuation</h2>
                <p className="analytics-card-desc">
                  Day-over-day credits and debits progression for the selected timeframe.
                </p>
              </div>
            </div>

            {/* Date Range Picker Bar */}
            <form onSubmit={handleApplyDailyRange} className="analytics-daily-filter-bar">
              <div className="analytics-date-field">
                <label htmlFor="daily-start-date" className="analytics-date-label">
                  START DATE
                </label>
                <input
                  id="daily-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="analytics-date-input"
                />
              </div>

              <div className="analytics-date-field">
                <label htmlFor="daily-end-date" className="analytics-date-label">
                  END DATE
                </label>
                <input
                  id="daily-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="analytics-date-input"
                />
              </div>

              <button type="submit" className="analytics-apply-btn">
                APPLY
              </button>
            </form>

            {dateError && <div className="analytics-filter-error">{dateError}</div>}

            {dailyLoading ? (
              <div className="analytics-state-box">Loading daily metrics...</div>
            ) : dailyError ? (
              <div className="analytics-state-box is-error">{dailyError}</div>
            ) : !dailyData || dailyData.length === 0 ? (
              <div className="analytics-state-box">No data available</div>
            ) : (
              <div className="analytics-chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={dailyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b6b73"
                      tickFormatter={formatDateLabel}
                      tick={{ fill: '#9a9aa2', fontSize: 12, fontFamily: 'Outfit' }}
                    />
                    <YAxis
                      stroke="#6b6b73"
                      tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                      tick={{ fill: '#9a9aa2', fontSize: 12, fontFamily: 'Outfit' }}
                    />
                    <Tooltip content={<DarkTooltip isCurrency={true} />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => (
                        <span style={{ color: '#c9c9ce', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                          {val}
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="credits"
                      name="Credits"
                      stroke="#3ddc97"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#3ddc97' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="debits"
                      name="Debits"
                      stroke="#ff6b6b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#ff6b6b' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB 4: STATEMENT
          ====================================================================== */}
      {activeTab === 'statement' && (
        <div className="analytics-tab-content">
          <div className="analytics-card" style={{ padding: 0 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="analytics-card-title">Chronological Account Statement</h2>
                <p className="analytics-card-desc">
                  Running ledger statement showing debit, credit, and post-transaction balance.
                </p>
              </div>

              <button
                type="button"
                className="analytics-export-pdf-btn"
                onClick={handleDownloadPDF}
                disabled={statementLoading || !statementData || statementData.length === 0}
                title="Download printable executive statement"
              >
                <Download size={14} />
                <span>DOWNLOAD PDF</span>
              </button>
            </div>

            {statementLoading ? (
              <div className="analytics-state-box">Compiling account statement...</div>
            ) : statementError ? (
              <div className="analytics-state-box is-error">{statementError}</div>
            ) : !statementData || statementData.length === 0 ? (
              <div className="analytics-state-box">No data available</div>
            ) : (
              <div className="analytics-table-card">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>TYPE</th>
                      <th>AMOUNT</th>
                      <th>BALANCE AFTER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.map((row, idx) => {
                      const isCredit = row.type === 'CREDIT';
                      return (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px' }}>
                            {formatDateLabel(row.date)}
                          </td>
                          <td>
                            <span className={isCredit ? 'analytics-badge-credit' : 'analytics-badge-debit'}>
                              {row.type}
                            </span>
                          </td>
                          <td className={isCredit ? 'analytics-amt-credit' : 'analytics-amt-debit'}>
                            {isCredit ? `+${formatCurrency(row.amount)}` : `-${formatCurrency(row.amount)}`}
                          </td>
                          <td className="analytics-amt-balance">
                            {formatCurrency(row.balanceAfter)}
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
      )}
    </div>
  );
}

export default Analytics;

