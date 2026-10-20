# ClubPulse tests

Run unit tests with `npm test` from `clubpulse-preview`.

The tests cover the real utility functions used in the product for completion-rate calculations, privacy-aware feedback averages, contribution event points, and application opening state. These are unit tests, not a claim of full end-to-end coverage.

Production validation also includes the React/Vite TypeScript build and Next.js production build through the Render build pipeline. Database checks require a configured Neon `DATABASE_URL`; a missing URL should make `/api/health` return a disconnected response instead of pretending the app is connected.
