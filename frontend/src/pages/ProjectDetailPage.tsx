import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { css } from '../../styled-system/css';

interface RecommendationPack {
  id: string;
  executiveSummary: string;
  keyFindings: string;
  recommendations: string;
  risks: string;
  openQuestions: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
}

interface CommentAuthor {
  id: string;
  name: string;
  role: 'CONSULTANT' | 'CLIENT';
}

interface Comment {
  id: string;
  content: string;
  createdAt?: string;
  author: CommentAuthor;
}

interface ProjectDetail {
  id: string;
  name: string;
  clientName: string;
  description: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED';
  clientId: string;
  consultantId: string;
  recommendationPack: RecommendationPack | null;
  notes?: Note[];
  comments: Comment[];
}

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId, onBack }) => {
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'findings' | 'recommendations' | 'risks' | 'questions'>('summary');
  const [commentContent, setCommentContent] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      const data = await response.json();
      setProject(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching project details';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleTransition = async (targetStatus: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED') => {
    try {
      const response = await fetch(`/api/projects/${projectId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Transition failed');
      }

      await fetchProjectDetails();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project status';
      alert(message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setAddingComment(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();

      // Optimistically or safely update comment list
      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...prev.comments, newComment],
        };
      });
      setCommentContent('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post comment';
      alert(message);
    } finally {
      setAddingComment(false);
    }
  };

  if (loading) {
    return (
      <div className={css({ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'fg.muted' })}>
        Loading details...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={css({ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' })}>
        <p className={css({ color: 'red.light.11', fontWeight: 'semibold' })}>{error || 'Project not found'}</p>
        <button onClick={onBack} className={css({ padding: '0.5rem 1rem', borderRadius: 'md', border: '1px solid', borderColor: 'border.default', cursor: 'pointer' })}>Back to Dashboard</button>
      </div>
    );
  }

  const recPack = project.recommendationPack;

  return (
    <div
      className={css({
        minHeight: '100vh',
        backgroundColor: 'bg.canvas',
        padding: '2.5rem 2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      })}
    >
      <div className={css({ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' })}>
        {/* Navigation & Title */}
        <header className={css({ display: 'flex', flexDirection: 'column', gap: '1rem' })}>
          <button
            onClick={onBack}
            className={css({
              alignSelf: 'flex-start',
              padding: '0.4rem 0.8rem',
              borderRadius: 'md',
              border: '1px solid',
              borderColor: 'border.default',
              backgroundColor: 'bg.default',
              color: 'fg.default',
              fontSize: '0.85rem',
              fontWeight: 'medium',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              _hover: { backgroundColor: 'bg.subtle' },
            })}
          >
            ← Back to Dashboard
          </button>

          <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
            <div>
              <h1 className={css({ fontSize: '2rem', fontWeight: 'bold', color: 'fg.default' })}>{project.name}</h1>
              <p className={css({ fontSize: '0.875rem', color: 'fg.muted', marginTop: '0.25rem' })}>
                Client: <span className={css({ fontWeight: 'semibold', color: 'accent.text' })}>{project.clientName}</span>
              </p>
            </div>
            <span
              className={css({
                fontSize: '0.85rem',
                fontWeight: 'bold',
                letterSpacing: 'wide',
                padding: '0.35rem 0.75rem',
                borderRadius: 'md',
                backgroundColor: project.status === 'APPROVED' ? 'teal.light.2' : project.status === 'IN_REVIEW' ? 'amber.light.2' : project.status === 'DELIVERED' ? 'blue.light.2' : 'gray.light.2',
                color: project.status === 'APPROVED' ? 'teal.light.12' : project.status === 'IN_REVIEW' ? 'amber.light.12' : project.status === 'DELIVERED' ? 'blue.light.12' : 'gray.light.12',
                border: '1px solid',
                borderColor: project.status === 'APPROVED' ? 'teal.light.5' : project.status === 'IN_REVIEW' ? 'amber.light.5' : project.status === 'DELIVERED' ? 'blue.light.5' : 'gray.light.5',
              })}
            >
              {project.status.replace('_', ' ')}
            </span>
          </div>
        </header>

        {/* Project Description */}
        <section className={css({ backgroundColor: 'bg.default', padding: '1.5rem', borderRadius: 'xl', border: '1px solid', borderColor: 'border.default' })}>
          <h2 className={css({ fontSize: '1.1rem', fontWeight: 'bold', color: 'fg.default', marginBottom: '0.5rem' })}>Project Overview</h2>
          <p className={css({ fontSize: '0.95rem', color: 'fg.muted', lineHeight: 'relaxed' })}>{project.description}</p>
        </section>

        {/* Recommendation Pack (Tabs) */}
        {recPack && (
          <section className={css({ backgroundColor: 'bg.default', borderRadius: 'xl', border: '1px solid', borderColor: 'border.default', overflow: 'hidden' })}>
            {/* Tabs List */}
            <div role="tablist" className={css({ display: 'flex', borderBottom: '1px solid', borderColor: 'border.default', backgroundColor: 'bg.subtle' })}>
              {(['summary', 'findings', 'recommendations', 'risks', 'questions'] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={css({
                    padding: '1rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 'semibold',
                    border: 'none',
                    backgroundColor: activeTab === tab ? 'bg.default' : 'transparent',
                    color: activeTab === tab ? 'accent.text' : 'fg.muted',
                    cursor: 'pointer',
                    borderBottom: activeTab === tab ? '2px solid' : 'none',
                    borderBottomColor: 'teal.11',
                    transition: 'all 0.2s ease',
                    _hover: { color: 'teal.11' },
                  })}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Panels */}
            <div className={css({ padding: '1.5rem', minHeight: '150px' })}>
              {activeTab === 'summary' && (
                <div role="tabpanel">
                  <h3 className={css({ fontSize: '1rem', fontWeight: 'bold', color: 'fg.default', marginBottom: '0.5rem' })}>Executive Summary</h3>
                  <p className={css({ fontSize: '0.95rem', color: 'fg.muted', lineHeight: 'relaxed', whiteSpace: 'pre-line' })}>{recPack.executiveSummary}</p>
                </div>
              )}
              {activeTab === 'findings' && (
                <div role="tabpanel">
                  <h3 className={css({ fontSize: '1rem', fontWeight: 'bold', color: 'fg.default', marginBottom: '0.5rem' })}>Key Findings</h3>
                  <p className={css({ fontSize: '0.95rem', color: 'fg.muted', lineHeight: 'relaxed', whiteSpace: 'pre-line' })}>{recPack.keyFindings}</p>
                </div>
              )}
              {activeTab === 'recommendations' && (
                <div role="tabpanel">
                  <h3 className={css({ fontSize: '1rem', fontWeight: 'bold', color: 'fg.default', marginBottom: '0.5rem' })}>Recommendations</h3>
                  <p className={css({ fontSize: '0.95rem', color: 'fg.muted', lineHeight: 'relaxed', whiteSpace: 'pre-line' })}>{recPack.recommendations}</p>
                </div>
              )}
              {activeTab === 'risks' && (
                <div role="tabpanel">
                  <h3 className={css({ fontSize: '1rem', fontWeight: 'bold', color: 'fg.default', marginBottom: '0.5rem' })}>Risks & Mitigations</h3>
                  <p className={css({ fontSize: '0.95rem', color: 'fg.muted', lineHeight: 'relaxed', whiteSpace: 'pre-line' })}>{recPack.risks}</p>
                </div>
              )}
              {activeTab === 'questions' && (
                <div role="tabpanel">
                  <h3 className={css({ fontSize: '1rem', fontWeight: 'bold', color: 'fg.default', marginBottom: '0.5rem' })}>Open Questions</h3>
                  <p className={css({ fontSize: '0.95rem', color: 'fg.muted', lineHeight: 'relaxed', whiteSpace: 'pre-line' })}>{recPack.openQuestions}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Notes Card (Consultants Only) */}
        {user?.role === 'CONSULTANT' && project.notes && project.notes.length > 0 && (
          <section className={css({ backgroundColor: 'bg.default', padding: '1.5rem', borderRadius: 'xl', border: '1px solid', borderColor: 'border.default' })}>
            <h2 className={css({ fontSize: '1.1rem', fontWeight: 'bold', color: 'fg.default', marginBottom: '1rem' })}>
              Internal Notes <span className={css({ fontSize: '0.75rem', fontWeight: 'medium', color: 'fg.muted', marginLeft: '0.5rem' })}>(Not visible to Client)</span>
            </h2>
            <div className={css({ display: 'flex', flexDirection: 'column', gap: '1rem' })}>
              {project.notes.map((note) => (
                <div key={note.id} className={css({ padding: '1rem', backgroundColor: 'bg.subtle', borderRadius: 'lg', border: '1px solid', borderColor: 'border.default' })}>
                  <h3 className={css({ fontSize: '0.95rem', fontWeight: 'bold', color: 'fg.default' })}>{note.title}</h3>
                  <p className={css({ fontSize: '0.875rem', color: 'fg.muted', marginTop: '0.35rem', lineHeight: 'relaxed' })}>{note.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Workflow Actions */}
        <section className={css({ display: 'flex', gap: '1rem', padding: '1rem 0' })}>
          {project.status === 'DRAFT' && user?.role === 'CONSULTANT' && (
            <button
              onClick={() => handleTransition('IN_REVIEW')}
              className={css({ padding: '0.75rem 1.5rem', borderRadius: 'lg', backgroundColor: 'teal.11', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', _hover: { backgroundColor: 'teal.12' } })}
            >
              Submit for Review
            </button>
          )}

          {project.status === 'IN_REVIEW' && user?.role === 'CLIENT' && (
            <button
              onClick={() => handleTransition('APPROVED')}
              className={css({ padding: '0.75rem 1.5rem', borderRadius: 'lg', backgroundColor: 'teal.11', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', _hover: { backgroundColor: 'teal.12' } })}
            >
              Approve Project
            </button>
          )}

          {project.status === 'IN_REVIEW' && user?.role === 'CONSULTANT' && (
            <button
              onClick={() => handleTransition('DRAFT')}
              className={css({ padding: '0.75rem 1.5rem', borderRadius: 'lg', backgroundColor: 'amber.11', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', _hover: { backgroundColor: 'amber.12' } })}
            >
              Revert to Draft
            </button>
          )}

          {project.status === 'APPROVED' && user?.role === 'CONSULTANT' && (
            <button
              onClick={() => handleTransition('DELIVERED')}
              className={css({ padding: '0.75rem 1.5rem', borderRadius: 'lg', backgroundColor: 'teal.11', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', _hover: { backgroundColor: 'teal.12' } })}
            >
              Mark as Delivered
            </button>
          )}
        </section>

        {/* Comments Section */}
        <section className={css({ backgroundColor: 'bg.default', padding: '1.5rem', borderRadius: 'xl', border: '1px solid', borderColor: 'border.default', display: 'flex', flexDirection: 'column', gap: '1.5rem' })}>
          <h2 className={css({ fontSize: '1.1rem', fontWeight: 'bold', color: 'fg.default' })}>Comments Thread</h2>

          <div className={css({ display: 'flex', flexDirection: 'column', gap: '1rem' })}>
            {project.comments.length === 0 ? (
              <p className={css({ fontSize: '0.875rem', color: 'fg.muted', fontStyle: 'italic' })}>No comments posted yet.</p>
            ) : (
              project.comments.map((comment) => (
                <div key={comment.id} className={css({ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid', borderColor: 'border.subtle', paddingBottom: '0.75rem' })}>
                  <div className={css({ display: 'flex', gap: '0.5rem', alignItems: 'center' })}>
                    <span className={css({ fontSize: '0.85rem', fontWeight: 'bold', color: 'fg.default' })}>{comment.author.name}</span>
                    <span className={css({ fontSize: '0.7rem', textTransform: 'lowercase', backgroundColor: 'bg.subtle', color: 'fg.muted', padding: '0.1rem 0.4rem', borderRadius: 'md' })}>{comment.author.role}</span>
                  </div>
                  <p className={css({ fontSize: '0.9rem', color: 'fg.default', lineHeight: 'relaxed' })}>{comment.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className={css({ display: 'flex', flexDirection: 'column', gap: '0.75rem' })}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className={css({
                padding: '0.75rem',
                borderRadius: 'lg',
                border: '1px solid',
                borderColor: 'border.default',
                backgroundColor: 'bg.default',
                color: 'fg.default',
                outline: 'none',
                fontSize: '0.9rem',
                resize: 'vertical',
                _focus: {
                  borderColor: 'teal.11',
                  boxShadow: '0 0 0 3px {colors.teal.light.a3}',
                },
              })}
            />
            <button
              type="submit"
              disabled={addingComment || !commentContent.trim()}
              className={css({
                alignSelf: 'flex-start',
                padding: '0.5rem 1.25rem',
                borderRadius: 'lg',
                backgroundColor: 'teal.11',
                color: 'white',
                fontWeight: 'semibold',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                _hover: { backgroundColor: 'teal.12' },
                _disabled: { backgroundColor: 'bg.disabled', color: 'fg.disabled', cursor: 'not-allowed' },
              })}
            >
              Add Comment
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
