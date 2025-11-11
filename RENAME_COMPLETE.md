# Project Renamed to Daicer - Manual Steps Required

## Summary

All code and configuration files have been renamed from "d20ai" to "daicer". The following changes were made:

### Updated Files

**Package Configuration:**

- ✅ `package.json`: `d20ai` → `daicer`
- ✅ `frontend/package.json`: `d20ai-frontend` → `daicer-frontend`
- ✅ `backend/package.json`: `d20ai-backend` → `daicer-backend`

**Code References:**

- ✅ `frontend/src/services/spells.ts`: Import path updated
- ✅ `frontend/src/i18n.ts`: localStorage key `d20ai-language` → `daicer-language`
- ✅ `frontend/src/i18n/index.tsx`: localStorage key and app title updated to "Daicer"
- ✅ `seeds/scripts/seed-spells.ts`: Firebase project ID `d20ai-dev` → `daicer-dev`

**Docker Configuration:**

- ✅ `docker-compose.yml`: Network name `d20ai-network` → `daicer-network`
- ✅ `backend/cloudbuild.yaml`: All image tags and service name updated to `daicer-backend`

**Documentation:**

- ✅ `README.md`: Title and project references updated to "Daicer"
- ✅ `COMMANDS.md`: Monorepo reference updated
- ✅ `CONTRIBUTING.md`: All references updated
- ✅ `backend/README.md`: Title and Cloud Run commands updated

## Required Manual Steps

**IMPORTANT:** You must complete these steps to finish the rename:

### 1. Close Workspace

Exit Cursor and close the current workspace.

### 2. Rename Directory

```bash
mv /Users/lg/lab/d20ai /Users/lg/lab/daicer
```

### 3. Reopen Workspace

Open Cursor and load the workspace from the new location:

```
/Users/lg/lab/daicer
```

### 4. Reinstall Dependencies

The package names have changed, so you need to rebuild node_modules:

```bash
cd /Users/lg/lab/daicer
yarn install:all
```

### 5. Clear Browser Data

The localStorage key for language preference has changed:

- Open DevTools (F12)
- Go to Application → Local Storage
- Delete the old `d20ai-language` key (or clear all)
- Refresh the page

### 6. Restart Firebase Emulators

If you have emulator data that references the old project name:

```bash
# Optional: Remove old emulator data
rm -rf emulator-data

# Start fresh
yarn dev
```

## Verification

After completing the manual steps, verify the rename:

1. ✅ Directory is `/Users/lg/lab/daicer`
2. ✅ `yarn dev` starts without errors
3. ✅ Frontend shows "Daicer" as the app title
4. ✅ Language selection works and persists with new localStorage key
5. ✅ No console errors about missing modules

## Notes

- The D&D game mechanics and gameplay text remain unchanged (d20 dice rolls, etc.)
- All Docker images will now be tagged as `daicer-backend`
- Firebase project ID for emulators is now `daicer-dev`
- Cloud Run service name is now `daicer-backend`

You can delete this file after completing the manual steps.
