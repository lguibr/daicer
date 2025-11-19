# DiceRollCard - Flickering Fix

## Problem

Dice were flickering white, appearing, then disappearing due to:

1. **Re-render instability**: `shouldAnimate` was recalculating on every render
2. **State changes**: Debug logs caused unnecessary re-renders
3. **Prop changes**: `autoStart` was changing from `true` → `false` on re-renders

## Root Cause

```typescript
// BAD: Recalculates on every render
const shouldAnimate = animate && !hasAnimatedRef.current;

// Re-render sequence:
// 1. First render: shouldAnimate = true, hasAnimatedRef = false
// 2. Animation starts, hasAnimatedRef = true
// 3. State change triggers re-render
// 4. Now: shouldAnimate = false (because hasAnimatedRef = true)
// 5. DiceRollAnimation receives autoStart={false}
// 6. Component re-initializes or hides → FLICKER!
```

## Solution

### 1. Stable Ref for Animation State

```typescript
// GOOD: Set once at mount, never changes
const shouldAnimateRef = useRef(animate && !hasAnimatedRef.current);

// This ref NEVER changes after component mounts
// So autoStart prop stays constant: autoStart={shouldAnimateRef.current}
```

### 2. Remove Debug Logs

```typescript
// REMOVED: This caused re-renders
useEffect(() => {
  console.debug('DiceRollCard render state:', { ... });
}, [/* many dependencies */]);
```

### 3. Initialize Display Value Correctly

```typescript
// Before: Always started at 0
const [displayValue, setDisplayValue] = useState(0);

// After: Start at result if not animating
const [displayValue, setDisplayValue] = useState(animate ? 0 : roll.result);
```

### 4. Stable Effect Dependencies

```typescript
// Before: Depended on computed value
useEffect(() => { ... }, [shouldAnimate, roll.result]);

// After: Only depend on actual data
useEffect(() => { ... }, [roll.result]);
```

## Changes Made

### DiceRollCard.tsx

1. **Stable animation ref**:

   ```typescript
   const shouldAnimateRef = useRef(animate && !hasAnimatedRef.current);
   ```

2. **Removed debug logs** that caused re-renders

3. **Stable props to DiceRollAnimation**:

   ```tsx
   <DiceRollAnimation
     autoStart={shouldAnimateRef.current} // Never changes!
     // ... other props
   />
   ```

4. **Better initial state**:
   ```typescript
   const [displayValue, setDisplayValue] = useState(animate ? 0 : roll.result);
   ```

## Test Coverage

Created comprehensive tests in `__tests__/DiceRollCard.test.tsx`:

- ✅ Basic rendering
- ✅ Dice parsing (d4, d6, d8, d10, d12, d20)
- ✅ Multiple dice (2d8, 3d6, etc.)
- ✅ Critical rolls (nat 20, nat 1)
- ✅ Animation behavior
- ✅ Breakdown parsing
- ✅ Edge cases (invalid notation, missing breakdown)
- ✅ Visual states

Run tests:

```bash
cd frontend && npm test -- DiceRollCard.test.tsx
```

## Before vs After

### Before (Flickering)

```
Render 1: shouldAnimate=true, autoStart=true → Dice appear
State change (debug log, animation start, etc.)
Render 2: shouldAnimate=false, autoStart=false → Dice disappear!
Render 3: shouldAnimate=false, autoStart=false → Dice gone
```

### After (Stable)

```
Mount:    shouldAnimateRef.current=true (set once)
Render 1: autoStart={shouldAnimateRef.current} → Dice appear
Any state changes...
Render 2: autoStart={shouldAnimateRef.current} → Still true, dice stay!
Render 3: autoStart={shouldAnimateRef.current} → Still true, dice stay!
```

## Key Principles

1. **Use refs for values that should NEVER change after mount**
2. **Minimize effect dependencies to prevent re-runs**
3. **Remove debug logs that run on every render**
4. **Pass stable props to child components**
5. **Initialize state correctly based on initial props**

## Debugging

If dice still flicker, check:

1. **Parent component re-rendering** with new `roll` object:

   ```typescript
   // BAD: Creates new object every render
   <DiceRollCard roll={{ dice: '1d20', result: 15 }} />

   // GOOD: Stable reference
   const roll = useMemo(() => ({ dice: '1d20', result: 15 }), []);
   <DiceRollCard roll={roll} />
   ```

2. **DiceRollAnimation unmounting**:
   - Check if parent is conditionally rendering
   - Ensure `diceData` array is stable (using useMemo)

3. **WebGL context issues**:
   - Check console for GL errors
   - Ensure proper cleanup in DiceRollAnimation

## Console Output

Reduced console noise:

- ✅ Removed render state logging
- ✅ Kept parse warnings for debugging
- ✅ Kept error logging for failures
