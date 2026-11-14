# Database migrations

## Current state

The application still initializes and upgrades its schema inside `lib/db.ts` through `ensureDatabase()`. Do not switch the application to a migration-only startup path until the existing schema has been captured from a dedicated development database and compared with this repository.

## Baseline migration policy

The first migration must represent the schema that exists in the target database at the moment this system is introduced. It must not attempt to recreate that schema by guessing from application code. The current initializer contains both DDL and data-changing work (including a one-time synthetic-demo cleanup transaction and a club-owner backfill). Those data operations must not be copied into a schema baseline.

Before writing `0001_baseline.sql`:

1. Provision a disposable PostgreSQL database matching the production PostgreSQL major version.
2. Restore a sanitized schema-only dump from a current database snapshot, or capture the exact schema from an approved non-production clone.
3. Compare tables, columns, constraints, indexes, triggers, extensions and sequences against the current initializer.
4. Record the schema as a baseline without replaying DDL against an already-existing database.
5. Test both an existing-database adoption path and a fresh-database path.
6. Keep the current `ensureDatabase()` behavior until both paths pass and the migration switch is reviewed.

No production connection string, schema dump or disposable PostgreSQL instance is available in this workspace. Therefore a truthful baseline migration cannot yet be generated or tested. No migration runner is enabled and no application startup behavior has been changed.

## Backup

Run `npm run backup:db` with PostgreSQL client tools (`pg_dump`) installed and `DATABASE_URL` set in a private local environment. Local databases are allowed by default. For a remote database, set `ALLOW_REMOTE_BACKUP=true` explicitly after confirming the target. The script writes a custom-format dump under `backups/` (or `BACKUP_DIR`) and never prints the database password.

Keep backup files out of Git and verify restore into a disposable database before any real migration. A successful dump alone is not proof that a restore works.
