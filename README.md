# ClubPulse — working source branch

This branch contains the MongoDB/Mongoose ClubPulse application as normal, browsable source files.

## Which folder is the application?

Open **`clubpulse-app/`** in VS Code. That folder contains the Next.js 16 / React 19 application, Mongoose models, Firebase Authentication integration, API routes, and tests.

The separate `clubpulse-preview/` directory is an older PostgreSQL preview project retained from the repository history. It is not the MongoDB application described by the ClubPulse V2 master repair plan.

## Run the application

From PowerShell or a terminal:

```powershell
cd clubpulse-app
npm install
npm test
npm run lint
npm run build
npm run dev
```

Set the environment variables from `clubpulse-app/.env.example` in your local `.env.local`. Never commit real Firebase service-account JSON or MongoDB credentials.

## Phase status

Phase 1A source is staged on this branch. Test, lint and production-build results are recorded by the GitHub Actions workflow; real Firebase signup, verification mail, Google popup and Atlas access still require manual verification.

The original `clubpulse-completed-deploy` branch is retained as a rollback copy. This branch is the browsable working source.
