# Pharmatory Testing Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to execute and track implementation tasks. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Establish a deterministic, sub-second test suite verifying the Pharmatory fulfillment engine against all domain invariants, cold-chain regulations, ByJSON v2.0 envelope contracts, and in-memory CSV file processing.

**Architecture:** Native Node.js test runner (`node:test` + `node:assert/strict`) invoked via `tsx --test`. Separates pure domain unit tests (`tests/unit/fulfillment.test.ts`) from Fastify networkless HTTP integration tests (`tests/integration/api.test.ts`).

**Spec Reference:** `docs/superpowers/specs/testing-spec.md`

---

## Completed Tasks & Verification Matrix

### Task 1: Domain Engine Unit Test Suite

**Files:**

- Test: `tests/unit/fulfillment.test.ts`
- Engine: `src/modules/fulfillment/fulfillment.engine.ts`

**Verification Points:**

- [x] **Step 1: Single warehouse proximity selection**
  - Verify that when stock is abundant across warehouses, the engine selects the closest facility (`W01 Surabaya Central Depot`, 5 km).
- [x] **Step 2: Cold-chain fleet disqualification invariant**
  - Assert that `W02` (Surabaya, 12 km) is disqualified for vaccine delivery because it has standard vehicles only.
  - Assert that `W04` (Gresik, 30 km, refrigerated vans) is selected as the qualified cold-chain facility.
- [x] **Step 3: Multi-warehouse split optimization**
  - Verify deterministic order splitting when cold-chain fleet and ambient bulk inventory require disparate facilities.
  - Confirm minimal distinct warehouse dispatches.
- [x] **Step 4: Empirical congestion heuristics**
  - Assert that deliveries scheduled during peak traffic windows reflect increased duration and lower average speeds.
- [x] **Step 5: Input boundary validation**
  - Assert `ValidationError` is thrown for empty items, non-positive quantities, and invalid product IDs.

---

### Task 2: Fastify HTTP Lifecycle & ByJSON v2.0 Integration Tests

**Files:**

- Test: `tests/integration/api.test.ts`
- App: `src/app.ts`
- Plugins: `src/plugins/error-handler.plugin.ts`, `src/plugins/swagger.plugin.ts`

**Verification Points:**

- [x] **Step 1: System health check (`GET /api/health`)**
  - Verify HTTP 200 and standard 4-key ByJSON v2.0 envelope (`success`, `data`, `error`, `meta`).
  - Verify valid UUID v4 `requestId` generation.
- [x] **Step 2: Product catalog listing & filtering**
  - Assert `GET /api/v1/products` returns 5 products.
  - Assert `GET /api/v1/products?coldChain=true` returns only the 2 vaccines (`P002`, `P004`).
- [x] **Step 3: Regional warehouse directory & location filtering**
  - Assert `GET /api/v1/warehouses` returns all 8 warehouses.
  - Assert `GET /api/v1/warehouses?city=Gresik&coldChain=true` returns exactly `W04`.
- [x] **Step 4: Order fulfillment endpoint (`POST /api/v1/orders/fulfill`)**
  - Assert HTTP 200 with complete fulfillment plan, shipment allocation, and rationale.
- [x] **Step 5: Resource-oriented alias (`POST /api/v1/fulfillments`)**
  - Verify ByJSON Section 3.1 resource-oriented alias returns identical calculation results.

---

### Task 3: Error Handling & AJV Keyword Conformance Tests

**Files:**

- Plugin: `src/plugins/error-handler.plugin.ts`
- Test: `tests/integration/api.test.ts`

**Verification Points:**

- [x] **Step 1: AJV Schema validation failure (HTTP 422)**
  - Pass invalid payload (`quantity = 0`) to `POST /api/v1/orders/fulfill`.
  - Assert `statusCode === 422`.
  - Assert `error.code === 'validation_error'`.
  - Assert native keyword `minimum` is passed directly in `error.details[0].code`.
- [x] **Step 2: Route not found (HTTP 404)**
  - Request non-existent API route `GET /api/v1/non-existent-route`.
  - Assert `statusCode === 404` and `error.code === 'not_found'`.
- [x] **Step 3: Documentation route redirect**
  - Assert `GET /docs` issues HTTP 302 redirecting to `/docs/v1`.

---

### Task 4: In-Memory CSV Processing & Security Boundary Tests

**Files:**

- Service: `src/modules/traffic/traffic.service.ts`
- Routes: `src/modules/traffic/traffic.routes.ts`
- Test: `tests/integration/api.test.ts`

**Verification Points:**

- [x] **Step 1: In-memory multipart CSV upload**
  - Upload raw CSV data via multipart form-data.
  - Verify HTTP 200 and traffic model recalibration in memory.
  - Assert zero disk persistence (no temporary or uploaded files written to disk).
- [x] **Step 2: Unsupported file format rejection**
  - Upload non-CSV file (e.g. text/plain).
  - Assert HTTP 422 rejection with `unsupported_file_type` error detail.

---

### Task 5: Query Parameter Casing & Ergonomics Verification

**Files:**

- Controller: `src/modules/product/product.controller.ts`
- Controller: `src/modules/warehouse/warehouse.controller.ts`
- Test: `tests/integration/api.test.ts`

**Verification Points:**

- [x] **Step 1: Primary `camelCase` query parameter support**
  - Test `GET /api/v1/products?coldChain=true`.
  - Test `GET /api/v1/warehouses?coldChain=true`.
- [x] **Step 2: Graceful snake_case & legacy fallback**
  - Test `GET /api/v1/products?cold_chain=true`.
  - Test `GET /api/v1/products?coldChainRequired=true`.
  - Test `GET /api/v1/warehouses?location=Surabaya`.

---

## Performance Budget & Execution Verification

| Metric                            | Budget          | Measured                       | Status |
| :-------------------------------- | :-------------- | :----------------------------- | :----- |
| **Total Test Count**              | $\ge 20$        | 21                             | Pass   |
| **Execution Duration**            | $< 2.0\text{s}$ | $\sim 1.3\text{s}$             | Pass   |
| **External Test Dependencies**    | 0               | 0 (native `node:test`)         | Pass   |
| **Disk I/O During Tests**         | 0               | 0 (in-memory SQLite & streams) | Pass   |
| **TypeScript Compilation Errors** | 0               | 0 (`tsc` clean)                | Pass   |
