# ClubPulse — Free Hosting Setup (Hinglish)

This project is configured for a $0/month hobby/demo setup:
- Frontend + API: Render free web service. It can sleep after 15 minutes without traffic and take around a minute to wake.
- PostgreSQL: Neon Free. The free plan has usage caps and the database compute sleeps when idle; do not treat it as production-grade or as a lifetime guarantee. It does not have Render Free Postgres's fixed 30-day expiry timer in the cited plan documentation.
- No paid resources are required for the intended demo configuration.

## 1. Create a Neon free database
1. Open https://console.neon.tech/ and sign in or create a free account.
2. Create a project named `clubpulse-db` (PostgreSQL, choose a nearby region).
3. Open **Connect** and copy the connection string for the database and role. Treat it like a password; never paste it into GitHub or chat.

## 2. Add it to Render
1. Open https://dashboard.render.com/web/srv-dbbqanu1egvs73aukd50
2. Open **Environment** → **Add Environment Variable**.
3. Set key `DATABASE_URL` and value to the Neon connection string. Save and deploy.
4. Open https://clubpulse-live.onrender.com/api/health. It should return `"database":"connected"`.
5. If the API returns a network/SSL error, check the Neon connection string includes its required SSL mode (Neon connection strings normally include `sslmode=require`).

## 3. Free-plan caveats
- Neon Free has monthly compute/network/storage limits; if limits are reached, compute can be suspended until reset/upgrade. Its compute sleeps after 5 minutes idle, then wakes on a new query.
- Render Free web services sleep after 15 minutes without traffic and may take about a minute to wake.
- Free services can change their limits or terms. Keep a database backup/export of any useful demo data. Never enter real student personal data in this public shared demonstration app.
- Authentication and fine-grained role authorization are not complete yet. Use synthetic data only until this has been implemented and reviewed.

## 4. Local development
Copy `.env.example` to `.env.local`, put your own Neon connection string in `DATABASE_URL`, then run:
```bash
npm install
npm run build
npm start
```
