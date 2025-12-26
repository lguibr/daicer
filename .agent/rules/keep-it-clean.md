# Keep It Clean Policy

To maintain a healthy and manageable codebase, we must adhere to the following cleanup rules. We should never "trash" the project with unnecessary artifacts.

## What to Clean

1.  **Logs**: Remove all `console.log`, `print`, or debug output statements used during development before committing.
2.  **Test Scripts**: delete one-off scripts, temporary test files, or "playground" files used for experimentation. If a script is useful, document it and move it to a proper scripts directory; otherwise, delete it.
3.  **Temporary Files**: Remove `.tmp` files, generated artifacts not meant for source control, and any other debris created during the dev process.
4.  **Comments**: Remove commented-out code. Use git history if you need to reference old code.

## When to Clean

- **Before Committing**: Always review your staged changes to ensure no trash is included.
- **After Task Completion**: Once a feature or bug fix is verified, sweep through the modified directories to remove any remnants of the development process.

**Rule**: Leave the codebase cleaner than you found it.
