import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { css } from '../../styled-system/css';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and Password are required');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={css({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgba(4, 91, 107, 0.15) 0%, rgba(2, 43, 58, 0.05) 90%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      })}
    >
      <div
        className={css({
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          borderRadius: 'xl',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid',
          borderColor: 'border.default',
          boxShadow: '0 8px 32px 0 rgba(0, 77, 92, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        })}
      >
        <div className={css({ textAlign: 'center' })}>
          <h1
            className={css({
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'accent.text',
              letterSpacing: 'tight',
              marginBottom: '0.5rem',
            })}
          >
            Nile Project Manager
          </h1>
          <p className={css({ fontSize: '0.875rem', color: 'fg.muted' })}>
            Consultant & Client Collaboration Portal
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className={css({
              padding: '0.75rem 1rem',
              borderRadius: 'md',
              backgroundColor: 'red.light.2',
              color: 'red.light.11',
              fontSize: '0.875rem',
              border: '1px solid',
              borderColor: 'red.light.5',
            })}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={css({ display: 'flex', flexDirection: 'column', gap: '1.25rem' })}>
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '0.375rem' })}>
            <label
              htmlFor="email"
              className={css({
                fontSize: '0.875rem',
                fontWeight: 'medium',
                color: 'fg.muted',
              })}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={css({
                padding: '0.625rem 0.875rem',
                borderRadius: 'md',
                border: '1px solid',
                borderColor: 'border.default',
                backgroundColor: 'bg.default',
                fontSize: '0.95rem',
                color: 'fg.default',
                outline: 'none',
                transition: 'all 0.2s ease',
                _focus: {
                  borderColor: 'teal.9',
                  boxShadow: '0 0 0 3px {colors.teal.light.a3}',
                },
              })}
              placeholder="you@nile.com"
              autoComplete="username"
            />
          </div>

          <div className={css({ display: 'flex', flexDirection: 'column', gap: '0.375rem' })}>
            <label
              htmlFor="password"
              className={css({
                fontSize: '0.875rem',
                fontWeight: 'medium',
                color: 'fg.muted',
              })}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={css({
                padding: '0.625rem 0.875rem',
                borderRadius: 'md',
                border: '1px solid',
                borderColor: 'border.default',
                backgroundColor: 'bg.default',
                fontSize: '0.95rem',
                color: 'fg.default',
                outline: 'none',
                transition: 'all 0.2s ease',
                _focus: {
                  borderColor: 'teal.9',
                  boxShadow: '0 0 0 3px {colors.teal.light.a3}',
                },
              })}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={css({
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'md',
              backgroundColor: 'teal.9',
              color: 'white',
              fontWeight: 'semibold',
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              _hover: {
                backgroundColor: 'teal.10',
              },
              _active: {
                backgroundColor: 'teal.11',
              },
              _disabled: {
                backgroundColor: 'bg.disabled',
                color: 'fg.disabled',
                cursor: 'not-allowed',
              },
              _focusVisible: {
                outline: '2px solid',
                outlineColor: 'teal.9',
                outlineOffset: '2px',
              },
            })}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
