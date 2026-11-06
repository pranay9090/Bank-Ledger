import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, Input, Button } from '../components';
import { useAuth } from '../context/useAuth';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
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

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Account registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Takes less than a minute."
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your name"
          autoFocus
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
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
            {loading ? 'PLEASE WAIT...' : 'CREATE ACCOUNT'}
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
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#ffffff',
              textDecoration: 'underline',
              fontWeight: 500,
              marginLeft: '4px',
            }}
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Register;
