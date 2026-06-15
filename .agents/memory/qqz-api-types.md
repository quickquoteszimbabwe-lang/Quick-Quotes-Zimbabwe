---
name: QQZ API Types
description: Correct field names for QQZ orval-generated API client mutations
---

## Quote Submission
`CreateQuoteRequest = { jobId, price, timeline, message? }` — uses `price` (not `amount`) and `message` (not `note`). Timeline is required.

**How to apply:** When calling `useCreateQuote`, pass `{ data: { jobId, price, timeline, message } }`.

## Quote Selection
`useSelectQuote` takes `{ id: number; data: SelectQuoteRequest }` where `id` is the **job ID** and `SelectQuoteRequest = { quoteId: number }`.

**How to apply:** `selectQuote({ id: jobId, data: { quoteId: q.id } })`.

## Job Creation
`CreateJobRequest = { category, service, description, location, timeline? }` — `description` and `location` are required. No `budget` field exists.

## Review Creation
`CreateReviewRequest = { jobId, professionalId, rating, comment? }` — `professionalId` is required (not optional).

**Why:** All types are orval-generated from the OpenAPI spec. The field names in requests differ from what you might assume (e.g., `price` not `amount`).
