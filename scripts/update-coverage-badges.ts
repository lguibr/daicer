#!/usr/bin/env tsx

/**
 * Update coverage badges in README.md
 * Reads coverage summary and updates badge URLs with correct percentages and colors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_SUMMARY = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
const README_PATH = path.join(__dirname, '..', 'README.md');

interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

interface CoverageSummary {
  backend: CoverageMetrics;
  frontend: CoverageMetrics;
  combined: CoverageMetrics;
}

/**
 * Get badge color based on coverage percentage
 */
function getBadgeColor(percentage: number): string {
  if (percentage >= 80) return 'brightgreen';
  if (percentage >= 70) return 'yellow';
  if (percentage >= 60) return 'orange';
  return 'red';
}

/**
 * Generate badge URL
 */
function generateBadgeUrl(label: string, percentage: number): string {
  const roundedPct = Math.round(percentage);
  const color = getBadgeColor(roundedPct);
  const encodedLabel = encodeURIComponent(label);
  return `https://img.shields.io/badge/${encodedLabel}-${roundedPct}%25-${color}`;
}

/**
 * Update README badges
 */
function updateReadmeBadges(): void {
  if (!fs.existsSync(ROOT_SUMMARY)) {
    console.error('❌ Coverage summary not found. Run coverage first.');
    process.exit(1);
  }

  if (!fs.existsSync(README_PATH)) {
    console.error('❌ README.md not found');
    process.exit(1);
  }

  const summary: CoverageSummary = JSON.parse(fs.readFileSync(ROOT_SUMMARY, 'utf-8'));
  let readme = fs.readFileSync(README_PATH, 'utf-8');

  const combinedUrl = generateBadgeUrl('coverage (combined)', summary.combined.statements);
  const backendUrl = generateBadgeUrl('backend', summary.backend.statements);
  const frontendUrl = generateBadgeUrl('frontend', summary.frontend.statements);

  // Replace or add badges (look for coverage badges in the header)
  const combinedBadgePattern = /!\[Coverage \(Combined\)\]\(https:\/\/img\.shields\.io\/badge\/[^\)]+\)/;
  const backendBadgePattern = /!\[Backend Coverage\]\(https:\/\/img\.shields\.io\/badge\/[^\)]+\)/;
  const frontendBadgePattern = /!\[Frontend Coverage\]\(https:\/\/img\.shields\.io\/badge\/[^\)]+\)/;

  // Old single badge pattern (for migration)
  const oldBadgePattern = /<img src="https:\/\/img\.shields\.io\/badge\/coverage[^"]*" alt="Coverage">/;

  if (oldBadgePattern.test(readme)) {
    // Migrate from old single badge to three badges
    readme = readme.replace(
      oldBadgePattern,
      `<img src="${combinedUrl}" alt="Coverage (Combined)">\n  <img src="${backendUrl}" alt="Backend Coverage">\n  <img src="${frontendUrl}" alt="Frontend Coverage">`
    );
    console.log('✅ Migrated from old coverage badge to new three-badge system');
  } else {
    // Update existing three badges
    if (combinedBadgePattern.test(readme)) {
      readme = readme.replace(combinedBadgePattern, `![Coverage (Combined)](${combinedUrl})`);
    } else {
      // Add combined badge after CI badge
      readme = readme.replace(/(!\[CI status\][^\)]+\))/, `$1\n  <img src="${combinedUrl}" alt="Coverage (Combined)">`);
    }

    if (backendBadgePattern.test(readme)) {
      readme = readme.replace(backendBadgePattern, `![Backend Coverage](${backendUrl})`);
    } else {
      // Add backend badge after combined
      readme = readme.replace(
        /(!\[Coverage \(Combined\)\][^\)]+\))/,
        `$1\n  <img src="${backendUrl}" alt="Backend Coverage">`
      );
    }

    if (frontendBadgePattern.test(readme)) {
      readme = readme.replace(frontendBadgePattern, `![Frontend Coverage](${frontendUrl})`);
    } else {
      // Add frontend badge after backend
      readme = readme.replace(
        /(!\[Backend Coverage\][^\)]+\))/,
        `$1\n  <img src="${frontendUrl}" alt="Frontend Coverage">`
      );
    }
  }

  fs.writeFileSync(README_PATH, readme);

  console.log('\n📊 Coverage Badges Updated:\n');
  console.log(`Combined: ${Math.round(summary.combined.statements)}% (${getBadgeColor(summary.combined.statements)})`);
  console.log(`Backend:  ${Math.round(summary.backend.statements)}% (${getBadgeColor(summary.backend.statements)})`);
  console.log(`Frontend: ${Math.round(summary.frontend.statements)}% (${getBadgeColor(summary.frontend.statements)})`);
  console.log(`\n✅ README.md updated successfully\n`);
}

// Main execution
try {
  console.log('🏷️  Updating coverage badges...\n');
  updateReadmeBadges();
  console.log('✨ Badge update complete!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error updating badges:', (error as Error).message);
  console.error((error as Error).stack);
  process.exit(1);
}
