import { PrismaClient, Role, ProjectStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear database
  await prisma.comment.deleteMany({});
  await prisma.recommendationPack.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database...');

  // Create Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const consultant = await prisma.user.create({
    data: {
      email: 'consultant@nile.com',
      name: 'Sarah Consultant',
      passwordHash,
      role: Role.CONSULTANT,
    },
  });

  const client = await prisma.user.create({
    data: {
      email: 'client@nile.com',
      name: 'Alex Client',
      passwordHash,
      role: Role.CLIENT,
    },
  });

  console.log('Created users:', { consultant: consultant.email, client: client.email });

  // 1. Draft Project (only visible to consultant)
  const projectDraft = await prisma.project.create({
    data: {
      name: 'E-commerce Platform Architecture',
      clientName: 'Shopify-Partner Corp',
      description: 'Consultation and design recommendations for next-generation distributed checkout architecture.',
      status: ProjectStatus.DRAFT,
      clientId: client.id,
      consultantId: consultant.id,
      notes: {
        create: [
          {
            title: 'Initial Discovery Notes',
            content: 'Client wants to scale to 50k requests per second during peak holiday events. Legacy DB is SQL Server.',
          },
        ],
      },
      recommendationPack: {
        create: {
          executiveSummary: 'This document details the recommended migrations steps to transition the customer service checkout pipeline from monolithic database queries to localized Redis-cached edge instances.',
          keyFindings: '1. Monolith database encounters table locks at >2000 writes/sec.\n2. Checkout cart state is currently stored in SQL instead of memory.',
          recommendations: 'Implement a distributed caching layer and transition to event-driven transactional queues (Kafka or RabbitMQ).',
          risks: 'Potential data sync lag during high traffic bursts.',
          openQuestions: 'Do we need multi-region replication immediately, or is single-region sufficient for launch?',
        },
      },
    },
  });

  // 2. In Review Project (visible to client, client can comment and approve)
  const projectInReview = await prisma.project.create({
    data: {
      name: 'Cloud Security Audit & Compliance',
      clientName: 'SecureBank UK',
      description: 'Comprehensive analysis of AWS IAM permissions and SOC2 type 2 compliance readiness.',
      status: ProjectStatus.IN_REVIEW,
      clientId: client.id,
      consultantId: consultant.id,
      notes: {
        create: [
          {
            title: 'IAM Findings',
            content: 'Found 4 developers with permanent AdministratorAccess. Must transition to AWS IAM Identity Center (SSO).',
          },
        ],
      },
      recommendationPack: {
        create: {
          executiveSummary: 'This report summarizes the compliance gap assessment for SecureBank UK’s primary banking API backend hosted on AWS.',
          keyFindings: '1. Over-privileged IAM policies.\n2. CloudTrail logs are not stored in a write-once S3 bucket.\n3. Encryption at rest is missing on 2 legacy RDS instances.',
          recommendations: 'Restrict console access using temporary credentials, enforce KMS CMK encryption on all databases, and establish a security logging audit account.',
          risks: 'Production deployment window requires brief read-only mode during database key rotation.',
          openQuestions: 'Can we schedule the key rotation during the next scheduled monthly maintenance window?',
        },
      },
      comments: {
        create: [
          {
            authorId: client.id,
            content: 'We need to make sure the KMS encryption does not degrade our database latency. Has this been benchmarked?',
          },
          {
            authorId: consultant.id,
            content: 'AWS KMS key decryption overhead is negligible (<1ms) for our workload. We will configure envelope encryption to cache keys in-app.',
          },
        ],
      },
    },
  });

  console.log('Created projects:', { draft: projectDraft.name, inReview: projectInReview.name });
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
