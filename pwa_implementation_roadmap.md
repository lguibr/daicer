# PWA Implementation Roadmap

## Phase 1: Asset Preparation (The "Cool Coloring")

We need to create the physical files in `frontend/public/`.

- [ ] **Step 1.1**: Assess `logo.png`. If it has a transparent background, we need to generate two versions:
  - `logo-filled.png`: Logo on `#09060a` background (for Apple Touch & Maskable).
  - `logo-transparent.png`: Original (for Adaptive Foreground).
- [ ] **Step 1.2**: Use an asset generator (CLI or automated tool) to produce:
  - `/public/pwa-64x64.png`
  - `/public/pwa-192x192.png`
  - `/public/pwa-512x512.png`
  - `/public/maskable-icon-512x512.png`
  - `/public/apple-touch-icon-180x180.png`
  - `/public/favicon.ico`
- [ ] **Step 1.3**: Create `robots.txt` and `sitemap.xml` placeholders if not present (good PWA practice).

## Phase 2: Configuration (The Manifest)

- [ ] **Step 2.1**: Install `vite-plugin-pwa`.
  ```bash
  npm install vite-plugin-pwa -D
  ```
- [ ] **Step 2.2**: Configure `vite.config.ts`.
  - Import `VitePWA`.
  - Inject the Manifest JSON object defined in the Design Spec.
  - Set `theme_color` and `background_color` to `#09060a`.
- [ ] **Step 2.3**: Update `index.html`.
  - Add `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">`
  - Add `<meta name="theme-color" content="#09060a">`
  - Add `<meta name="apple-mobile-web-app-capable" content="yes">`
  - Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`

## Phase 3: Service Worker (The Engine)

- [ ] **Step 3.1**: Enable `registerType: 'autoUpdate'` initially (easier for users).
- [ ] **Step 3.2**: Configure Workbox Runtime Caching in `vite.config.ts`.
  - Cache Google Fonts.
  - Cache Images.
  - NetworkFirst for `/graphql`.
- [ ] **Step 3.3**: Component for "New Version Available".
  - Even with auto-update, sometimes a refresh is needed. Create a `ReloadPrompt` component.

## Phase 4: Integration (The Logic)

- [ ] **Step 4.1**: Create `useWakeLock` hook.
  - Call `navigator.wakeLock.request('screen')` when entering a game room.
- [ ] **Step 4.2**: Install UI.
  - Listen for `beforeinstallprompt` event.
  - Create a discrete "Install App" button in the Sidebar or Header.
  - Show a polished "Install Daicer" modal that explains benefits (Offline, Fullscreen).

## Phase 5: Verification

- [ ] **Step 5.1**: Build & Serve.
  ```bash
  npm run build
  npm run preview
  ```
- [ ] **Step 5.2**: Chrome Audit.
  - Open DevTools > Application > Manifest (Check for warnings).
  - Open DevTools > Lighthouse > Run Navigation Audit (Mobile).
- [ ] **Step 5.3**: Real Device Test.
  - Connect mobile device via USB debugging.
  - "Add to Home Screen".
  - Check Splash Screen appearance.
