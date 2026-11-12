import React from 'react';
import './OverviewStatCards.css';

export function OverviewStatCards({ data, loading, error }) {
  if (loading) {
    return (
      <div className="overview-stats-grid">
        {['TOTAL CREDITS', 'TOTAL DEBITS', 'TRANSACTIONS', 'CREDIT COUNT', 'DEBIT COUNT'].map((title, i) => (
          <div key={i} className="overview-stat-card">
            <span className="overview-stat-label">{title}</span>
            <span className="overview-stat-value" style={{ color: '#6b6b73', fontSize: '20px' }}>
              Loading...
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-stats-loading" style={{ color: '#ff6b6b' }}>
        {error}
      </div>
    );
  }

  const {
    totalCredits = 0,
    totalDebits = 0,
    totalTransactions = 0,
    creditCount = 0,
    debitCount = 0,
  } = data || {};

  const formatINR = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatCount = (val) => {
    return Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div className="overview-stats-grid">
      <div className="overview-stat-card">
        <span className="overview-stat-label">TOTAL CREDITS</span>
        <span className="overview-stat-value is-credit">{formatINR(totalCredits)}</span>
      </div>

      <div className="overview-stat-card">
        <span className="overview-stat-label">TOTAL DEBITS</span>
        <span className="overview-stat-value is-debit">{formatINR(totalDebits)}</span>
      </div>

      <div className="overview-stat-card">
        <span className="overview-stat-label">TOTAL TRANSACTIONS</span>
        <span className="overview-stat-value is-count">{formatCount(totalTransactions)}</span>
      </div>

      <div className="overview-stat-card">
        <span className="overview-stat-label">CREDIT COUNT</span>
        <span className="overview-stat-value is-count">{formatCount(creditCount)}</span>
      </div>

      <div className="overview-stat-card">
        <span className="overview-stat-label">DEBIT COUNT</span>
        <span className="overview-stat-value is-count">{formatCount(debitCount)}</span>
      </div>
    </div>
  );
}

export default OverviewStatCards;

