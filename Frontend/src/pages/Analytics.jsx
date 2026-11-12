import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
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
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="analytics-card-title">Chronological Account Statement</h2>
              <p className="analytics-card-desc">
                Running ledger statement showing debit, credit, and post-transaction balance.
              </p>
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

