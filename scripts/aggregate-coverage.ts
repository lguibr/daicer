#!/usr/bin/env tsx

/**
 * Aggregate coverage reports from backend and frontend
 * Generates combined LCOV report and JSON summary at project root
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const BACKEND_LCOV = path.join(__dirname, '..', 'backend', 'coverage', 'lcov.info');
const FRONTEND_LCOV = path.join(__dirname, '..', 'frontend', 'coverage', 'lcov.info');
const ROOT_COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const ROOT_LCOV = path.join(ROOT_COVERAGE_DIR, 'lcov.info');
const ROOT_SUMMARY = path.join(ROOT_COVERAGE_DIR, 'coverage-summary.json');

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
 * Parse LCOV file to extract coverage metrics
 */
function parseLcovMetrics(lcovPath: string): CoverageMetrics {
  if (!fs.existsSync(lcovPath)) {
    console.warn(`⚠️  Coverage file not found: ${lcovPath}`);
    return { statements: 0, branches: 0, functions: 0, lines: 0 };
  }

  const lcov = fs.readFileSync(lcovPath, 'utf-8');
  const metrics = {
    linesFound: 0,
    linesHit: 0,
    functionsFound: 0,
    functionsHit: 0,
    branchesFound: 0,
    branchesHit: 0,
  };

  // Parse LCOV format
  lcov.split('\n').forEach((line) => {
    if (line.startsWith('LF:')) {
      metrics.linesFound += parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('LH:')) {
      metrics.linesHit += parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('FNF:')) {
      metrics.functionsFound += parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('FNH:')) {
      metrics.functionsHit += parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('BRF:')) {
      metrics.branchesFound += parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('BRH:')) {
      metrics.branchesHit += parseInt(line.split(':')[1], 10);
    }
  });

  // Calculate percentages
  return {
    statements: metrics.linesFound > 0 ? (metrics.linesHit / metrics.linesFound) * 100 : 0,
    branches: metrics.branchesFound > 0 ? (metrics.branchesHit / metrics.branchesFound) * 100 : 0,
    functions: metrics.functionsFound > 0 ? (metrics.functionsHit / metrics.functionsFound) * 100 : 0,
    lines: metrics.linesFound > 0 ? (metrics.linesHit / metrics.linesFound) * 100 : 0,
  };
}

/**
 * Merge LCOV files
 */
function mergeLcovFiles(): void {
  const lcovFiles = [BACKEND_LCOV, FRONTEND_LCOV].filter((file) => fs.existsSync(file));

  if (lcovFiles.length === 0) {
    console.error('❌ No coverage files found to merge');
    process.exit(1);
  }

  const mergedLcov = lcovFiles.map((file) => fs.readFileSync(file, 'utf-8')).join('\n');

  // Ensure root coverage directory exists
  if (!fs.existsSync(ROOT_COVERAGE_DIR)) {
    fs.mkdirSync(ROOT_COVERAGE_DIR, { recursive: true });
  }

  fs.writeFileSync(ROOT_LCOV, mergedLcov);
  console.log(`✅ Merged LCOV written to: ${ROOT_LCOV}`);
}

/**
 * Generate coverage summary JSON
 */
function generateSummary(): CoverageSummary {
  console.log('\n📊 Coverage Summary:\n');

  const backendMetrics = parseLcovMetrics(BACKEND_LCOV);
  const frontendMetrics = parseLcovMetrics(FRONTEND_LCOV);

  const combined: CoverageMetrics = {
    statements:
      backendMetrics.statements && frontendMetrics.statements
        ? (backendMetrics.statements + frontendMetrics.statements) / 2
        : backendMetrics.statements || frontendMetrics.statements,
    branches:
      backendMetrics.branches && frontendMetrics.branches
        ? (backendMetrics.branches + frontendMetrics.branches) / 2
        : backendMetrics.branches || frontendMetrics.branches,
    functions:
      backendMetrics.functions && frontendMetrics.functions
        ? (backendMetrics.functions + frontendMetrics.functions) / 2
        : backendMetrics.functions || frontendMetrics.functions,
    lines:
      backendMetrics.lines && frontendMetrics.lines
        ? (backendMetrics.lines + frontendMetrics.lines) / 2
        : backendMetrics.lines || frontendMetrics.lines,
  };

  const summary: CoverageSummary = {
    backend: {
      statements: Math.round(backendMetrics.statements * 10) / 10,
      branches: Math.round(backendMetrics.branches * 10) / 10,
      functions: Math.round(backendMetrics.functions * 10) / 10,
      lines: Math.round(backendMetrics.lines * 10) / 10,
    },
    frontend: {
      statements: Math.round(frontendMetrics.statements * 10) / 10,
      branches: Math.round(frontendMetrics.branches * 10) / 10,
      functions: Math.round(frontendMetrics.functions * 10) / 10,
      lines: Math.round(frontendMetrics.lines * 10) / 10,
    },
    combined: {
      statements: Math.round(combined.statements * 10) / 10,
      branches: Math.round(combined.branches * 10) / 10,
      functions: Math.round(combined.functions * 10) / 10,
      lines: Math.round(combined.lines * 10) / 10,
    },
  };

  fs.writeFileSync(ROOT_SUMMARY, JSON.stringify(summary, null, 2));

  // Print summary
  console.log(`Backend:  ${summary.backend.statements}% statements, ${summary.backend.lines}% lines`);
  console.log(`Frontend: ${summary.frontend.statements}% statements, ${summary.frontend.lines}% lines`);
  console.log(`Combined: ${summary.combined.statements}% statements, ${summary.combined.lines}% lines`);
  console.log(`\n✅ Summary written to: ${ROOT_SUMMARY}\n`);

  return summary;
}

// Main execution
try {
  console.log('🔄 Aggregating coverage reports...\n');
  mergeLcovFiles();
  generateSummary();
  console.log('✨ Coverage aggregation complete!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error aggregating coverage:', (error as Error).message);
  process.exit(1);
}
