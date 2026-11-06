import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Check,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components';
import accountService from '../services/accountService';
import transactionService from '../services/transactionService';
import './Transfer.css';

function Transfer() {
  const navigate = useNavigate();

  // Account State
  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  // Form Parameters
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Workflow Steps: 'input' -> 'review' -> 'success'
  const [step, setStep] = useState('input');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedTx, setCompletedTx] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Initial Account Mount
  useEffect(() => {
    let active = true;
    accountService
      .getAccount()
      .then((data) => {
        if (active) setAccount(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
            'Failed to load account information.'
          );
        }
      })
      .finally(() => {
        if (active) setLoadingAccount(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Refresh Account on demand
  const reloadAccount = async () => {
    setLoadingAccount(true);
    try {
      const data = await accountService.getAccount();
      setAccount(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load account information.'
      );
    } finally {
      setLoadingAccount(false);
    }
  };

  // Generates a fresh unique idempotency key
  const refreshIdempotencyKey = () => {
    const newKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setIdempotencyKey(newKey);
  };

  // Quick amount increment chips helper
  const handleQuickAdd = (increment) => {
    const current = Number(amount) || 0;
    setAmount(String(current + increment));
    if (error) setError('');
  };

  // Derived financial figures
  const numericAmount = Number(amount) || 0;
  const currentBalance = account?.balance ?? 0;
  const postBalance = currentBalance - numericAmount;
  const isInsufficient = numericAmount > currentBalance;
  const isSelfTransfer =
    Boolean(account?._id) &&
    Boolean(recipient.trim()) &&
    recipient.trim().toLowerCase() === account._id.toLowerCase();

  const isFormValid =
    Boolean(account?._id) &&
    Boolean(recipient.trim()) &&
    !isSelfTransfer &&
    numericAmount > 0 &&
    !isInsufficient;

  // Form Validation on Review
  const validateForm = () => {
    setError('');

    if (!account?._id) {
      setError('Active source account not found.');
      return false;
    }

    if (!recipient.trim()) {
      setError('Please specify a valid recipient account ID.');
      return false;
    }

    if (isSelfTransfer) {
      setError('Source and Recipient account IDs cannot match.');
      return false;
    }

    if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
      setError('Transfer amount must be a positive number greater than ₹0.00.');
      return false;
    }

    if (isInsufficient) {
      setError(
        `Insufficient funds. Available balance: ₹${currentBalance.toLocaleString(
          'en-IN',
          { minimumFractionDigits: 2 }
        )}.`
      );
      return false;
    }

    return true;
  };

  // Step 1 -> Step 2: Review Transfer
  const handleReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
    }
  };

  // Step 2 -> Step 3: Execute Transfer
  const handleExecute = async () => {
    setError('');
    setSubmitting(true);

    try {
      const response = await transactionService.createTransfer({
        fromAccount: account._id,
        toAccount: recipient.trim(),
        amount: Number(amount),
        idempotencyKey,
      });

      const txPayload = response.Transaction || response;
      const formattedTimestamp = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      setCompletedTx({
        ...txPayload,
        timestamp: formattedTimestamp,
      });

      setStep('success');
      reloadAccount();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Transfer failed. Please check the recipient details and try again.';
      setError(errorMsg);
      setStep('input');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset workflow for another transfer
  const handleReset = () => {
    setRecipient('');
    setAmount('');
    refreshIdempotencyKey();
    setError('');
    setCompletedTx(null);
    setStep('input');
    reloadAccount();
  };

  const handleCopyRef = (refText) => {
    if (!refText) return;
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const getShortId = (id) => {
    if (!id) return '';
    return id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
  };

  const getShortKey = (key) => {
    if (!key) return '';
    return key.length > 8 ? `${key.slice(0, 8)}…` : key;
  };

  return (
    <div className="transfer-page">
      <div className="transfer-container">
        {/* Page Header */}
        <div className="transfer-header">
          <h1 className="transfer-title">Send money</h1>
          <p className="transfer-subtitle">
            Transfer funds to another account.
          </p>
        </div>

        {/* Single Centered Surface Card */}
        <div className="transfer-card">
          {/* Error Alert */}
          {error && (
            <div className="transfer-error-alert" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: INPUT STEP */}
          {step === 'input' && (
            <form onSubmit={handleReview} noValidate>
              {/* FROM row with 1px divider */}
              <div className="transfer-from-row">
                <div className="transfer-from-left">
                  <span className="transfer-from-label">FROM</span>
                  <span className="transfer-from-id">
                    {loadingAccount ? 'Loading...' : getShortId(account?._id)}
                  </span>
                </div>
                <span className="transfer-from-available">
                  Available ₹
                  {(account?.balance ?? 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* TO (ACCOUNT ID) Input */}
              <div className="transfer-field-group">
                <label className="transfer-field-label" htmlFor="recipient-input">
                  TO (ACCOUNT ID)
                </label>
                <input
                  id="recipient-input"
                  type="text"
                  className="transfer-mono-input"
                  placeholder="Paste recipient account ID"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                />
              </div>

              {/* AMOUNT Input */}
              <div className="transfer-field-group">
                <label className="transfer-field-label" htmlFor="amount-input">
                  AMOUNT
                </label>
                <div className="transfer-amount-container">
                  <span className="transfer-amount-prefix">₹</span>
                  <input
                    id="amount-input"
                    type="number"
                    step="any"
                    min="1"
                    className="transfer-amount-input"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (error) setError('');
                    }}
                  />
                </div>

                {/* Quick-add chips */}
                <div className="transfer-chips-row">
                  <button
                    type="button"
                    className="transfer-chip-btn"
                    onClick={() => handleQuickAdd(500)}
                  >
                    +₹500
                  </button>
                  <button
                    type="button"
                    className="transfer-chip-btn"
                    onClick={() => handleQuickAdd(1000)}
                  >
                    +₹1,000
                  </button>
                  <button
                    type="button"
                    className="transfer-chip-btn"
                    onClick={() => handleQuickAdd(5000)}
                  >
                    +₹5,000
                  </button>
                </div>

                {/* Balance after transfer single line */}
                <div
                  className={`transfer-balance-after-line ${
                    isInsufficient ? 'is-insufficient' : ''
                  }`}
                >
                  {isInsufficient
                    ? 'Insufficient balance'
                    : `Balance after transfer: ₹${postBalance.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}`}
                </div>
              </div>

              {/* Primary Button */}
              <Button
                type="submit"
                disabled={!isFormValid || loadingAccount}
              >
                REVIEW TRANSFER
              </Button>

              {/* Collapsed Idempotency Reference Line */}
              <div className="transfer-idempotency-line">
                <span>Reference</span>
                <span className="transfer-idempotency-mono">
                  {getShortKey(idempotencyKey)}
                </span>
                <button
                  type="button"
                  onClick={refreshIdempotencyKey}
                  className="transfer-idempotency-refresh-btn"
                  title="Generate new reference key"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: REVIEW STEP */}
          {step === 'review' && (
            <div>
              <h2 className="transfer-review-title">Confirm transfer</h2>

              <div className="transfer-review-list">
                <div className="transfer-review-row">
                  <span className="transfer-review-label">From</span>
                  <span className="transfer-review-value-mono">
                    {account?._id || 'N/A'}
                  </span>
                </div>

                <div className="transfer-review-row">
                  <span className="transfer-review-label">To</span>
                  <span className="transfer-review-value-mono">
                    {recipient}
                  </span>
                </div>

                <div className="transfer-review-row">
                  <span className="transfer-review-label">Amount</span>
                  <span className="transfer-review-amount">
                    ₹
                    {numericAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="transfer-review-row">
                  <span className="transfer-review-label">Fee</span>
                  <span className="transfer-review-value">₹0.00</span>
                </div>

                <div className="transfer-review-row">
                  <span className="transfer-review-label">Balance after</span>
                  <span className="transfer-review-value">
                    ₹
                    {postBalance.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="transfer-review-actions">
                <Button
                  variant="secondary"
                  onClick={() => setStep('input')}
                  disabled={submitting}
                >
                  BACK
                </Button>
                <Button
                  onClick={handleExecute}
                  loading={submitting}
                  disabled={submitting}
                >
                  CONFIRM & SEND
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS STEP */}
          {step === 'success' && (
            <div className="transfer-success-wrapper">
              <div className="transfer-success-circle">
                <Check size={28} strokeWidth={2.5} />
              </div>

              <h2 className="transfer-success-title">Transfer sent</h2>

              <div className="transfer-success-amount">
                ₹
                {numericAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </div>

              <div className="transfer-success-list">
                <div className="transfer-success-row">
                  <span>Reference</span>
                  <div className="transfer-success-value-group">
                    <span className="transfer-success-ref-mono">
                      {completedTx?._id || idempotencyKey}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyRef(completedTx?._id || idempotencyKey)
                      }
                      className="transfer-success-copy-btn"
                      title="Copy reference ID"
                    >
                      {copiedRef ? (
                        <Check size={13} color="#3ddc97" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="transfer-success-row">
                  <span>Date</span>
                  <span style={{ color: '#ffffff' }}>
                    {completedTx?.timestamp || 'Today'}
                  </span>
                </div>
              </div>

              <div className="transfer-success-actions">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/transactions')}
                >
                  VIEW HISTORY
                </Button>
                <Button onClick={handleReset}>
                  SEND ANOTHER
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transfer;
