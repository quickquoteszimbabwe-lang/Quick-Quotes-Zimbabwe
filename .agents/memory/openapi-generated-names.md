---
name: OpenAPI generated names
description: Operation-specific generated Zod names and build ordering for QQZ API changes
---

OpenAPI code generation names request schemas from the operation and path, so admin news mutations use names such as `AdminCreateNewsBody` rather than the generic schema title.

**Why:** The API server imports generated Zod constants directly, and a successful codegen run does not refresh dependent declaration output until the shared libraries are rebuilt.

**How to apply:** After editing `lib/api-spec/openapi.yaml`, run API codegen, rebuild/typecheck shared libraries, then typecheck/build the API server before restarting its workflow.