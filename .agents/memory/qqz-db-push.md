---
name: QQZ DB Push
description: How to run drizzle-kit push for the QQZ database
---

## Command
`pnpm --filter @workspace/db run push`

The script in `lib/db/package.json` is named `push` (not `db:push`).

**Why:** Commonly confused with `db:push` which is the convention in some other projects, but QQZ uses plain `push`.
