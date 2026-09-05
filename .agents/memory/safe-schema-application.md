---
name: Safe schema application
description: Development database schema changes where existing rows must be preserved
---

When a Drizzle schema change adds a unique identity field or a new table to a populated development database, verify the live schema first and apply only missing, non-destructive DDL. Never approve a truncation prompt just to make `drizzle-kit push` complete.

**Why:** The development database contains real test history and existing accounts; a default interactive push can offer truncation when adding a uniqueness constraint.

**How to apply:** Inspect `information_schema`, use the database tooling for guarded `IF NOT EXISTS`/duplicate-safe DDL when needed, then verify row counts and nullability before restarting the API.