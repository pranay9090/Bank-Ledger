import React from 'react';
import './Button.css';

function Button({
  children,
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  variant = 'primary',
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`btn-root btn-${variant} ${loading ? 'is-loading' : ''} ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <span className="btn-loading-content">
          <svg
            className="btn-spinner"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className="btn-spinner-track"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <circle
              className="btn-spinner-head"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
              strokeDasharray="42"
              strokeDashoffset="14"
            />
          </svg>
          {children && <span className="btn-label">{children}</span>}
        </span>
      ) : (
        <span className="btn-label">{children}</span>
      )}
    </button>
  );
}

export default Button;

