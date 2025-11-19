# State-of-the-Art Dice Roll Card Pattern

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              DiceRollCard (React.memo)             │
│  ┌───────────────────────────────────────────────┐ │
│  │         useDiceRollState (Custom Hook)        │ │
│  │  ┌─────────────────────────────────────────┐  │ │
│  │  │  • Stable refs (never change)           │  │ │
│  │  │  • useMemo for dice data                │  │ │
│  │  │  • useCallback for handlers             │  │ │
│  │  │  • Single-run effects                   │  │ │
│  │  └─────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────┘ │
│                         │                           │
│                         ▼                           │
│              DiceRollAnimation                      │
│  ┌───────────────────────────────────────────────┐ │
│  │  • Receives stable props                     │ │
│  │  • autoStart={ref.current} (never changes)   │ │
│  │  • showAxes={false} (explicitly disabled)    │  │
│  │  • Proper WebGL cleanup                      │  │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Separation of Concerns

- **Hook**: Manages state logic
- **Component**: Handles presentation
- **Clear boundaries**: Hook returns everything component needs

### 2. Memoization Strategy

```typescript
// Component level - React.memo with custom comparison
const DiceRollCard = memo(Component, (prev, next) => {
  return (
    prev.animate === next.animate &&
    prev.roll.dice === next.roll.dice &&
    prev.roll.result === next.roll.result &&
    prev.roll.breakdown === next.roll.breakdown &&
    prev.roll.purpose === next.roll.purpose
  );
});

// Data level - useMemo for expensive calculations
const diceData = useMemo(() => {
  // Parse dice notation
  // Validate
  // Transform
  return stableDiceArray;
}, [roll.dice, roll.breakdown, roll.result]); // Only essential deps

// Callback level - useCallback for event handlers
const handleComplete = useCallback(() => {
  setAnimationComplete(true);
}, []); // No deps = never changes
```

### 3. Stable References Pattern

```typescript
// ✅ GOOD: Set once, never changes
const shouldAnimateRef = useRef(animate);

// ❌ BAD: Recalculates on every render
const shouldAnimate = animate && !hasAnimated;

// Why: autoStart prop stays constant across re-renders
<DiceRollAnimation autoStart={shouldAnimateRef.current} />
```

### 4. Single-Run Effects

```typescript
const initializedRef = useRef(false);

useEffect(() => {
  if (!initializedRef.current && shouldAnimate) {
    initializedRef.current = true;
    // Run animation setup ONCE
  }
}, [roll.result]); // Minimal deps
```

## Usage

### Basic

```typescript
import DiceRollCard from './DiceRollCard';

<DiceRollCard
  roll={{
    dice: '1d20+5',
    result: 18,
    breakdown: '[13] + 5',
    purpose: 'Attack Roll',
  }}
  animate={true}
/>
```

### In Lists (Important!)

```typescript
const rolls = useMemo(() => [
  { dice: '1d20+5', result: 18, breakdown: '[13] + 5' },
  { dice: '2d6', result: 8, breakdown: '[3, 5]' },
], []); // ✅ Stable array

return rolls.map((roll, i) => (
  <DiceRollCard
    key={roll.dice + roll.result} // ✅ Stable key
    roll={roll}
    animate={true}
  />
));
```

### With Dynamic Data

```typescript
// ✅ GOOD: Memoize roll object
const roll = useMemo(() => ({
  dice: `${count}d${sides}+${modifier}`,
  result: calculateResult(),
  breakdown: formatBreakdown(),
}), [count, sides, modifier]);

<DiceRollCard roll={roll} />

// ❌ BAD: New object every render
<DiceRollCard roll={{
  dice: `${count}d${sides}`,
  result: result, // New object = re-render!
}} />
```

## Benefits

### 1. Predictable Rendering

- Component only re-renders when roll data changes
- No flickering from unnecessary re-renders
- Stable WebGL context (no re-initialization)

### 2. Reusable Logic

- `useDiceRollState` can be used anywhere
- Logic separated from presentation
- Easy to test independently

### 3. Performance

```
Without memoization:
- Parent re-renders → Child re-renders
- WebGL context recreated
- Dice flicker/flash
- Poor UX

With memoization:
- Parent re-renders → Child checks props → No change → Skip render
- WebGL context stable
- Smooth animations
- Great UX
```

### 4. Type Safety

```typescript
// Centralized type definition
export interface DiceRollData {
  dice: string;
  result: number;
  breakdown?: string;
  purpose?: string;
}

// Used everywhere consistently
function useDiceRollState({ roll }: { roll: DiceRollData }) { ... }
function DiceRollCard({ roll }: { roll: DiceRollData }) { ... }
```

## Anti-Patterns (Don't Do This)

### ❌ Computed Values as Dependencies

```typescript
// BAD: shouldAnimate changes = effect re-runs = re-initialize
const shouldAnimate = animate && !hasAnimated;
useEffect(() => { ... }, [shouldAnimate]);

// GOOD: Use ref, stays stable
const shouldAnimateRef = useRef(animate);
useEffect(() => { ... }, []); // No deps needed
```

### ❌ New Objects in Render

```typescript
// BAD: New object every render
<DiceRollCard roll={{ dice: '1d20', result: 15 }} />

// GOOD: Stable reference
const roll = useMemo(() => ({ dice: '1d20', result: 15 }), []);
<DiceRollCard roll={roll} />
```

### ❌ Debug Logs in Effects

```typescript
// BAD: Causes re-renders!
useEffect(() => {
  console.log('State:', state);
}, [state]); // This runs on EVERY state change

// GOOD: Log in event handlers
const handleClick = () => {
  console.log('Clicked');
  doSomething();
};
```

### ❌ Missing Memoization

```typescript
// BAD: Always re-renders
export default function DiceRollCard({ roll }) { ... }

// GOOD: Only re-renders when props change
export default memo(DiceRollCard, (prev, next) => {
  return prev.roll.dice === next.roll.dice &&
         prev.roll.result === next.roll.result;
});
```

## Testing

```typescript
// Hook is testable independently
import { renderHook } from '@testing-library/react-hooks';
import { useDiceRollState } from './useDiceRollState';

test('parses dice notation', () => {
  const { result } = renderHook(() =>
    useDiceRollState({
      roll: { dice: '2d6', result: 8 },
      animate: false,
    })
  );

  expect(result.current.diceData).toHaveLength(2);
});

// Component is testable with mocked hook
vi.mock('./useDiceRollState');
```

## Checklist

When creating stable animated components:

- [ ] Custom hook for state logic
- [ ] React.memo with custom comparison
- [ ] useMemo for expensive calculations
- [ ] useCallback for event handlers
- [ ] useRef for values that shouldn't change
- [ ] Minimal effect dependencies
- [ ] Single-run effects with initialized flags
- [ ] Stable props to child components
- [ ] Proper cleanup in useEffect returns
- [ ] Type-safe interfaces exported

## Result

**Before**: Flickering, re-rendering, axes showing, inconsistent  
**After**: Smooth, stable, axes hidden, consistent across all uses

This pattern can be applied to ANY component with:

- Three.js/WebGL
- Expensive animations
- Complex state logic
- Need for stability
