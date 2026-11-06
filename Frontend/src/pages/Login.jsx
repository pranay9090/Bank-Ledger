import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, Input, Button } from '../components';
import { useAuth } from '../context/useAuth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue."
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
        />

        {/* Error message: red text above the button, not a box */}
        {error && (
          <div
            role="alert"
            style={{
              color: '#ff6b6b',
              fontSize: '13px',
              fontFamily: "var(--font-body, 'Outfit', sans-serif)",
              marginBottom: '16px',
              lineHeight: '1.4',
              letterSpacing: 0,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'PLEASE WAIT...' : 'SIGN IN'}
          </Button>
        </div>

        {/* Under the button, centered link */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            fontFamily: "var(--font-body, 'Outfit', sans-serif)",
            color: '#9a9aa2',
            letterSpacing: 0,
          }}
        >
          New here?{' '}
          <Link
            to="/register"
            style={{
              color: '#ffffff',
              textDecoration: 'underline',
              fontWeight: 500,
              marginLeft: '4px',
            }}
          >
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
