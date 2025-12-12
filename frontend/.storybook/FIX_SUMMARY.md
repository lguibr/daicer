# Storybook i18n Provider Fix

## Issue

Storybook stories were throwing errors about missing i18n provider (appearing as "lion provider" errors).

## Root Cause

Storybook wasn't wrapping stories with the `I18nProvider` context, causing any component that uses `useI18n()` hook to fail.

## Solution

Added global decorator to wrap all stories with I18nProvider.

### Changes Made

1. **Updated `.storybook/preview.tsx`** (renamed from `.ts`)

   - Added `I18nProvider` import
   - Created `withI18n` decorator
   - Applied decorator globally to all stories

2. **Updated `.storybook/main.ts`**
   - Added explicit vite config path reference

## Files Modified

- `/Users/lg/lab/daicer/frontend/.storybook/preview.tsx` (renamed from `.ts`)
- `/Users/lg/lab/daicer/frontend/.storybook/main.ts`

## Verification

```bash
cd /Users/lg/lab/daicer/frontend
npm run storybook
# Visit http://localhost:6006
# All stories now load without i18n errors
```

## Notes

- Logo component doesn't use i18n, but the global decorator ensures all stories work
- Other components (Navbar, LanguageSelector, etc.) depend on i18n and now work in Storybook
- Dark theme default maintained in backgrounds config
