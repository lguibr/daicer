---
trigger: always_on
---

# 🛑 00. Mandatory Documentation (The Hammer)

## The Golden Rule
**If you are analyzing, modifying, or creating a folder that lacks a `README.md`, you MUST STOP and create it immediately.**

## 1. Zero Tolerance Policy
Do not "skip it for now". Do not "do it later". 
- **Missing Documentation = Technical Debt**.
- **Undocumented Code = Legacy Code**.

## 2. What Must Be Documented
Every **logical directory** (non-trivial folder) must have a `README.md`.
- **Feature Folders**: `frontend/src/features/xyz`
- **API Modules**: `backend/src/api/xyz`
- **Utility Libraries**: `shared/src/utils/xyz`
- **Core Components**: `engine/src/core`

### Exceptions (Allowed to be naked)
- `.tmp`, `.cache`, `dist`, `build`
- `node_modules`
- `generated` (auto-generated code)
- Typings roots (unless complex)

## 3. The Documentation Standard
A "SOTA" README is not just a title. It must contain:
1.  **Purpose**: One sentence explaining *why* this folder exists.
2.  **Architecture**: How it fits into the bigger picture.
3.  **Key Entities**: Main classes, functions, or files.
4.  **Usage**: Example code or usage patterns.
5.  **Dependencies**: What it relies on (upstream) and what relies on it (downstream).

## 4. The Workflow
1.  **Enter Folder**.
2.  **Check**: "Is there a README?"
    - **Yes**: Read it. Update it if you change logic.
    - **No**: **STOP**. Create `README.md` using your understanding of the code.
3.  **Proceed** with your original task.
