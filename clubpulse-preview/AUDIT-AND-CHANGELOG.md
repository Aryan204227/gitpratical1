# ClubPulse audit and change log

## Changes in this branch

- Corrected task deadline validation with a shared strict ISO calendar-date validator.
- Added tests for valid dates, leap days, malformed input and impossible dates.
- Task status updates now lock/read the row and only record a completion event when transitioning into Completed; repeated saves cannot duplicate completion points.
- Task updates now follow the UI permission model: admins/leads may manage any task, while a member may update only the task assigned to their account name. Stable member IDs remain a follow-up data-model improvement.
- Dashboard API errors will be logged server-side and return a safe message to the browser.
- The public health endpoint reports a boolean for whether server-side Google Client ID configuration is present. It does not reveal any key.
- Landing page visual direction adds a CSS-built animated 3D campus/universe scene, neon-lime/cyan/purple accents, richer glass panels and reduced-motion-aware ambient animations.

## Known remaining work

- Google OAuth still needs valid Google Cloud configuration and the correct production JavaScript origin. A configured Client ID is not proof that login succeeds; the real browser-to-server flow must be tested.
- The active database provider and saved-data persistence must be verified through the health endpoint and create/reload tests. Do not overwrite DATABASE_URL without verifying its current target.
- Stable member IDs, multi-club membership isolation, workspace-level data boundaries and additional browser end-to-end tests remain important before real-campus use.
- In-app notifications, password-reset email delivery and a fully persisted draggable Kanban UI need additional implementation and any required provider configuration.