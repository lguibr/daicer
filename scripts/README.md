# DAICE Scripts

Utility scripts for development, deployment, and automation.

## Release Notes Generator

**File:** `generate-release-notes.ts`

Automatically generates release notes from `thoughts/` directory using Google Gemini AI.

### How It Works

1. **Pre-commit Hook**: Runs automatically on `git commit`
2. **File Discovery**: Reads all unprocessed `.md` files from `thoughts/`
3. **Summarization**: Uses Gemini Flash 2.0 to create concise summaries
4. **Synthesis**: Uses Gemini 2.0 Pro to generate organized release notes
5. **State Tracking**: Maintains `release-notes-state.json` to avoid duplicate processing
6. **Versioning**: Auto-increments patch version (e.g., 0.0.1 → 0.0.2)

### Setup

1. Install dependencies:

```bash
yarn install
```

2. Add Gemini API key to environment:

```bash
export GEMINI_API_KEY="your_api_key_here"
```

Or add to `.env` file (not committed):

```
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

3. Initialize Husky:

```bash
yarn prepare
```

### Usage

**Automatic (Recommended):**

```bash
git commit -m "your commit message"
# Release notes auto-generated and staged
```

**Manual:**

```bash
yarn release:notes
```

### Output

- **File**: `RELEASE_NOTES.md` (root directory)
- **Format**: Markdown with version headers, categorized changes
- **Organization**:
  - 🎨 Features
  - 🐛 Bug Fixes
  - 📚 Documentation
  - 🔧 Improvements
  - etc.

### State File

**Location:** `scripts/release-notes-state.json`

Tracks:

- Current version number
- Last generation timestamp
- Processed files with their summaries

**Format:**

```json
{
  "version": "0.1.2",
  "lastGenerated": "2025-11-16T10:30:00.000Z",
  "processedFiles": {
    "2025-11-16_example-feature.md": {
      "date": "2025-11-16",
      "summary": "Implemented X feature with Y approach..."
    }
  }
}
```

### Configuration

**Environment Variables:**

- `GOOGLE_GEMINI_API_KEY` (required): Your Gemini API key

**Directories:**

- Input: `thoughts/`
- Output: `RELEASE_NOTES.md` (root)
- State: `scripts/release-notes-state.json`

### AI Models Used

1. **Gemini Flash 2.0** (`gemini-2.0-flash-exp`)
   - Purpose: Summarize individual thought documents
   - Max output: ~200 words per file
   - Focus: Key decisions, implementation details, rationale

2. **Gemini 2.0 Pro** (`gemini-2.0-flash-thinking-exp-1219`)
   - Purpose: Synthesize release notes from summaries
   - Output: Organized, categorized markdown
   - Focus: User-facing changes, technical improvements

### Troubleshooting

**Issue: API key not found**

```
❌ GEMINI_API_KEY not found in environment
```

**Solution:** Add the API key to your environment or `.env` file

**Issue: No new files to process**

```
✅ No new thoughts files to process
```

**Solution:** This is normal if all `thoughts/` files have been processed. Add new files to trigger generation.

**Issue: Pre-commit hook not running**

```bash
# Re-initialize Husky
yarn prepare
chmod +x .husky/pre-commit
```

### Integration with Workflow

1. **During Development**: Create thought documents in `thoughts/` following naming convention `YYYY-MM-DD_descriptive-name.md`
2. **On Commit**: Pre-commit hook automatically:
   - Processes new thoughts
   - Generates release notes
   - Stages `RELEASE_NOTES.md` and state file
3. **On Push**: Release notes are included in the commit
4. **For Releases**: Copy relevant sections from `RELEASE_NOTES.md` to GitHub releases

### Best Practices

- ✅ Write clear, detailed thought documents
- ✅ Follow the `YYYY-MM-DD_name.md` naming convention
- ✅ Include rationale and context in thoughts
- ✅ Review generated notes before pushing
- ❌ Don't manually edit `release-notes-state.json`
- ❌ Don't delete processed entries from state file

---

## Other Scripts

### `aggregate-coverage.ts`

Combines frontend and backend coverage reports.

### `update-coverage-badges.ts`

Updates coverage badges in README.

### `run-e2e.ts`

Orchestrates E2E test environment (ports, emulators, tests).

### `postman-to-openapi.js`

Converts Postman collection to OpenAPI spec.
