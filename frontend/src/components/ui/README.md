# UI Primitives

Tailwind + Radix-based component primitives that underpin every screen. Keep them lean, accessible, and theme-aware.

---

## Philosophy

- **Composable**: Build larger surfaces by combining primitives, not by duplicating styling.
- **Accessible defaults**: Proper semantics, ARIA attributes, focus states baked in.
- **Theme driven**: Colors, spacing, and typography sourced from Tailwind tokens (`aurora`, `nebula`, `midnight`).
- **Deterministic variants**: Use `class-variance-authority` to maintain a single source of truth for styling permutations.

---

## Catalogue

| Category      | Components                                                             | Notes                                                           |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Form Controls | `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Toggle`, `Label` | Wrap Radix primitives where it adds value; otherwise plain HTML |
| Layout        | `Card`, `Sheet`, `Dialog`, `Tabs`, `Accordion`                         | Guarantee animated transitions respect `prefers-reduced-motion` |
| Feedback      | `Toaster`, `Alert`, `Badge`, `Progress`, `Skeleton`                    | Use consistent iconography and color semantics                  |
| Navigation    | `Breadcrumb`, `Tabs`, `Menu`, `Pagination`                             | Keep keyboard navigation first-class                            |
| Visual        | `AnimatedBackground`, `LanguageSelector`, `Avatar`                     | Provide fallback states for missing data                        |

See `components/ui/index.ts` for barrel exports.

---

## Usage Examples

### Button Variants

```tsx
import { Button } from '@/components/ui/button';

function Actions() {
  return (
    <div className="flex gap-2">
      <Button>Continue</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
      <Button size="icon" aria-label="Open debug panel">
        ⚙️
      </Button>
    </div>
  );
}
```

### Form Layout

```tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function WorldSettingsForm() {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="world-name">World Name</Label>
        <Input id="world-name" maxLength={48} required />
      </div>
      <div>
        <Label htmlFor="world-prompt">Prompt</Label>
        <Textarea id="world-prompt" rows={5} />
      </div>
    </form>
  );
}
```

---

## Styling System

- Tailwind config extends theme with custom colors:
  - `aurora` (cyan gradient) for primary actions.
  - `nebula` (purple) for secondary accents.
  - `ember` (orange) for combat emphasis.
- `cn()` utility merges class names safely (`src/lib/utils.ts`).
- Dark mode by default; respect light mode experiments by toggling `data-theme`.

---

## Accessibility Notes

- Focus outlines are highly visible (`ring-2 ring-aurora-500`).
- `Select` uses Radix primitives to ensure keyboard + screen reader support.
- Motion utilities (`AnimatedBackground`) check `prefers-reduced-motion`.
- `LanguageSelector` exposes `aria-label` and uses ISO language codes.

---

## Testing

```bash
yarn test frontend/src/components/ui/__tests__
```

- Snapshot structural output to catch regressions.
- Use Testing Library for interaction (e.g. dropdown navigation).
- For motion components, mock `IntersectionObserver` / timers where needed.

---

## Storybook Coverage

- Stories under `UI/` show every variant + disabled/invalid states.
- Add docs stories when introducing new primitives to describe usage constraints.

Run Storybook:

```bash
yarn storybook
```

---

## Adding a Primitive

1. Create component file (e.g. `switch.tsx`).
2. Wrap Radix primitive if accessible semantics already solved.
3. Define `cva` variants for size/color if relevant.
4. Provide test + story + doc comment.
5. Export from `components/ui/index.ts` and update this README.
