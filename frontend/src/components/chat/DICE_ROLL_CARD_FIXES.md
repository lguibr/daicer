# Dice Roll Card - Compact Dice Display

## Summary

Fixed WebGL errors and created compact, inline dice display suitable for card layout.

## Changes Made

### 1. DiceRollCard Component

- **Compact inline layout** - 120x120px dice canvas on the left
- **Better proportions** - Dice don't overwhelm the card
- **Horizontal layout** - Dice beside the result, not above
- **Small size** - Uses `size="small"` for dice
- **Added `hasAnimatedRef`** - Prevents re-animation on component re-renders
- **Keeps final frame visible** - Dice stay visible after animation completes

### 2. Layout Structure

```tsx
<Card>
  {/* Purpose */}
  <p>Attack Roll</p>

  <div className="flex items-center justify-between gap-4">
    {/* Compact Dice - 120x120px */}
    <div className="flex-shrink-0">
      <DiceRollAnimation size="small" style={{ width: '120px', height: '120px' }} />
    </div>

    {/* Result and Breakdown */}
    <div className="flex-1">
      <p>18</p>
      <p>1d20+5</p>
      <code>[13] + 5</code>
    </div>
  </div>
</Card>
```

### 3. DiceRollAnimation Updates

#### Custom Size Support

```typescript
const canvasStyle = useMemo(() => {
  // Use explicit style dimensions if provided
  if (style?.width && style?.height) {
    return {
      ...style,
      position: 'relative' as const,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };
  }

  // Otherwise use size map
  const baseSize = CONTAINER_SIZE_MAP[size];
  return { width: `${baseSize}px`, height: `${baseSize}px`, ... };
}, [size, style]);
```

#### Dimension Validation

- Validates container dimensions before WebGL init
- Falls back to default size if needed
- Skips initialization if zero-sized

#### Performance Optimizations

- Capped pixel ratio at 2x
- Power preference: 'high-performance'
- Proper context disposal with `forceContextLoss()`

## WebGL Errors Fixed

✅ `GL_INVALID_FRAMEBUFFER_OPERATION: Attachment has zero size`  
✅ `WARNING: Too many active WebGL contexts`  
✅ `THREE.WebGLRenderer: Context Lost`

## Usage Example

```tsx
// Animated with compact dice
<DiceRollCard
  roll={{
    dice: '1d20+5',
    result: 18,
    breakdown: '[13] + 5',
    purpose: 'Attack Roll',
  }}
  animate={true}
/>

// Multiple dice - still compact
<DiceRollCard
  roll={{
    dice: '2d8+3',
    result: 15,
    breakdown: '[6, 6] + 3',
    purpose: 'Damage Roll',
  }}
  animate={true}
/>
```

## Visual Design

### Before

```
┌─────────────────────────┐
│ Attack Roll             │
├─────────────────────────┤
│                         │
│    [Large dice area]    │
│    280x280px            │
│                         │
├─────────────────────────┤
│ 18      [13] + 5        │
└─────────────────────────┘
```

### After

```
┌────────────────────────────────┐
│ Attack Roll                    │
├────────────────────────────────┤
│ ┌────┐                         │
│ │🎲  │  18        [13] + 5     │
│ │120x│  1d20+5                 │
│ └────┘                         │
└────────────────────────────────┘
```

## Dimensions

- **Card**: Full width, ~100-120px height
- **Dice canvas**: 120x120px (compact, inline)
- **Size**: `small` (optimized for cards)
- **Gap**: 4 (1rem between dice and result)

## Features

1. ✅ **Compact layout**: Dice don't dominate the card
2. ✅ **One-time animation**: Won't re-animate on re-render
3. ✅ **Always visible**: Dice stay after animation
4. ✅ **Color-coded**: Red (bad) → Yellow (ok) → Green (good)
5. ✅ **Exact representation**: Shows correct die type
6. ✅ **Multiple dice**: Handles 2d8, 3d6, etc.
7. ✅ **WebGL safe**: Proper cleanup and validation

## Performance

- **120x120px** = Much smaller rendering area
- **Pixel ratio capped** at 2x
- **Proper disposal** of WebGL contexts
- **Mobile optimized** with smaller canvas
