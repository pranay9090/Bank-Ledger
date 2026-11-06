import React from 'react';
import './AuthLayout.css';

function AuthLayout({ children, heading, title, subtitle }) {
  const displayHeading = heading || title;

  return (
    <div className="auth-wrapper">
      <div className="auth-split-card">
        {/* Left Showcase Panel - Desktop only */}
        <aside className="auth-showcase-panel" aria-label="Overview">
          <div className="showcase-glow-aura" aria-hidden="true" />

          <div className="showcase-content">
            <header className="showcase-header">
              <span className="showcase-brand-mark">BANK LEDGER</span>
            </header>

            <div className="showcase-editorial">
              <h2 className="showcase-headline">
                Money moves. Every rupee accounted for.
              </h2>
              <p className="showcase-subtext">
                A ledger-based banking backend where every transfer is recorded as a debit and a credit.
              </p>
            </div>

            <div className="showcase-features" role="list">
              <div className="showcase-feature-item" role="listitem">
                <span className="showcase-bullet" aria-hidden="true">•</span>
                <span className="showcase-feature-text">
                  Balances are calculated from your full transaction history
                </span>
              </div>
              <div className="showcase-feature-item" role="listitem">
                <span className="showcase-bullet" aria-hidden="true">•</span>
                <span className="showcase-feature-text">
                  Every transfer is recorded as a matching debit and credit
                </span>
              </div>
              <div className="showcase-feature-item" role="listitem">
                <span className="showcase-bullet" aria-hidden="true">•</span>
                <span className="showcase-feature-text">
                  Duplicate transfers are blocked automatically
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="auth-form-panel">
          <div className="auth-form-inner">
            <header className="auth-header">
              {displayHeading && (
                <h1 className="auth-heading">{displayHeading}</h1>
              )}
              {subtitle && (
                <p className="auth-subtitle">{subtitle}</p>
              )}
            </header>

            <div className="auth-content">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AuthLayout;
