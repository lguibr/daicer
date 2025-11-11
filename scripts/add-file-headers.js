#!/usr/bin/env node
/**
 * @file scripts/add-file-headers.js
 * @description Script to add standardized file headers with path and README update reminders
 * @note This script adds headers to TypeScript/JavaScript files
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const EXTENSIONS_TO_PROCESS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.storybook',
  'emulator-data',
];

/**
 * Check if file already has a header
 */
function hasHeader(content) {
  return content.trimStart().startsWith('/**\n * @file');
}

/**
 * Generate file header
 */
function generateHeader(filePath) {
  const relativePath = relative(PROJECT_ROOT, filePath);
  const isComponent = filePath.includes('/components/');
  
  let header = `/**
 * @file ${relativePath}`;
  
  if (isComponent) {
    header += `
 * @note Update README.md in this directory when modifying component behavior or props`;
  }
  
  header += `
 */\n\n`;
  
  return header;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    
    if (hasHeader(content)) {
      console.log(`✓ Already has header: ${relative(PROJECT_ROOT, filePath)}`);
      return false;
    }
    
    const header = generateHeader(filePath);
    const newContent = header + content;
    
    writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Added header: ${relative(PROJECT_ROOT, filePath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dir) {
  let count = 0;
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      // Skip excluded directories
      if (EXCLUDE_PATTERNS.some(pattern => fullPath.includes(pattern))) {
        continue;
      }
      
      if (stat.isDirectory()) {
        count += processDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = entry.substring(entry.lastIndexOf('.'));
        if (EXTENSIONS_TO_PROCESS.includes(ext)) {
          if (processFile(fullPath)) {
            count++;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message);
  }
  
  return count;
}

// Main execution
const targetDir = process.argv[2] || PROJECT_ROOT;
console.log(`\n🔍 Adding file headers to: ${targetDir}\n`);

const count = processDirectory(targetDir);

console.log(`\n✅ Added headers to ${count} file(s)\n`);

