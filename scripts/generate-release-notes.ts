#!/usr/bin/env tsx
/**
 * Release Notes Generator
 *
 * Processes thoughts/ files and generates release notes using Google Gemini.
 *
 * Flow:
 * 1. Read all thoughts/ files not yet processed (track via state file)
 * 2. Summarize each with Gemini Flash 2.0
 * 3. Synthesize final release notes with Gemini 2.0 Pro
 * 4. Update state to avoid duplicate processing
 * 5. Generate versioned RELEASE_NOTES.md
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// CONFIG
// ============================================================================

const THOUGHTS_DIR = join(process.cwd(), 'thoughts');
const STATE_FILE = join(process.cwd(), 'scripts', 'release-notes-state.json');
const RELEASE_NOTES_FILE = join(process.cwd(), 'RELEASE_NOTES.md');
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ============================================================================
// TYPES
// ============================================================================

interface ThoughtFile {
  filename: string;
  path: string;
  date: string;
  content: string;
}

interface ProcessedState {
  version: string;
  lastGenerated: string;
  processedFiles: {
    [filename: string]: {
      date: string;
      summary: string;
    };
  };
}

interface FileSummary {
  filename: string;
  date: string;
  summary: string;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

function loadState(): ProcessedState {
  if (!existsSync(STATE_FILE)) {
    return {
      version: '0.0.0',
      lastGenerated: new Date().toISOString(),
      processedFiles: {},
    };
  }

  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch (error) {
    console.warn('⚠️  Failed to parse state file, starting fresh');
    return {
      version: '0.0.0',
      lastGenerated: new Date().toISOString(),
      processedFiles: {},
    };
  }
}

function saveState(state: ProcessedState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function incrementVersion(version: string): string {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

// ============================================================================
// THOUGHTS FILE PROCESSING
// ============================================================================

function readThoughtsFiles(processedFiles: Set<string>): ThoughtFile[] {
  if (!existsSync(THOUGHTS_DIR)) {
    console.warn('⚠️  thoughts/ directory not found');
    return [];
  }

  const files = readdirSync(THOUGHTS_DIR)
    .filter((f) => f.endsWith('.md') && !processedFiles.has(f))
    .sort(); // Chronological order (YYYY-MM-DD prefix)

  return files.map((filename) => {
    const path = join(THOUGHTS_DIR, filename);
    const content = readFileSync(path, 'utf-8');
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : 'unknown';

    return { filename, path, date, content };
  });
}

// ============================================================================
// GEMINI API CALLS
// ============================================================================

async function summarizeWithFlash(thought: ThoughtFile): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are a technical documentation summarizer. Given a thought/planning document from a software project, create a concise summary that:

1. Captures the KEY decisions made
2. Highlights WHAT was implemented/changed
3. Notes WHY it was done (rationale)
4. Preserves important technical details
5. Omits implementation minutiae and step-by-step details

Format as markdown with clear bullet points. Maximum 200 words.

Document to summarize:
---
${thought.content}
---

Summary:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`❌ Failed to summarize ${thought.filename}:`, error);
    return `[Failed to summarize: ${thought.filename}]`;
  }
}

async function generateReleaseNotesWithPro(summaries: FileSummary[], version: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp-1219' });

  const summariesText = summaries.map((s) => `### ${s.date} - ${s.filename}\n\n${s.summary}`).join('\n\n---\n\n');

  const prompt = `You are a release notes generator for a D&D 5e AI Dungeon Master platform called DAICE.

Given the following summaries of implementation/planning documents, create professional, organized release notes for version ${version}.

Requirements:
1. Group changes by category (Features, Improvements, Bug Fixes, Documentation, etc.)
2. Use clear, concise language
3. Highlight user-facing changes prominently
4. Include technical changes but make them accessible
5. Format as beautiful, scannable markdown
6. Add emojis for visual organization (🎨 Features, 🐛 Fixes, 📚 Docs, etc.)
7. Include a brief overview section at the top
8. End with a "What's Next" or "Future Plans" section if relevant

Summaries:
---
${summariesText}
---

Generate release notes:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('❌ Failed to generate release notes:', error);
    throw error;
  }
}

// ============================================================================
// MAIN ORCHESTRATION
// ============================================================================

async function main() {
  console.log('🚀 Release Notes Generator\n');

  // 1. Load state
  const state = loadState();
  const processedFileSet = new Set(Object.keys(state.processedFiles));

  console.log(`📊 Current version: ${state.version}`);
  console.log(`📁 Processed files: ${processedFileSet.size}\n`);

  // 2. Read new thoughts files
  const newThoughts = readThoughtsFiles(processedFileSet);

  if (newThoughts.length === 0) {
    console.log('✅ No new thoughts files to process');
    return;
  }

  console.log(`📝 Found ${newThoughts.length} new thought(s) to process\n`);

  // 3. Summarize each with Gemini Flash
  const summaries: FileSummary[] = [];

  for (const thought of newThoughts) {
    console.log(`🤖 Summarizing: ${thought.filename}...`);
    const summary = await summarizeWithFlash(thought);

    summaries.push({
      filename: thought.filename,
      date: thought.date,
      summary,
    });

    // Update state incrementally
    state.processedFiles[thought.filename] = {
      date: thought.date,
      summary,
    };
  }

  console.log('\n✅ All files summarized\n');

  // 4. Generate release notes with Gemini Pro
  const newVersion = incrementVersion(state.version);
  console.log(`📄 Generating release notes v${newVersion}...`);

  const releaseNotes = await generateReleaseNotesWithPro(summaries, newVersion);

  // 5. Prepend to RELEASE_NOTES.md (newest first)
  let existingNotes = '';
  if (existsSync(RELEASE_NOTES_FILE)) {
    existingNotes = readFileSync(RELEASE_NOTES_FILE, 'utf-8');
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const newContent = `# DAICE Release Notes

---

## Version ${newVersion} (${timestamp})

${releaseNotes}

---

${existingNotes.replace(/^# DAICE Release Notes\s*\n*---\n*/m, '')}`;

  writeFileSync(RELEASE_NOTES_FILE, newContent.trim() + '\n', 'utf-8');

  // 6. Update state
  state.version = newVersion;
  state.lastGenerated = new Date().toISOString();
  saveState(state);

  console.log(`\n✅ Release notes generated: ${RELEASE_NOTES_FILE}`);
  console.log(`📦 Version: ${newVersion}`);
  console.log(`📁 Processed: ${newThoughts.length} new file(s)\n`);
}

// ============================================================================
// ENTRYPOINT
// ============================================================================

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
