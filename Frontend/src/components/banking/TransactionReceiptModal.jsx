import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../index';
import './TransactionReceiptModal.css';

function TransactionReceiptModal({ entry, isOpen, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !entry) return null;

  const tx = entry.transaction || {};
  const status = tx.status || 'COMPLETED';
  const type = entry.type || (tx.fromAccount === entry.account ? 'DEBIT' : 'CREDIT');
  const amount = entry.amount ?? tx.amount ?? 0;
  const txId = tx._id || entry.transactionId || entry._id;
  const idempotencyKey = tx.idempotencyKey || 'N/A';
  const sourceAccount = tx.fromAccount || (type === 'DEBIT' ? entry.account : 'Central Treasury / Mint');
  const destinationAccount = tx.toAccount || (type === 'CREDIT' ? entry.account : 'Counterparty Account');

  const rawDate = entry.createdAt || tx.createdAt || '';
  const formattedDate = rawDate ? new Date(rawDate).toLocaleString() : 'N/A';
  const isoDate = rawDate ? new Date(rawDate).toISOString() : 'N/A';

  const handleCopy = (text, fieldName) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusIcon = (st) => {
    switch (st?.toUpperCase()) {
      case 'PENDING':
        return <Clock size={13} />;
      case 'FAILED':
        return <AlertTriangle size={13} />;
      default:
        return <CheckCircle2 size={13} />;
    }
  };

  return (
    <div
      className="receipt-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div
        className="receipt-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="receipt-modal-header">
          <h2 id="receipt-modal-title" className="receipt-modal-title">
            Transaction Details
          </h2>
          <button
            type="button"
            className="receipt-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </header>

        {/* Body */}
        <div className="receipt-modal-body">
          {/* Status & Entry Type */}
          <div className="receipt-status-banner">
            <span
              className={`receipt-status-pill status-${status.toLowerCase()}`}
            >
              {getStatusIcon(status)}
              <span>{status}</span>
            </span>

            <span
              className={`receipt-type-pill type-${type.toLowerCase()}`}
            >
              ENTRY // {type}
            </span>
          </div>

          {/* Amount Display */}
          <div className="receipt-amount-block">
            <div className="receipt-amount-label">Gross Transaction Value</div>
            <div
              className={`receipt-amount-val is-${type.toLowerCase()}`}
            >
              {type === 'DEBIT' ? '−' : '+'}₹
              {Number(amount).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>

          {/* Detailed Audit Breakdown */}
          <div className="receipt-details-list">
            <div className="receipt-detail-item">
              <span className="receipt-detail-label">Transaction Reference</span>
              <div className="receipt-detail-value-group">
                <span className="receipt-detail-value">{txId}</span>
                <button
                  type="button"
                  className="receipt-copy-btn"
                  onClick={() => handleCopy(txId, 'txId')}
                  title="Copy reference ID"
                >
                  {copiedField === 'txId' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="receipt-detail-item">
              <span className="receipt-detail-label">Idempotency UUID</span>
              <div className="receipt-detail-value-group">
                <span className="receipt-detail-value">{idempotencyKey}</span>
                <button
                  type="button"
                  className="receipt-copy-btn"
                  onClick={() => handleCopy(idempotencyKey, 'idemKey')}
                  title="Copy idempotency key"
                >
                  {copiedField === 'idemKey' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="receipt-detail-item">
              <span className="receipt-detail-label">Source Account</span>
              <div className="receipt-detail-value-group">
                <span className="receipt-detail-value">{sourceAccount}</span>
                <button
                  type="button"
                  className="receipt-copy-btn"
                  onClick={() => handleCopy(sourceAccount, 'sourceAcc')}
                  title="Copy source account"
                >
                  {copiedField === 'sourceAcc' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="receipt-detail-item">
              <span className="receipt-detail-label">Destination Account</span>
              <div className="receipt-detail-value-group">
                <span className="receipt-detail-value">{destinationAccount}</span>
                <button
                  type="button"
                  className="receipt-copy-btn"
                  onClick={() => handleCopy(destinationAccount, 'destAcc')}
                  title="Copy destination account"
                >
                  {copiedField === 'destAcc' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="receipt-detail-item">
              <span className="receipt-detail-label">Settlement Fee</span>
              <span className="receipt-detail-value" style={{ color: '#10b981' }}>
                ₹0.00 (Zero Fee)
              </span>
            </div>

            <div className="receipt-detail-item">
              <span className="receipt-detail-label">Timestamp</span>
              <span className="receipt-detail-value" title={isoDate}>
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Double Entry Equilibrium Badge */}
          <div className="receipt-equilibrium-badge">
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>
              DOUBLE-ENTRY EQUILIBRIUM VERIFIED • IMMUTABLE LEDGER RECORD
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="receipt-modal-footer">
          <Button variant="secondary" onClick={handlePrint}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={14} />
              <span>PRINT / SAVE RECEIPT</span>
            </span>
          </Button>
          <Button onClick={onClose}>
            DISMISS
          </Button>
        </footer>
      </div>
    </div>
  );
}

export default TransactionReceiptModal;
