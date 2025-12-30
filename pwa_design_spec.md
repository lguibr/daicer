# SOTA PWA Design Specification

## 1. Core Philosophy: "Native-App Feel"

To achieve a "State of the Art" PWA status in 2025, the application must be indistinguishable from a native app. It needs to handle offline states gracefully, install seamlessly, integrate with system capabilities, and look stunning on all devices (especially iOS and Android).

## 2. Mandatory Asset Strategy (The "Cool Coloring")

We will generate a comprehensive suite of icons and splash screens derived from `/logo.png`.

### 2.1. Adaptive Icons (Android)

Modern Android (Oreo+) uses adaptive icons (foreground + background).

- **Foreground**: The Daicer Logo (just the die/symbol).
- **Background**: `#09060a` (Midnight-50) or a subtle darker gradient.
- **Safe Zone**: The important content must be within the inner 66% of the icon.

### 2.2. Maskable Icons

For standard PWA installs on Android, "Maskable" icons prevent white bars around the icon.

- **Requirement**: The logo must have enough padding to be cropped into a circle, rounded rect, or teardrop.

### 2.3. iOS Human Interface Guidelines

iOS does not support the Web App Manifest icon fields fully yet. We need specific Apple Touch Icons.

- **Standard**: 180x180px PNG (non-transparent background is best to avoid black artifacts).
- **Splash Screens**: This is critical for the "Premium" feel. Without them, the user sees a white screen on startup. We need to generate `apple-touch-startup-image` media queries for every iPhone/iPad resolution.

### 2.4. Windows & Desktop

- **Favicons**: `.ico` (for legacy), `.svg` (modern browsers).
- **Tile**: Microsoft Tile color and image defined in `browserconfig.xml` (optional, but "SOTA").

### 2.5. Rich Install UI Assets (Manifest)

Chrome on Android now shows a "Rich Install UI" that looks like a Play Store listing.

- **Screenshots**: At least 3 screenshots (mobile & desktop sizing) defined in `manifest.json`.
  - Context: "Create your Hero", "Roll the Dice", "Galaxy Map".
  - _Action_: We will need to capture these once the main UI is polished.

## 3. The Manifest (`manifest.webmanifest`)

The brain of the PWA.

| Field              | Value/Strategy                               | Why?                                                                      |
| :----------------- | :------------------------------------------- | :------------------------------------------------------------------------ |
| `name`             | "Daicer"                                     | Short, punchy.                                                            |
| `short_name`       | "Daicer"                                     | Home screen label (max 12 chars).                                         |
| `description`      | "AI-enhanced dungeon mastering..."           | SEO and Store listing.                                                    |
| `id`               | `/?source=pwa`                               | Stable ID for analytics and window preservation.                          |
| `start_url`        | `/?source=pwa`                               | Track PWA launches vs web visits.                                         |
| `display`          | `standalone`                                 | No browser UI. Native feel.                                               |
| `display_override` | `["window-controls-overlay", "minimal-ui"]`  | Desktop: Allows custom title bar (e.g., custom window buttons).           |
| `background_color` | `#09060a`                                    | Splash background while loading.                                          |
| `theme_color`      | `#09060a`                                    | System bars (status bar) color.                                           |
| `orientation`      | `any`                                        | Support both modes (or lock if game requires).                            |
| `categories`       | `["games", "entertainment", "role-playing"]` | For cataloging.                                                           |
| `shortcuts`        | Array of Deep Links                          | Long-press icon actions (e.g., "New Game", "Resume").                     |
| `share_target`     | URL Template                                 | Allow users to share content _TO_ Daicer (e.g., import a character JSON). |

## 4. Service Worker Strategy (The Engine)

We will use **Workbox** (via `vite-plugin-pwa`) for robust caching.

- **Precaching**: The "App Shell" (HTML, JS, CSS, fonts, key UI icons). Loads instantly.
- **Runtime Caching**:
  - `NetworkFirst`: API calls (GraphQL). We want fresh data, but fall back to cache if offline (read-only mode).
  - `StaleWhileRevalidate`: User avatars, map tiles, static assets. Immediate load, update in background.
  - `CacheFirst`: Uploaded immutable images (once uploaded, they rarely change).
- **Offline Fallback**: A custom offline page if the user navigates to a non-cached route.

## 5. System Integration Features

To be truly SOTA:

- **Wake Lock API**: Prevent screen dimming during gameplay (critical for D&D sessions).
- **Badging API**: Notification badge on app icon (e.g., "3" unread turns).
- **Web Share API**: Native sheet to share invite links.
- **Push Notifications**: Standard `PushManager` integration for turn alerts.

## 6. Asset Generation List

We need to generate these specific files from `/logo.png` (assuming it's high-res):

1.  `favicon.ico` (32x32)
2.  `favicon.svg` (Optimized vector if available, else PNG)
3.  `pwa-64x64.png`
4.  `pwa-192x192.png` (Standard)
5.  `pwa-512x512.png` (Standard & Splash base)
6.  `maskable-icon-512x512.png` (With ~10% padding safe zone)
7.  `apple-touch-icon-180x180.png` (Opaque background preferred)
8.  `screenshot-mobile-*.png` (x3) - _Future Task_
9.  `screenshot-desktop-*.png` (x3) - _Future Task_
