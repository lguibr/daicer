# 🎨 Frontend Testing Rules (The Lens)

> **Philosophy**: The Frontend is the _Lens_ through which the User sees the Engine. Tests here verify **Usability**, **Rendering**, and **Flow**. logic checks belong in the Engine; Frontend tests verify the _display_ of that logic.

## 1. The Component Library Standard (Storybook)

**Rule**: If it's a UI Component, it must have a Story.
**Why**: Visual bugs are caught by eyes, not just code.
**Implementation**:

- Interaction Tests (`play` function in Storybook) for buttons, inputs, and toggles.
- Verify "Empty State", "Loading State", and "Error State" visually.

## 2. Test User Flows, Not Implementation Details

**Rule**: Click the button, don't call the handler.
**Why**: Refactoring functionality shouldn't break tests if the user experience is unchanged.
**Implementation**:

- Use `testing-library/react`.
- `fireEvent.click(getByText('Attack'))`.
- Assert: `expect(getByText('Damage Dealt: 5')).toBeVisible()`.
- DO NOT assert: `expect(component.state.hasAttacked).toBe(true)`.

## 3. The "Network Disconnect" Test

**Rule**: The UI must not explode when the internet dies.
**Why**: Mobile users lose signal.
**Implementation**:

- Mock network failure in API calls.
- Assert that a designated "Toast" or "Error Boundary" appears.
- Assert that the app creates a "Pending Action" or cleanly resets state.

## 4. Visual Regression Defense

**Rule**: Pixels matter.
**Why**: CSS changes cascade unpredictably.
**Implementation**:

- Critical components (Character Sheet, Dice Roll Card) should have image snapshot tests.
- CI/CD fails if the "Attack Button" moves 50px to the left without approval.

## 5. Mock the Engine (Or Use it?)

**Rule**: Import the real `@daicer/engine` types, but MOCK the complex state wrappers.
**Implementation**:

- Do not rely on a running backend. Mock the `useQuery` hooks.
- Provide "Perfect State" data (conforming to Shared Kernel schemas) to components.
- Verify components handle "Garbage Data" gracefully (Schema mismatch fallback).

## 6. Accessibilty (a11y) is Mandatory

**Rule**: `jest-axe` checks on every page.
**Implementation**:

- Every major View/Screen text must pass basic accessibility checks.
- Buttons must have labels/aria-labels.
- Inputs must have associated labels.

## 7. E2E Critical Paths (Cypress/Playwright)

**Rule**: Smoke test the "Golden Path" only.
**Why**: E2E is slow.
**Implementation**:

- **Path 1**: Login -> Dashboard -> Open Character.
- **Path 2**: Enter Game Room -> Roll Dice -> See Result.
- If these fail, deploy is canceled.

## 8. Stable Selectors

**Rule**: Use `data-testid` for testing hooks.
**Why**: Trying to find `div > div > span:nth-child(3)` is fragile.
**Implementation**:

- Elements prone to testing get `data-testid="attack-button"`.
- Tests query by TestId. Styles can change, structure can change, but the ID remains.

## 9. Performance Budgets

**Rule**: Large lists (Inventory, Spellbook) must be virtualized or paginated.
**Implementation**:

- Test rendering 100 items vs 1000 items.
- Render time should not increase linearly (O(1) with virtualization).
