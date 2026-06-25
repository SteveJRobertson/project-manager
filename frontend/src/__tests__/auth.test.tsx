import { render, screen, fireEvent } from '@testing-library/react';
import { Mock } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';

// Simple test helper component to consume AuthContext
const TestConsumer = () => {
  const { user, loading, logout, login } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) {
    return (
      <div>
        <span>Guest</span>
        <button onClick={() => login('consultant@nile.com', 'Password123!')}>Login</button>
      </div>
    );
  }
  return (
    <div>
      <span>User: {user.name} ({user.role})</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext & LoginPage TDD', () => {
  beforeEach(() => {
    // Clear mocks, reset fetch
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('should show loading state initially then render Guest when no user is fetched', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthenticated' }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Should show loading first
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Eventually should resolve to guest
    const guestText = await screen.findByText('Guest');
    expect(guestText).toBeInTheDocument();
  });

  it('should resolve user if /api/auth/me returns valid user session', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'u1', email: 'consultant@nile.com', name: 'Sarah Consultant', role: 'CONSULTANT' }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const userText = await screen.findByText('User: Sarah Consultant (CONSULTANT)');
    expect(userText).toBeInTheDocument();
  });

  it('should render LoginPage with email and password fields, and submit button', () => {
    // Render LoginPage in a mock AuthProvider context
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation error if login submitted with empty inputs', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    // Screen should show validation error
    const errorText = await screen.findByText(/email and password are required/i);
    expect(errorText).toBeInTheDocument();
  });

  it('should display API error if login fails', async () => {
    // Initial fetch for /api/auth/me fails
    (global.fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthenticated' }),
      })
      // Next fetch for login fails
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    // Wait for load
    await screen.findByRole('button', { name: /sign in/i });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@nile.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const errorMsg = await screen.findByText(/invalid credentials/i);
    expect(errorMsg).toBeInTheDocument();
  });

  it('should login successfully and update context user state', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthenticated' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user: { id: 'u2', email: 'client@nile.com', name: 'Alex Client', role: 'CLIENT' } }),
      });

    render(
      <AuthProvider>
        <LoginPage />
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for load
    await screen.findByRole('button', { name: /sign in/i });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'client@nile.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // User is updated in consumer
    const userText = await screen.findByText('User: Alex Client (CLIENT)');
    expect(userText).toBeInTheDocument();
  });
});
