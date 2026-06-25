import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { css } from '../../styled-system/css';

interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED';
  clientId: string;
  consultantId: string;
}

interface DashboardPageProps {
  onSelectProject: (id: string) => void;
}

const statusColors = {
  DRAFT: { bg: 'gray.light.2', text: 'gray.light.12', border: 'gray.light.4' },
  IN_REVIEW: { bg: 'amber.light.2', text: 'amber.light.12', border: 'amber.light.5' },
  APPROVED: { bg: 'teal.light.2', text: 'teal.light.12', border: 'teal.light.5' },
  DELIVERED: { bg: 'blue.light.2', text: 'blue.light.12', border: 'blue.light.5' },
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectProject }) => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching projects';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Safe filtering of DRAFT projects for CLIENTS
  const displayedProjects = projects.filter((project) => {
    if (user?.role === 'CLIENT') {
      return project.status !== 'DRAFT';
    }
    return true;
  });

  return (
    <div
      className={css({
        minHeight: '100vh',
        backgroundColor: 'bg.canvas',
        backgroundImage: 'radial-gradient(circle at 90% 10%, {colors.teal.light.a2} 0%, transparent 60%)',
        padding: '2.5rem 2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      })}
    >
      <div
        className={css({
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        })}
      >
        {/* Header Section */}
        <header
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'border.default',
            paddingBottom: '1.25rem',
          })}
        >
          <div>
            <h1 className={css({ fontSize: '1.75rem', fontWeight: 'bold', color: 'accent.text' })}>
              Projects Dashboard
            </h1>
            <p className={css({ fontSize: '0.875rem', color: 'fg.muted', marginTop: '0.25rem' })}>
              Welcome back, <span className={css({ fontWeight: 'semibold', color: 'accent.text' })}>{user?.name}</span> ({user?.role?.toLowerCase()})
            </p>
          </div>
          <button
            onClick={logout}
            className={css({
              padding: '0.5rem 1rem',
              borderRadius: 'md',
              border: '1px solid',
              borderColor: 'border.default',
              backgroundColor: 'bg.default',
              color: 'fg.default',
              fontWeight: 'medium',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              _hover: {
                backgroundColor: 'bg.subtle',
                borderColor: 'border.muted',
              },
              _focusVisible: {
                outline: '2px solid',
                outlineColor: 'teal.11',
                outlineOffset: '2px',
              },
            })}
          >
            Sign Out
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className={css({
              padding: '1rem',
              backgroundColor: 'red.light.2',
              color: 'red.light.11',
              borderRadius: 'md',
              border: '1px solid',
              borderColor: 'red.light.5',
            })}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className={css({ textAlign: 'center', padding: '4rem 0', color: 'fg.muted' })}>
            Loading projects...
          </div>
        ) : displayedProjects.length === 0 ? (
          <div
            className={css({
              textAlign: 'center',
              padding: '5rem 2rem',
              backgroundColor: 'bg.default',
              borderRadius: 'lg',
              border: '1px dashed',
              borderColor: 'border.default',
              color: 'fg.muted',
            })}
          >
            <p className={css({ fontSize: '1.1rem', fontWeight: 'medium', color: 'fg.default' })}>
              No projects found
            </p>
            <p className={css({ fontSize: '0.875rem', color: 'fg.muted', marginTop: '0.5rem' })}>
              Active assignments will show up here.
            </p>
          </div>
        ) : (
          <div
            className={css({
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
            })}
          >
            {displayedProjects.map((project) => {
              const colors = statusColors[project.status];
              return (
                <div
                  key={project.id}
                  className={css({
                    backgroundColor: 'bg.default',
                    borderRadius: 'xl',
                    border: '1px solid',
                    borderColor: 'border.default',
                    boxShadow: 'sm',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    _hover: {
                      transform: 'translateY(-2px)',
                      boxShadow: 'md',
                      borderColor: 'teal.6',
                    },
                  })}
                >
                  <div className={css({ display: 'flex', flexDirection: 'column', gap: '0.75rem' })}>
                    <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' })}>
                      <h2
                        className={css({
                          fontSize: '1.15rem',
                          fontWeight: 'bold',
                          color: 'fg.default',
                          lineHeight: 'tight',
                        })}
                      >
                        {project.name}
                      </h2>
                      <span
                        className={css({
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          letterSpacing: 'wider',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'md',
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: '1px solid',
                          borderColor: colors.border,
                        })}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className={css({ fontSize: '0.85rem', fontWeight: 'semibold', color: 'accent.text' })}>
                      Client: {project.clientName}
                    </p>

                    <p
                      className={css({
                        fontSize: '0.875rem',
                        color: 'fg.muted',
                        lineHeight: 'relaxed',
                        lineClamp: 3,
                        overflow: 'hidden',
                      })}
                    >
                      {project.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectProject(project.id)}
                    className={css({
                      width: '100%',
                      padding: '0.625rem',
                      borderRadius: 'lg',
                      backgroundColor: 'teal.light.2',
                      color: 'teal.light.12',
                      fontWeight: 'semibold',
                      fontSize: '0.875rem',
                      border: '1px solid',
                      borderColor: 'teal.light.4',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      _hover: {
                        backgroundColor: 'teal.11',
                        color: 'white',
                        borderColor: 'teal.11',
                      },
                      _focusVisible: {
                        outline: '2px solid',
                        outlineColor: 'teal.11',
                        outlineOffset: '2px',
                      },
                    })}
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
