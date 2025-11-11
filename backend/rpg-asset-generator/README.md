<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1T9rkWLJ6Dyrp7OCwjdz9bbmmeLKfq7mM

## Run Locally

**Prerequisites:** Node.js 20+, Firebase CLI (for emulators)

### Frontend

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Backend API

The backend lives in `server/` and exposes REST endpoints that wrap Google Gemini for RPG asset generation and store outputs in Firebase Storage (emulator-first).

1. Duplicate `.env.local` in the project root and ensure it includes:

   ```
   GEMINI_API_KEY=your-key
   FIREBASE_PROJECT_ID=daicer-dev
   STORAGE_BUCKET=daicer-dev.appspot.com
   STORAGE_EMULATOR_HOST=http://127.0.0.1:9199
   SERVER_PORT=5050
   ```

2. Start the Firebase storage emulator (from repo root):

   ```
   firebase emulators:start --only storage
   ```

3. In another terminal, run the API in watch mode:

   ```
   npm run server:dev
   ```

4. Available endpoints:
   - `POST /api/assets/avatar` → returns portrait, upper-body, and full-body variants.
   - `POST /api/assets/grid-background`
   - `POST /api/assets/action-frame`

   Each request accepts optional reference images (base64) and narrative context, storing generated assets under the configured bucket within the emulator.

5. Run backend tests:

   ```
   npm run server:test
   ```
