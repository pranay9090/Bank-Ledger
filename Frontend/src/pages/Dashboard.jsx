import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  ReceiptText,
  Copy,
  Check,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import accountService from '../services/accountService';
import transactionService from '../services/transactionService';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Load user's account details and aggregated balance
  useEffect(() => {
    let isMounted = true;
    async function loadAccount() {
      try {
        const data = await accountService.getAccount();
        if (isMounted) {
          setAccount(data);
        }
      } catch {
        // Fallback gracefully if account cannot be fetched
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAccount();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load last 5 transactions
  useEffect(() => {
    let isMounted = true;
    transactionService
      .getTransactions()
      .then((data) => {
        if (isMounted) {
          setRecentEntries((data || []).slice(0, 5));
        }
      })
      .catch(() => {
        // Fallback gracefully if transactions cannot be fetched
      })
      .finally(() => {
        if (isMounted) setLoadingEntries(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyAccountId = () => {
    if (account?._id) {
      navigator.clipboard.writeText(account._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to split balance into whole rupees and paise for visual hierarchy
  const formatBalance = (val) => {
    const num = Number(val ?? 0);
    const formatted = num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const parts = formatted.split('.');
    return {
      whole: parts[0] || '0',
      paise: parts[1] || '00',
    };
  };

  const { whole, paise } = formatBalance(account?.balance);

  const formatDate = (raw) => {
    if (!raw) return 'N/A';
    try {
      const d = new Date(raw);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="dashboard-page">
      {/* 1. HEADER: Page title + top-right white primary action button */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          Welcome, {user?.name || 'Client'}
        </h1>

        <Link to="/transfer" className="dashboard-primary-btn">
          <ArrowLeftRight size={14} />
          <span>TRANSFER FUNDS</span>
        </Link>
      </header>

      {/* 2. BALANCE HERO CARD (full width, --surface, padding: 48px) */}
      <div className="dashboard-hero-card">
        {/* Subtle top-right white corner glow */}
        <div className="dashboard-hero-glow" aria-hidden="true" />

        {/* Small label TOTAL BALANCE */}
        <div className="dashboard-hero-label">
          TOTAL BALANCE
        </div>

        {/* Balance amount with clamp, muted ₹ symbol and muted .00 paise at 50% size */}
        <div className="dashboard-balance-display">
          {loading ? (
            <span className="dashboard-balance-loading">Computing...</span>
          ) : (
            <>
              <span className="dashboard-balance-symbol">₹</span>
              <span>{whole}</span>
              <span className="dashboard-balance-paise">.{paise}</span>
            </>
          )}
        </div>

        {/* Below balance: Account ID in monospace with copy button */}
        <div className="dashboard-account-row">
          <span className="dashboard-account-tag">ACCOUNT</span>
          {account?._id ? (
            <button
              type="button"
              onClick={handleCopyAccountId}
              className={`dashboard-copy-account-btn ${copied ? 'is-copied' : ''}`}
              title="Copy account ID to clipboard"
            >
              <span>{account._id}</span>
              {copied ? <Check size={13} color="#3ddc97" /> : <Copy size={13} color="#9a9aa2" />}
            </button>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', color: '#9a9aa2' }}>
              Loading...
            </span>
          )}
        </div>
      </div>

      {/* 4. QUICK ACTIONS: row of two equal cards with hover lift */}
      <div className="dashboard-quick-actions">
        <Link to="/transfer" className="dashboard-action-card">
          <div className="dashboard-action-left">
            <div className="dashboard-action-icon-box">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <div className="dashboard-action-title">Send money</div>
              <div className="dashboard-action-desc">Transfer to another account</div>
            </div>
          </div>
          <ArrowRight size={18} className="dashboard-action-arrow" />
        </Link>

        <Link to="/transactions" className="dashboard-action-card">
          <div className="dashboard-action-left">
            <div className="dashboard-action-icon-box">
              <ReceiptText size={20} />
            </div>
            <div>
              <div className="dashboard-action-title">View history</div>
              <div className="dashboard-action-desc">See all credits and debits</div>
            </div>
          </div>
          <ArrowRight size={18} className="dashboard-action-arrow" />
        </Link>
      </div>

      {/* 5. RECENT ACTIVITY: listing the last 5 ledger entries */}
      <div className="dashboard-activity-card">
        <div className="dashboard-activity-header">
          <h2 className="dashboard-activity-title">Recent activity</h2>
          <Link to="/transactions" className="dashboard-activity-view-all">
            <span>View all</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loadingEntries ? (
          <div className="dashboard-activity-empty">Loading entries...</div>
        ) : recentEntries.length === 0 ? (
          <div className="dashboard-activity-empty">No transactions yet</div>
        ) : (
          <div className="dashboard-activity-list">
            {recentEntries.map((entry) => {
              const tx = entry.transaction || {};
              const txId = tx._id || entry.transactionId || entry._id;
              const isCredit = entry.type === 'CREDIT';
              const shortId = txId ? `${String(txId).slice(0, 10)}...` : 'tx_record';
              const dateStr = formatDate(entry.createdAt);
              const numericAmt = Number(entry.amount || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              });

              return (
                <Link
                  key={entry._id}
                  to="/transactions"
                  className="dashboard-activity-row"
                  title="Click to view details in ledger history"
                >
                  <div className="dashboard-activity-row-left">
                    <div
                      className={`dashboard-activity-icon-badge ${
                        isCredit ? 'is-credit' : 'is-debit'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </div>

                    <div className="dashboard-activity-info">
                      <span className="dashboard-activity-txid">{shortId}</span>
                      <span className="dashboard-activity-date">{dateStr}</span>
                    </div>
                  </div>

                  <div
                    className={`dashboard-activity-amount ${
                      isCredit ? 'is-credit' : 'is-debit'
                    }`}
                  >
                    {isCredit ? '+' : '−'}₹{numericAmt}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
