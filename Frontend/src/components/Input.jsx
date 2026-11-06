import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  helperText,
  autoFocus = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = name ? `input-${name}` : undefined;
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-field-group ${error ? 'has-error' : ''} ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          <span>{label}</span>
          {required && <span className="input-required-mark" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="input-control-wrapper">
        <input
          id={inputId}
          type={effectiveType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`input-control ${isPassword ? 'input-with-toggle' : ''} ${error ? 'input-error' : ''}`}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="input-password-toggle-btn"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error ? (
        <span className="input-error-message" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className="input-helper-text">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

export default Input;
