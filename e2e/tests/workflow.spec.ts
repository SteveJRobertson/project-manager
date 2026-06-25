import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execSync } from 'child_process';
import path from 'path';

const CONSULTANT = { email: 'consultant@nile.com', password: 'Password123!' };
const CLIENT = { email: 'client@nile.com', password: 'Password123!' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetDatabase() {
  const repoRoot = path.resolve(__dirname, '../..'); // e2e/tests/workflow.spec.ts -> repo root
  try {
    // Try running it inside Docker Compose first (for CI and standard Docker workflow)
    execSync('docker compose exec -T backend npm run db:seed -w backend', { cwd: repoRoot, stdio: 'ignore' });
  } catch (error) {
    if (process.env.CI) {
      // In CI, fail fast if the docker compose exec reset fails
      throw new Error(`Failed to reset database status in CI: ${error}`);
    }
    try {
      // Fallback to running it locally on host (in case services are run natively)
      execSync('npm run db:seed -w backend', { cwd: repoRoot, stdio: 'ignore' });
    } catch (localError) {
      console.warn('Warning: Failed to reset database status. Test states might be inconsistent.');
    }
  }
}

async function login(page: import('@playwright/test').Page, credentials: typeof CONSULTANT) {
  await page.goto('/');
  await page.waitForSelector('#email');
  await page.fill('#email', credentials.email);
  await page.fill('#password', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Projects Dashboard');
}

async function logout(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /sign out/i }).click();
  await page.waitForSelector('#email');
}

async function openProjectDetail(page: import('@playwright/test').Page, projectName: string) {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: projectName }),
  });
  await card.getByRole('button', { name: /view details/i }).click();
  await page.waitForSelector(`h1:has-text("${projectName}")`);
}

async function scanForA11yViolations(page: import('@playwright/test').Page, context: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map(n => n.target).join(', ')}`)
      .join('\n');
    throw new Error(`${results.violations.length} WCAG AA violation(s) on ${context}:\n${summary}`);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe.serial('Nile Project Manager — Full Project Review Workflow', () => {
  test.beforeAll(async () => {
    resetDatabase();
  });

  // ── Accessibility: Login Page ──────────────────────────────────────────────

  test('login page has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#email');
    await scanForA11yViolations(page, 'Login page');
  });

  // ── Step 1: Consultant logs in and views dashboard ─────────────────────────

  test('consultant sees all projects including DRAFT on dashboard', async ({ page }) => {
    await login(page, CONSULTANT);

    await expect(page.getByRole('heading', { name: /projects dashboard/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'E-commerce Platform Architecture' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cloud Security Audit & Compliance' })).toBeVisible();
    await expect(page.getByText('DRAFT')).toBeVisible();
    await expect(page.getByText('IN REVIEW')).toBeVisible();

    await scanForA11yViolations(page, 'Consultant dashboard');
  });

  // ── Step 2: Consultant views draft project and submits for review ──────────

  test('consultant opens draft project — detail page has no WCAG AA violations', async ({ page }) => {
    await login(page, CONSULTANT);
    await openProjectDetail(page, 'E-commerce Platform Architecture');

    // Internal notes should be visible to consultant
    await expect(page.getByText('Internal Notes')).toBeVisible();
    await expect(page.getByText('Initial Discovery Notes')).toBeVisible();

    // Submit for Review button should be visible
    await expect(page.getByRole('button', { name: /submit for review/i })).toBeVisible();

    await scanForA11yViolations(page, 'Project detail page (consultant, DRAFT)');
  });

  test('consultant submits draft project for review — status transitions to IN REVIEW', async ({ page }) => {
    await login(page, CONSULTANT);
    await openProjectDetail(page, 'E-commerce Platform Architecture');

    await page.getByRole('button', { name: /submit for review/i }).click();

    // Badge should update to IN REVIEW
    await expect(page.getByText('IN REVIEW')).toBeVisible();

    // Submit for Review button should be gone; Revert to Draft should appear
    await expect(page.getByRole('button', { name: /submit for review/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /revert to draft/i })).toBeVisible();
  });

  // ── Step 3: Client logs in, cannot see DRAFT, adds comment, approves ───────

  test('client sees only non-DRAFT projects on dashboard', async ({ page }) => {
    await login(page, CLIENT);

    // Both projects are now IN_REVIEW — client should see both
    await expect(page.getByRole('heading', { name: 'E-commerce Platform Architecture' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cloud Security Audit & Compliance' })).toBeVisible();

    // No DRAFT badge should exist for client
    await expect(page.getByText('DRAFT')).not.toBeVisible();

    await scanForA11yViolations(page, 'Client dashboard');
  });

  test('client views project detail — internal notes are hidden', async ({ page }) => {
    await login(page, CLIENT);
    await openProjectDetail(page, 'Cloud Security Audit & Compliance');

    // Notes section must not be visible to client
    await expect(page.getByText('Internal Notes')).not.toBeVisible();

    // Approve button should be visible; Revert/Submit should not
    await expect(page.getByRole('button', { name: /approve project/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /submit for review/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /revert to draft/i })).not.toBeVisible();

    await scanForA11yViolations(page, 'Project detail page (client, IN_REVIEW)');
  });

  test('client adds a comment to the project', async ({ page }) => {
    await login(page, CLIENT);
    await openProjectDetail(page, 'Cloud Security Audit & Compliance');

    const commentText = 'E2E test: can we confirm encryption overhead benchmarks before approving?';
    await page.getByPlaceholder(/write a comment/i).fill(commentText);
    await page.getByRole('button', { name: /add comment/i }).click();

    // Comment should appear in the thread
    const commentItem = page.locator('div').filter({ has: page.locator('p', { hasText: commentText }) }).last();
    await expect(commentItem).toBeVisible();
    // Author name should be visible next to comment
    await expect(commentItem.getByText('Alex Client')).toBeVisible();
  });

  test('client approves project — status transitions to APPROVED', async ({ page }) => {
    await login(page, CLIENT);
    await openProjectDetail(page, 'Cloud Security Audit & Compliance');

    await page.getByRole('button', { name: /approve project/i }).click();

    // Badge should update to APPROVED
    await expect(page.getByText('APPROVED')).toBeVisible();

    // Approve button should be gone
    await expect(page.getByRole('button', { name: /approve project/i })).not.toBeVisible();
  });

  // ── Step 4: Consultant marks approved project as delivered ─────────────────

  test('consultant marks approved project as delivered — status transitions to DELIVERED', async ({ page }) => {
    await login(page, CONSULTANT);
    await openProjectDetail(page, 'Cloud Security Audit & Compliance');

    // Mark as Delivered should be visible for consultant on APPROVED project
    await expect(page.getByRole('button', { name: /mark as delivered/i })).toBeVisible();
    await page.getByRole('button', { name: /mark as delivered/i }).click();

    // Badge should update to DELIVERED
    await expect(page.getByText('DELIVERED')).toBeVisible();

    // No further action buttons should exist
    await expect(page.getByRole('button', { name: /mark as delivered/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /submit for review/i })).not.toBeVisible();

    await scanForA11yViolations(page, 'Project detail page (consultant, DELIVERED)');
  });

});
