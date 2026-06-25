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
  DRAFT: { bg: 'neutral.100', text: 'neutral.800', border: 'neutral.200' },
  IN_REVIEW: { bg: 'amber.50', text: 'amber.800', border: 'amber.200' },
  APPROVED: { bg: 'teal.50', text: 'teal.800', border: 'teal.200' },
  DELIVERED: { bg: 'blue.50', text: 'blue.800', border: 'blue.200' },
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
        backgroundColor: 'neutral.50',
        backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(4, 91, 107, 0.05) 0%, transparent 60%)',
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
            borderColor: 'neutral.200',
            paddingBottom: '1.25rem',
          })}
        >
          <div>
            <h1 className={css({ fontSize: '1.75rem', fontWeight: 'bold', color: 'teal.900' })}>
              Projects Dashboard
            </h1>
            <p className={css({ fontSize: '0.875rem', color: 'neutral.600', marginTop: '0.25rem' })}>
              Welcome back, <span className={css({ fontWeight: 'semibold', color: 'teal.800' })}>{user?.name}</span> ({user?.role?.toLowerCase()})
            </p>
          </div>
          <button
            onClick={logout}
            className={css({
              padding: '0.5rem 1rem',
              borderRadius: 'md',
              border: '1px solid',
              borderColor: 'neutral.300',
              backgroundColor: 'white',
              color: 'neutral.700',
              fontWeight: 'medium',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              _hover: {
                backgroundColor: 'neutral.50',
                borderColor: 'neutral.400',
                color: 'neutral.900',
              },
              _focusVisible: {
                outline: '2px solid',
                outlineColor: 'teal.500',
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
              backgroundColor: 'red.50',
              color: 'red.800',
              borderRadius: 'md',
              border: '1px solid',
              borderColor: 'red.200',
            })}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className={css({ textAlign: 'center', padding: '4rem 0', color: 'neutral.500' })}>
            Loading projects...
          </div>
        ) : displayedProjects.length === 0 ? (
          <div
            className={css({
              textAlign: 'center',
              padding: '5rem 2rem',
              backgroundColor: 'white',
              borderRadius: 'lg',
              border: '1px dashed',
              borderColor: 'neutral.300',
              color: 'neutral.500',
            })}
          >
            <p className={css({ fontSize: '1.1rem', fontWeight: 'medium', color: 'neutral.700' })}>
              No projects found
            </p>
            <p className={css({ fontSize: '0.875rem', color: 'neutral.500', marginTop: '0.5rem' })}>
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
                    backgroundColor: 'white',
                    borderRadius: 'xl',
                    border: '1px solid',
                    borderColor: 'neutral.200',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    _hover: {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(4, 91, 107, 0.06)',
                      borderColor: 'teal.100',
                    },
                  })}
                >
                  <div className={css({ display: 'flex', flexDirection: 'column', gap: '0.75rem' })}>
                    <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' })}>
                      <h2
                        className={css({
                          fontSize: '1.15rem',
                          fontWeight: 'bold',
                          color: 'neutral.800',
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

                    <p className={css({ fontSize: '0.85rem', fontWeight: 'semibold', color: 'teal.700' })}>
                      Client: {project.clientName}
                    </p>

                    <p
                      className={css({
                        fontSize: '0.875rem',
                        color: 'neutral.600',
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
                      backgroundColor: 'teal.50',
                      color: 'teal.800',
                      fontWeight: 'semibold',
                      fontSize: '0.875rem',
                      border: '1px solid',
                      borderColor: 'teal.100',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      _hover: {
                        backgroundColor: 'teal.600',
                        color: 'white',
                        borderColor: 'teal.600',
                      },
                      _focusVisible: {
                        outline: '2px solid',
                        outlineColor: 'teal.500',
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
