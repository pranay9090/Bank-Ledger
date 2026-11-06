import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  ReceiptText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import transactionService from '../services/transactionService';
import TransactionReceiptModal from '../components/banking/TransactionReceiptModal';
import './Transactions.css';

function Transactions() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    transactionService
      .getTransactions()
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
            'Failed to retrieve ledger entries from server.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await transactionService.getTransactions();
      setEntries(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to retrieve ledger entries from server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'ALL') return true;
    return entry.type?.toUpperCase() === filter;
  });

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="transactions-header">
        <h1 className="transactions-title">Ledger Audit Trail</h1>
        <p className="transactions-subtitle">
          Cryptographically verified, immutable record of all debit and credit ledger entries.
        </p>
      </div>

      {/* Toolbar & Filters */}
      <div className="transactions-toolbar">
        <div className="transactions-filter-group">
          {['ALL', 'CREDIT', 'DEBIT'].map((type) => (
            <button
              key={type}
              type="button"
              className={`transactions-filter-btn ${
                filter === type ? 'is-active' : ''
              }`}
              onClick={() => setFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="transactions-meta-badge">
          <ShieldCheck size={14} color="#9a9aa2" />
          <span>PRE-HOOK MUTATION BLOCK ENABLED</span>
          <button
            type="button"
            onClick={handleRefresh}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8E8E9A',
              cursor: 'pointer',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Refresh ledger"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(229, 72, 77, 0.08)',
            border: '1px solid rgba(229, 72, 77, 0.3)',
            color: '#E5484D',
            padding: '12px 16px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="transactions-table-card">
        {loading ? (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Transaction ID</th>
                <th>Entry Type</th>
                <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                <th style={{ textAlign: 'center' }}>Integrity</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((n) => (
                <tr key={n} className="skeleton-row">
                  <td><div className="skeleton-bar" style={{ width: '120px' }} /></td>
                  <td><div className="skeleton-bar" style={{ width: '180px' }} /></td>
                  <td><div className="skeleton-bar" style={{ width: '80px' }} /></td>
                  <td><div className="skeleton-bar" style={{ width: '90px', marginLeft: 'auto' }} /></td>
                  <td><div className="skeleton-bar" style={{ width: '110px', margin: '0 auto' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filteredEntries.length === 0 ? (
          <div className="transactions-empty-card">
            <div className="transactions-empty-icon">
              <ReceiptText size={22} />
            </div>
            <h3 className="transactions-empty-title">
              No ledger movements recorded for this account partition.
            </h3>
            <p className="transactions-empty-subtext">
              {filter === 'ALL'
                ? 'Your account currently has no settled credits or debits in the immutable ledger table.'
                : `No ${filter.toLowerCase()} movements found matching your current filter criteria.`}
            </p>
          </div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Transaction ID</th>
                <th>Entry Type</th>
                <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                <th style={{ textAlign: 'center' }}>Integrity</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const tx = entry.transaction || {};
                const txId = tx._id || entry.transactionId || entry._id;
                const isCredit = entry.type === 'CREDIT';
                const dateStr = entry.createdAt
                  ? new Date(entry.createdAt).toLocaleString()
                  : 'N/A';

                return (
                  <tr
                    key={entry._id}
                    className="transactions-row"
                    onClick={() => handleRowClick(entry)}
                    title="Click to view official audit receipt"
                  >
                    <td className="cell-timestamp">{dateStr}</td>
                    <td className="cell-txid">
                      {txId ? `${String(txId).slice(0, 18)}...` : 'tx_committed'}
                    </td>
                    <td>
                      <span
                        className={`cell-type-badge ${
                          isCredit ? 'is-credit' : 'is-debit'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft size={13} />
                        ) : (
                          <ArrowUpRight size={13} />
                        )}
                        <span>{entry.type}</span>
                      </span>
                    </td>
                    <td
                      className={`cell-amount ${
                        isCredit ? 'is-credit' : 'is-debit'
                      }`}
                    >
                      {isCredit ? '+' : '−'}₹
                      {Number(entry.amount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="cell-integrity">
                      <span className="integrity-pill">
                        VERIFIED IMMUTABLE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        entry={selectedEntry}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
      />
    </div>
  );
}

export default Transactions;
