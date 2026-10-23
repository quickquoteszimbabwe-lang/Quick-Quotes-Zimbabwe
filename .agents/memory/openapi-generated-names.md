---
name: OpenAPI generated names
description: Operation-specific generated Zod names and build ordering for QQZ API changes
---

OpenAPI code generation names request schemas from the operation and path, so admin news mutations use names such as `AdminCreateNewsBody` rather than the generic schema title. Component response names can also collide with operation-derived names: if a component named `RequestUploadUrlResponse` is referenced by an operation named `requestUploadUrl`, the Zod barrel can export the same name twice.

**Why:** The API server imports generated Zod constants directly, while the barrel also exports generated component types; matching operation and component names can break the shared-library typecheck even though Orval completes successfully.

**How to apply:** Use entity/domain names that do not duplicate Orval's operation-derived names. After editing `lib/api-spec/openapi.yaml`, run API codegen, rebuild/typecheck shared libraries, then typecheck/build the API server before restarting its workflow.