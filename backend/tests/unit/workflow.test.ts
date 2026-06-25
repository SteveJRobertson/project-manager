import { WorkflowService } from '../../src/services/workflow.service';
import { ProjectStatus, Role } from '@prisma/client';

describe('WorkflowService - State Transitions', () => {
  it('should allow CONSULTANT to transition project from DRAFT to IN_REVIEW', () => {
    const result = WorkflowService.transition(
      ProjectStatus.DRAFT,
      ProjectStatus.IN_REVIEW,
      Role.CONSULTANT
    );
    expect(result).toBe(ProjectStatus.IN_REVIEW);
  });

  it('should block CLIENT from transitioning project from DRAFT to IN_REVIEW', () => {
    expect(() => {
      WorkflowService.transition(ProjectStatus.DRAFT, ProjectStatus.IN_REVIEW, Role.CLIENT);
    }).toThrow(/unauthorized/i);
  });

  it('should allow CLIENT to transition project from IN_REVIEW to APPROVED', () => {
    const result = WorkflowService.transition(
      ProjectStatus.IN_REVIEW,
      ProjectStatus.APPROVED,
      Role.CLIENT
    );
    expect(result).toBe(ProjectStatus.APPROVED);
  });

  it('should block CONSULTANT from transitioning project from IN_REVIEW to APPROVED', () => {
    expect(() => {
      WorkflowService.transition(ProjectStatus.IN_REVIEW, ProjectStatus.APPROVED, Role.CONSULTANT);
    }).toThrow(/unauthorized/i);
  });

  it('should allow CONSULTANT to transition project from APPROVED to DELIVERED', () => {
    const result = WorkflowService.transition(
      ProjectStatus.APPROVED,
      ProjectStatus.DELIVERED,
      Role.CONSULTANT
    );
    expect(result).toBe(ProjectStatus.DELIVERED);
  });

  it('should block transition from DELIVERED to any other state', () => {
    expect(() => {
      WorkflowService.transition(ProjectStatus.DELIVERED, ProjectStatus.DRAFT, Role.CONSULTANT);
    }).toThrow(/invalid transition/i);
  });

  it('should block invalid transitions like DRAFT to APPROVED directly', () => {
    expect(() => {
      WorkflowService.transition(ProjectStatus.DRAFT, ProjectStatus.APPROVED, Role.CONSULTANT);
    }).toThrow(/invalid transition/i);
  });
});
