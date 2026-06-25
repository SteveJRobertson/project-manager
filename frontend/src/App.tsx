import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import { css } from '../styled-system/css';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        className={css({
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'neutral.50',
          color: 'neutral.500',
          fontSize: '1rem',
          fontFamily: 'Inter, system-ui, sans-serif',
        })}
      >
        Loading application session...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (activeProjectId) {
    return (
      <ProjectDetailPage
        projectId={activeProjectId}
        onBack={() => setActiveProjectId(null)}
      />
    );
  }

  return <DashboardPage onSelectProject={setActiveProjectId} />;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
