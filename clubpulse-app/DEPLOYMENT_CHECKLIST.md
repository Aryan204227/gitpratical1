# ClubPulse Production Deployment Checklist

## Required before the app can be considered live

- [ ] Use Node.js 22 or newer, then install dependencies with `npm install` (this refreshes `package-lock.json` for the new dependencies).
- [ ] Create a production MongoDB database and user.
- [ ] Set `MONGODB_URI` to the production database URI.
- [ ] Enable Firebase Email/Password and Google providers.
- [ ] Set all six `NEXT_PUBLIC_FIREBASE_*` Web App variables.
- [ ] Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete server-only service-account JSON.
- [ ] Add local and production hostnames to Firebase Authorized Domains.
- [ ] Provision the initial administrator account and role through a trusted server/database operation; never allow a browser-selected role.
- [ ] Verify `/api/auth/session` and `/api/auth/me` return the expected safe MongoDB user profile.
- [ ] Promote verified club-lead accounts to `leader` from the Admin Dashboard. Do not let users self-select this role.
- [ ] Configure MongoDB Atlas network access for the deployed service.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Verify registration, login, logout, and session persistence in the deployed environment.
- [ ] Verify club creation, recruitment application, approval, membership, task assignment, student task completion, contribution review, event RSVP, evidence verification, and FairWork analytics with real accounts.
- [ ] Confirm that an empty database shows empty states and no sample users/clubs/tasks.

## Current archive boundary

This source archive intentionally contains no `.env.local`, database URI, Firebase credentials, or deployed-hosting credentials. A successful local test run does not establish that external MongoDB/Firebase services are configured. Deployment must be performed only after the environment values above are supplied.
