# Logo Component

Animated logo component with configurable shake effects.

## Features

- **Square with min-size**: Always maintains aspect ratio
- **6 shake intensities**: none, subtle, normal, strong, extreme, chaotic
- **Configurable timing**: Control min/max interval between shakes
- **Adjustable duration**: Set animation length (200-2000ms)
- **Clickable**: Optional onClick handler
- **Responsive sizes**: sm (2rem), md (3rem), lg (8rem), xl (12rem)

## Usage

```tsx
import Logo from '@/components/ui/Logo';

// Basic usage (default: normal shake, 8-25s intervals)
<Logo size="md" />

// No shake
<Logo size="lg" shakeIntensity="none" />

// Subtle, frequent shake
<Logo
  size="lg"
  shakeIntensity="subtle"
  shakeMinInterval={3}
  shakeMaxInterval={8}
/>

// Chaotic, fast shake with custom duration
<Logo
  size="xl"
  shakeIntensity="chaotic"
  shakeMinInterval={1}
  shakeMaxInterval={4}
  shakeDuration={1000}
/>

// Clickable
<Logo
  size="md"
  onClick={() => navigate('/home')}
/>
```

## Props

| Prop               | Type                                                                   | Default    | Description                |
| ------------------ | ---------------------------------------------------------------------- | ---------- | -------------------------- |
| `size`             | `'sm' \| 'md' \| 'lg' \| 'xl'`                                         | `'md'`     | Logo size (square)         |
| `shakeIntensity`   | `'none' \| 'subtle' \| 'normal' \| 'strong' \| 'extreme' \| 'chaotic'` | `'normal'` | Animation intensity        |
| `shakeMinInterval` | `number`                                                               | `8`        | Min seconds between shakes |
| `shakeMaxInterval` | `number`                                                               | `25`       | Max seconds between shakes |
| `shakeDuration`    | `number`                                                               | `600`      | Animation duration (ms)    |
| `onClick`          | `() => void`                                                           | -          | Click handler              |
| `className`        | `string`                                                               | -          | Additional classes         |

## Shake Intensities

- **none**: No animation
- **subtle**: Gentle wobble (±1px, ±0.4°)
- **normal**: Balanced shake (±3px, ±1.5°)
- **strong**: 2D movement (±5px, ±3°)
- **extreme**: Adds scaling (±8px, ±5°, 0.97-1.03x)
- **chaotic**: Unpredictable with 12 keyframes (±10px, ±9°, 0.92-1.08x)

## Storybook

View all variations in Storybook:

```bash
npm run storybook
# Navigate to UI > Logo
```

Check out the **Playground** story to experiment with all controls!
