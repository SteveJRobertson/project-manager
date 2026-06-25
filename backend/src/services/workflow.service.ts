import { ProjectStatus, Role } from '@prisma/client';

export class WorkflowService {
  /**
   * Enforces server-side workflow transition rules and returns the target status if allowed.
   * Throws an error if the transition is invalid or unauthorized.
   */
  static transition(
    currentStatus: ProjectStatus,
    targetStatus: ProjectStatus,
    userRole: Role
  ): ProjectStatus {
    if (currentStatus === targetStatus) {
      return targetStatus;
    }

    if (currentStatus === ProjectStatus.DELIVERED) {
      throw new Error('Invalid transition: Delivered projects are archived and read-only');
    }

    switch (currentStatus) {
      case ProjectStatus.DRAFT:
        if (targetStatus === ProjectStatus.IN_REVIEW) {
          if (userRole !== Role.CONSULTANT) {
            throw new Error('Unauthorized transition: Only consultants can submit projects for review');
          }
          return ProjectStatus.IN_REVIEW;
        }
        break;

      case ProjectStatus.IN_REVIEW:
        if (targetStatus === ProjectStatus.APPROVED) {
          if (userRole !== Role.CLIENT) {
            throw new Error('Unauthorized transition: Only clients can approve projects');
          }
          return ProjectStatus.APPROVED;
        }
        if (targetStatus === ProjectStatus.DRAFT) {
          if (userRole !== Role.CONSULTANT) {
            throw new Error('Unauthorized transition: Only consultants can revert a project to draft');
          }
          return ProjectStatus.DRAFT;
        }
        break;

      case ProjectStatus.APPROVED:
        if (targetStatus === ProjectStatus.DELIVERED) {
          if (userRole !== Role.CONSULTANT) {
            throw new Error('Unauthorized transition: Only consultants can mark projects as delivered');
          }
          return ProjectStatus.DELIVERED;
        }
        break;
    }

    throw new Error(`Invalid transition: Cannot transition project from ${currentStatus} to ${targetStatus}`);
  }
}
