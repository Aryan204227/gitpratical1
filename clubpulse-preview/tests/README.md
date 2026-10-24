# ClubPulse tests

Run unit tests with `npm test` from `clubpulse-preview`.

The tests cover the real utility functions used in the product for completion-rate calculations, privacy-aware feedback averages, contribution event points, application opening state, strict calendar dates, and positive club-ID parsing. These are unit tests, not a claim of full end-to-end coverage.

## Verify task clubId persistence locally

1. Make sure your local database has at least one real club and an existing admin/lead account.
2. Add the following *local-only* values to `.env.local` (never commit them or send credentials in chat):

   ```dotenv
   CLUBPULSE_TEST_EMAIL=your-admin-or-lead-email
   CLUBPULSE_TEST_PASSWORD=your-local-test-password
   # Optional: test a specific existing club ID. If omitted, an active club is selected.
   CLUBPULSE_TEST_CLUB_ID=1
   ```

3. Run `npm run verify:task-flow`. The script uses the local Next.js server on port 3000 if it is already running, otherwise it starts it. It checks login, creates a temporary task with the selected club ID, re-reads that exact task through `GET /api/tasks/:id`, verifies the saved ID and club name, then checks that missing and non-existent club IDs are rejected with HTTP 400.
4. The script removes the temporary task and its assignment event after the test. If cleanup itself fails, it prints a warning.

The verification script deliberately refuses non-local URLs so it cannot accidentally create a test task in production. It does not use `ts-node` or import a TypeScript route directly.

Production validation still requires the React/Vite TypeScript build and Next.js production build through the Render build pipeline. Database checks require a configured Neon `DATABASE_URL`; a missing URL should make `/api/health` return a disconnected response instead of pretending the app is connected.
