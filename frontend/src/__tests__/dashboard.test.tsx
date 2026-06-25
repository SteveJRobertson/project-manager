import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Mock } from 'vitest';
import { useAuth } from '../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';

// Mock useAuth context
vi.mock('../context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe('DashboardPage & ProjectDetailPage TDD', () => {
  const mockProjects = [
    {
      id: 'p1',
      name: 'Draft Project Name',
      clientName: 'Client Corp',
      description: 'Draft Desc',
      status: 'DRAFT',
      clientId: 'u2',
      consultantId: 'u1',
    },
    {
      id: 'p2',
      name: 'In Review Project Name',
      clientName: 'SecureBank',
      description: 'Review Desc',
      status: 'IN_REVIEW',
      clientId: 'u2',
      consultantId: 'u1',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  describe('DashboardPage', () => {
    it('should fetch and render projects list for Consultant', async () => {
      (useAuth as Mock).mockReturnValue({
        user: { id: 'u1', email: 'consultant@nile.com', name: 'Sarah Consultant', role: 'CONSULTANT' },
      });

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProjects,
      });

      const onSelectProject = vi.fn();

      render(<DashboardPage onSelectProject={onSelectProject} />);

      // Verify title is rendered
      expect(screen.getByText(/projects dashboard/i)).toBeInTheDocument();

      // Wait for fetch to complete and render
      const project1 = await screen.findByText('Draft Project Name');
      const project2 = await screen.findByText('In Review Project Name');

      expect(project1).toBeInTheDocument();
      expect(project2).toBeInTheDocument();

      // Click select
      const viewButtons = screen.getAllByRole('button', { name: /view details/i });
      fireEvent.click(viewButtons[0]);
      expect(onSelectProject).toHaveBeenCalledWith('p1');
    });

    it('should filter out draft projects visually or show empty state if none', async () => {
      (useAuth as Mock).mockReturnValue({
        user: { id: 'u2', email: 'client@nile.com', name: 'Alex Client', role: 'CLIENT' },
      });

      // API for client would filter drafts, we mock it returning only non-draft projects
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockProjects[1]],
      });

      render(<DashboardPage onSelectProject={vi.fn()} />);

      const project2 = await screen.findByText('In Review Project Name');
      expect(project2).toBeInTheDocument();
      expect(screen.queryByText('Draft Project Name')).not.toBeInTheDocument();
    });
  });

  describe('ProjectDetailPage', () => {
    const mockDetailProject = {
      id: 'p2',
      name: 'In Review Project Name',
      clientName: 'SecureBank',
      description: 'Review Desc',
      status: 'IN_REVIEW',
      clientId: 'u2',
      consultantId: 'u1',
      notes: [
        { id: 'n1', title: 'Security Finding', content: 'Permanent admin keys found' },
      ],
      recommendationPack: {
        id: 'rec1',
        executiveSummary: 'This is the exec summary content',
        keyFindings: 'AWS encryption missing',
        recommendations: 'Enable S3 bucket default encryption',
        risks: 'Rotations require minor downtime',
        openQuestions: 'When is the maintenance window?',
      },
      comments: [
        { id: 'c1', content: 'First client feedback comment', author: { id: 'u2', name: 'Alex Client', role: 'CLIENT' } },
      ],
    };

    it('should render tabs and switch content for Recommendation Pack', async () => {
      (useAuth as Mock).mockReturnValue({
        user: { id: 'u1', email: 'consultant@nile.com', name: 'Sarah Consultant', role: 'CONSULTANT' },
      });

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDetailProject,
      });

      render(<ProjectDetailPage projectId="p2" onBack={vi.fn()} />);

      // Wait for details
      await screen.findByText('In Review Project Name');

      // Verify active tab content initially (Executive Summary)
      expect(screen.getByText('This is the exec summary content')).toBeInTheDocument();

      // Click Findings tab
      const findingsTab = screen.getByRole('tab', { name: /findings/i });
      fireEvent.click(findingsTab);
      expect(screen.getByText('AWS encryption missing')).toBeInTheDocument();

      // Click Recommendations tab
      const recsTab = screen.getByRole('tab', { name: /recommendations/i });
      fireEvent.click(recsTab);
      expect(screen.getByText('Enable S3 bucket default encryption')).toBeInTheDocument();
    });

    it('should show internal notes for Consultant and hide them for Client', async () => {
      // 1. Consultant case
      (useAuth as Mock).mockReturnValue({
        user: { id: 'u1', email: 'consultant@nile.com', name: 'Sarah Consultant', role: 'CONSULTANT' },
      });

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDetailProject,
      });

      const { rerender } = render(<ProjectDetailPage projectId="p2" onBack={vi.fn()} />);
      await screen.findByText('Security Finding'); // Notes card is present
      expect(screen.getByText('Permanent admin keys found')).toBeInTheDocument();

      // 2. Client case
      (useAuth as Mock).mockReturnValue({
        user: { id: 'u2', email: 'client@nile.com', name: 'Alex Client', role: 'CLIENT' },
      });

      // Clear mock and set next mock value (project detail fetched by client will have notes undefined or omitted)
      vi.restoreAllMocks();
      (useAuth as Mock).mockReturnValue({
        user: { id: 'u2', email: 'client@nile.com', name: 'Alex Client', role: 'CLIENT' },
      });
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockDetailProject, notes: undefined }), // Notes undefined for client
      });

      rerender(<ProjectDetailPage projectId="p2" onBack={vi.fn()} />);
      await screen.findByText('In Review Project Name');
      expect(screen.queryByText('Security Finding')).not.toBeInTheDocument();
    });

    it('should show transition buttons based on status and role, and fetch transition POST on click', async () => {
      // Case 1: In Review + Consultant = Revert to Draft
      (useAuth as Mock).mockReturnValue({
        user: { id: 'u1', email: 'consultant@nile.com', name: 'Sarah Consultant', role: 'CONSULTANT' },
      });

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockDetailProject,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockDetailProject, status: 'DRAFT' }),
        });

      render(<ProjectDetailPage projectId="p2" onBack={vi.fn()} />);
      await screen.findByText('In Review Project Name');

      const revertBtn = screen.getByRole('button', { name: /revert to draft/i });
      expect(revertBtn).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /approve project/i })).not.toBeInTheDocument();

      fireEvent.click(revertBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/p2/transition', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ status: 'DRAFT' }),
        }));
      });
    });

    it('should fetch and add comments successfully', async () => {
      (useAuth as Mock).mockReturnValue({
        user: { id: 'u2', email: 'client@nile.com', name: 'Alex Client', role: 'CLIENT' },
      });

      const newComment = { id: 'c2', content: 'New added feedback', author: { id: 'u2', name: 'Alex Client', role: 'CLIENT' } };

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockDetailProject,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => newComment,
        });

      render(<ProjectDetailPage projectId="p2" onBack={vi.fn()} />);
      await screen.findByText('First client feedback comment');

      const commentInput = screen.getByPlaceholderText(/write a comment/i);
      fireEvent.change(commentInput, { target: { value: 'New added feedback' } });

      const commentSubmit = screen.getByRole('button', { name: /add comment/i });
      fireEvent.click(commentSubmit);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/p2/comments', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'New added feedback' }),
        }));
      });

      // Verify comment rendered
      const renderedNewComment = await screen.findByText('New added feedback');
      expect(renderedNewComment).toBeInTheDocument();
    });
  });
});
