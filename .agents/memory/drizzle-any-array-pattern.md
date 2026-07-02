---
name: Drizzle raw SQL ANY(ARRAY) pattern is broken
description: Why sql`col = ANY(ARRAY[${sql.join(...)}])` fails with "operator does not exist: integer = text", and the fix
---

## The bug

A hand-rolled raw-SQL pattern for "where column in this list of ids":

```ts
sql`${table.col} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`
```

fails at runtime with:

```
error: operator does not exist: integer = text
```

even though running the exact same interpolated SQL directly via psql succeeds. The failure only shows up through the driver's parameterized/prepared-statement path (Postgres can't infer the array element type for bound `$1, $2, ...` params without an explicit cast), so testing the literal SQL string in isolation doesn't reproduce it.

**Why:** node-postgres binds each interpolated value as its own parameter; without `::int[]` (or similar) Postgres defaults the array literal's inferred type to text, which can't be compared to an integer column.

## The fix

Never write this pattern by hand. Use drizzle's `inArray(table.col, ids)` helper instead — it already handles correct parameter typing. This project's api-server had ~6 routes (jobs.ts, reviews.ts, payments.ts) using the broken raw-SQL version; all were replaced with `inArray`.

**How to apply:** Whenever you see `sql\`... ANY(ARRAY[...])\`` anywhere in a new or existing route, replace it with `inArray()`. Grep for `ANY(ARRAY` across the codebase before shipping any raw-SQL query.
