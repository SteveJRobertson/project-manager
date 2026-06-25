import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/models/db';
import { generateToken } from '../../src/utils/jwt';
import { Role, ProjectStatus } from '@prisma/client';

// Mock the Prisma DB client
jest.mock('../../src/models/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    comment: {
      create: jest.fn(),
    },
  },
}));

describe('API Integration Tests', () => {
  const consultantToken = generateToken({ id: 'u1', email: 'consultant@nile.com', role: Role.CONSULTANT });
  const clientToken = generateToken({ id: 'u2', email: 'client@nile.com', role: Role.CLIENT });
  const otherClientToken = generateToken({ id: 'u3', email: 'otherclient@nile.com', role: Role.CLIENT });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).get('/api/projects');
      expect(response.status).toBe(401);
    });

    it('should allow CONSULTANT to fetch all projects', async () => {
      const mockProjects = [
        { id: 'p1', name: 'Project 1', status: ProjectStatus.DRAFT },
        { id: 'p2', name: 'Project 2', status: ProjectStatus.IN_REVIEW },
      ];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/projects')
        .set('Cookie', [`token=${consultantToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProjects);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        include: { notes: true, recommendationPack: true, comments: true },
      });
    });

    it('should allow CLIENT to fetch only assigned projects in non-DRAFT status', async () => {
      const mockProjects = [
        { id: 'p2', name: 'Project 2', status: ProjectStatus.IN_REVIEW, clientId: 'u2' },
      ];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/projects')
        .set('Cookie', [`token=${clientToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProjects);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          clientId: 'u2',
          status: { in: [ProjectStatus.IN_REVIEW, ProjectStatus.APPROVED, ProjectStatus.DELIVERED] },
        },
        include: { recommendationPack: true, comments: true },
      });
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should prevent CLIENT from viewing other client projects', async () => {
      const mockProject = { id: 'p1', name: 'Other Project', status: ProjectStatus.IN_REVIEW, clientId: 'u3' };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      const response = await request(app)
        .get('/api/projects/p1')
        .set('Cookie', [`token=${clientToken}`]);

      expect(response.status).toBe(403);
    });

    it('should allow CLIENT to view their own projects', async () => {
      const mockProject = { id: 'p1', name: 'Own Project', status: ProjectStatus.IN_REVIEW, clientId: 'u3' };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      const response = await request(app)
        .get('/api/projects/p1')
        .set('Cookie', [`token=${otherClientToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Own Project');
    });

    it('should hide notes for CLIENT when fetching details', async () => {
      const mockProject = {
        id: 'p1',
        name: 'Project 1',
        status: ProjectStatus.IN_REVIEW,
        clientId: 'u2',
        notes: [{ id: 'n1', title: 'Internal Note', content: 'Secret' }],
      };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      const response = await request(app)
        .get('/api/projects/p1')
        .set('Cookie', [`token=${clientToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.notes).toBeUndefined(); // Clients cannot read notes
    });

    it('should expose notes to CONSULTANT when fetching details', async () => {
      const mockProject = {
        id: 'p1',
        name: 'Project 1',
        status: ProjectStatus.IN_REVIEW,
        clientId: 'u2',
        notes: [{ id: 'n1', title: 'Internal Note', content: 'Secret' }],
      };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      const response = await request(app)
        .get('/api/projects/p1')
        .set('Cookie', [`token=${consultantToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.notes).toBeDefined();
      expect(response.body.notes[0].title).toBe('Internal Note');
    });
  });

  describe('POST /api/projects/:id/transition', () => {
    it('should enforce state workflow rules and transition project status', async () => {
      const mockProject = {
        id: 'p1',
        status: ProjectStatus.DRAFT,
        consultantId: 'u1',
        clientId: 'u2',
      };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        status: ProjectStatus.IN_REVIEW,
      });

      const response = await request(app)
        .post('/api/projects/p1/transition')
        .send({ status: ProjectStatus.IN_REVIEW })
        .set('Cookie', [`token=${consultantToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(ProjectStatus.IN_REVIEW);
      expect(prisma.project.update).toHaveBeenCalled();
    });

    it('should return 403/400 on invalid transitions', async () => {
      const mockProject = {
        id: 'p1',
        status: ProjectStatus.DRAFT,
        consultantId: 'u1',
        clientId: 'u2',
      };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      // Client attempting to transition Draft to In Review
      const response = await request(app)
        .post('/api/projects/p1/transition')
        .send({ status: ProjectStatus.IN_REVIEW })
        .set('Cookie', [`token=${clientToken}`]);

      expect(response.status).toBe(403);
    });
  });
});
