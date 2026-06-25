import { Router, Request, Response } from 'express';
import prisma from '../models/db';
import { authMiddleware } from '../middleware/auth.middleware';
import { WorkflowService } from '../services/workflow.service';
import { Role, ProjectStatus } from '@prisma/client';

const router = Router();

// Apply auth middleware to all project routes
router.use(authMiddleware);

// GET /api/projects
router.get('/', async (req: Request, res: Response) => {
  const user = req.user!;

  try {
    if (user.role === Role.CONSULTANT) {
      const projects = await prisma.project.findMany({
        include: {
          notes: true,
          recommendationPack: true,
          comments: true,
        },
      });
      return res.json(projects);
    } else {
      const projects = await prisma.project.findMany({
        where: {
          clientId: user.id,
          status: {
            in: [ProjectStatus.IN_REVIEW, ProjectStatus.APPROVED, ProjectStatus.DELIVERED],
          },
        },
        include: {
          recommendationPack: true,
          comments: true,
        },
      });
      return res.json(projects);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        notes: true,
        recommendationPack: true,
        comments: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (user.role === Role.CLIENT) {
      if (project.clientId !== user.id || project.status === ProjectStatus.DRAFT) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }

      // Strip notes from client payload
      const clientProject = {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        description: project.description,
        status: project.status,
        clientId: project.clientId,
        consultantId: project.consultantId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        recommendationPack: project.recommendationPack,
        comments: project.comments,
      };
      return res.json(clientProject);
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/transition
router.post('/:id/transition', async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { status: targetStatus } = req.body;

  if (!targetStatus) {
    return res.status(400).json({ error: 'Target status is required' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (user.role === Role.CLIENT && project.clientId !== user.id) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    let newStatus: ProjectStatus;
    try {
      newStatus = WorkflowService.transition(project.status, targetStatus, user.role);
    } catch (workflowError) {
      const errMsg = workflowError instanceof Error ? workflowError.message : 'Unknown error';
      const isAuthzError = errMsg.toLowerCase().includes('unauthorized');
      return res.status(isAuthzError ? 403 : 400).json({ error: errMsg });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { status: newStatus },
    });

    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/comments
router.post('/:id/comments', async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (user.role === Role.CLIENT && project.clientId !== user.id) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    if (project.status !== ProjectStatus.IN_REVIEW) {
      return res.status(400).json({ error: 'Comments can only be posted while project is in review' });
    }

    const comment = await prisma.comment.create({
      data: {
        projectId: id,
        authorId: user.id,
        content,
      },
    });

    return res.json(comment);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
