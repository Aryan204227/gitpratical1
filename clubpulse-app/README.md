# ClubPulse — Club Contribution & Fair Workload Platform

**Project P18 / INT252–INT257**  
**Problem:** Ghost Members and Burnout Leads: Club Contribution Management.

ClubPulse helps campus clubs manage recruitment, membership, tasks, contribution evidence, member inactivity, workload concentration, and transparent activity verification. Production dashboards read from MongoDB-backed APIs. There is no demo-persona login or automatic sample-data injection.
Static HTML/PNG design references are archived under `docs/mockups/` and are not imported by the application.

## Implemented modules

- **Club and recruitment:** club directory, club profiles, applications, application review, membership records.
- **Task and contribution management:** task assignment, student task updates, contribution submissions, review states, notifications.
- **FairWork analytics:** explainable inactivity classification, approved-break protection, workload concentration and burnout risk, delegation recommendations.
- **Transparency and audit:** evidence submission, administrator verification/dispute, club trust-score recalculation, feedback and audit records.
- **Authentication:** Firebase Authentication for email/password and Google sign-in, Firebase Admin token verification (requiring a fresh sign-in within five minutes), and five-day HttpOnly Firebase session cookies. MongoDB stores application profiles and roles; it never verifies passwords.

## Requirements

- Node.js 22 or newer (required by the Firebase Admin SDK version in this project)
- npm
- MongoDB Atlas or a local MongoDB instance
- Firebase project with Email/Password and Google providers enabled

## Local setup

1. Install packages:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Set the required values in `.env.local`:

   - `MONGODB_URI`: connection string for the ClubPulse database.
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase Web App configuration.
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete Firebase service-account JSON for server-side token verification and session-cookie creation. Keep it server-only; never use a `NEXT_PUBLIC_` prefix.

4. In Firebase Console, enable **Email/Password** and **Google** sign-in providers and add your local/deployed hostnames to Firebase Authentication's authorised domains. See the Firebase setup section below for the service-account format.
5. Start the app:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Production deployment

Configure the same environment variables in the hosting provider before deploying. Use a production MongoDB Atlas URI, the correct Firebase Web App settings, and the Firebase service-account JSON. Add the deployed hostname to Firebase's authorized domains. Ensure the MongoDB Atlas network access rules allow the deployed service to connect.

Do not commit `.env.local`, database credentials, or Firebase private service-account keys.

## Roles

- **Student:** browse clubs, apply, view their own memberships/tasks/contributions, update their task status, request a break, submit contributions and feedback.
- **Leader:** review club applications, manage members and tasks, delegate work, view club analytics and feedback.
- **Administrator:** manage club-level operations and verify/dispute submitted evidence.

New Firebase accounts are assigned the `student` role by the server. The browser cannot choose its role. Role changes must be performed through trusted administrative workflows and are read from MongoDB on each protected API request.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

`npm test` runs Vitest route and integration tests against `mongodb-memory-server`; only the Firebase Admin token/session boundary is mocked. The suite never connects to MongoDB Atlas or a real Firebase account. A passing test suite does not prove that your external Firebase project or Atlas credentials are configured.

## Important configuration boundary

The source archive does not contain your MongoDB URI, Firebase Web App keys, or Firebase service-account JSON. These must be supplied in the local/deployment environment. Until they are configured, live login, persistence, and Google authentication cannot be verified end-to-end.

## Firebase Authentication Setup

ClubPulse uses the Firebase client SDK for email/password and Google sign-in. The server uses Firebase Admin to verify ID tokens and issue five-day HttpOnly session cookies. There is no MongoDB password-login fallback.

1. In Firebase Console, create/select your project and enable **Email/Password** and **Google** under Authentication providers.
2. Add the local and deployed application domains to Firebase Authentication's authorised domains.
3. Copy the Firebase Web App values into the six `NEXT_PUBLIC_FIREBASE_*` variables shown in `.env.example`.
4. Create a Firebase service-account key for the server. Store the entire JSON document in `FIREBASE_SERVICE_ACCOUNT_JSON` as one environment variable. Preserve the JSON fields and replace literal newlines in `private_key` with `\\n` when entering it as a single-line environment value. Never commit this value or expose it with a `NEXT_PUBLIC_` prefix.
5. Configure `MONGODB_URI` to a reachable MongoDB database.
6. Restart the Next.js server after changing environment variables.

The session endpoint rejects tokens with an `auth_time` older than five minutes, returns `401` for invalid/expired tokens, `403 EMAIL_NOT_VERIFIED` for unverified password accounts, and `503` if Firebase Admin or MongoDB is unavailable.

When the Firebase Web configuration is missing, login, registration, Google sign-in and password reset display `Firebase is not configured, see README setup.` and do not attempt a fallback login. The Firebase Admin session endpoint returns HTTP 503 when the server service-account configuration is missing or invalid.

The test suite uses `mongodb-memory-server` and mocks only Firebase Admin's token/session methods. It does not connect to Atlas or Firebase accounts. Use Node.js 22 or later for the Firebase Admin SDK version listed in `package.json`.
