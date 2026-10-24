# Pharmatory Testing Specification: High-ROI Deterministic Test Suite

## 1. Overview and Testing Philosophy

This specification outlines the testing architecture, standards, and verification matrices for the **Pharmatory Medical Distribution Warehouse Selection & Order Fulfillment Engine**.

### 1.1 Core Principles (Pragmatic High-ROI Testing)

Following architectural debates on testing surface area, this project intentionally rejects artificial test bloat, over-mocked tests, and third-party test framework overhead (such as Jest or Mocha). Instead, it adheres to:

1. **Zero External Test Dependencies**: Leverages the native Node.js test runner (`node:test` and `node:assert/strict`) executed via `tsx --test`.
2. **Sub-Second Execution Speed**: The entire test suite completes in under 1.5 seconds, ensuring instantaneous feedback during development and CI pipelines.
3. **High-ROI Boundary Coverage**: Rather than writing hundreds of trivial unit tests for simple getters, tests are concentrated on **high-risk algorithmic decision boundaries** and **HTTP contract conformance**.
4. **Networkless Integration Testing**: Uses Fastify's native `app.inject()` to test the real HTTP server lifecycle (routing, middleware, AJV schema compilation, error serialization) without binding to TCP network ports.

---

## 2. Test Architecture and Taxonomy

The test suite is structured into two complementary layers:

```text
tests/
├── unit/
│   └── fulfillment.test.ts      # Pure domain logic & algorithmic solver tests
└── integration/
    └── api.test.ts              # Fastify inject() HTTP contract & ByJSON v2.0 tests
```

### 2.1 Layer Separation

| Dimension        | Unit Testing (`tests/unit/`)             | Integration Testing (`tests/integration/`)            |
| :--------------- | :--------------------------------------- | :---------------------------------------------------- |
| **Target**       | `FulfillmentEngine` domain class         | Fastify `buildApp()` HTTP application                 |
| **Dependencies** | Isolated; deterministic fixture data     | In-memory SQLite (`better-sqlite3`), plugins, schemas |
| **I/O**          | Zero I/O; pure algorithmic calculations  | In-process HTTP injection via `app.inject()`          |
| **Focus**        | Constraint satisfaction, scoring, splits | Route dispatch, schema validation, ByJSON envelopes   |

---

## 3. Unit Test Specification (`tests/unit/fulfillment.test.ts`)

### 3.1 Test Cases and Invariants

#### Case U1: Single Warehouse Proximity Selection

- **Scenario**: An order requesting ambient medical supplies (`P001` Surgical Gloves: 20 units, `P003` Disposable Syringes: 50 units).
- **Invariant**: When multiple warehouses have sufficient stock, the facility with the shortest distance and lowest traffic penalty (`W01 Surabaya Central Depot`, 5 km) must be selected.
- **Expected Outcome**:
  - `strategy === 'single_warehouse'`
  - Single shipment from `W01` containing both items.
  - Duration evaluated with standard or time-based multiplier.

#### Case U2: Cold-Chain Fleet Disqualification & Strict Routing

- **Scenario**: An order requesting temperature-sensitive biologicals (`P002` Hepatitis B Vaccine: 10 units).
- **Invariant**: Warehouses possessing refrigerated storage units but lacking refrigerated delivery vehicles (`W02 Surabaya Cold Logistics`, `W06 Malang Cold Facility`) **MUST BE DISQUALIFIED**.
- **Expected Outcome**:
  - `W02` (distance 12 km, standard fleet) is rejected.
  - `W04 Gresik Cold Chain Express` (distance 30 km, refrigerated vans) is selected as the closest fully qualified cold-chain facility.
  - Explanation explicitly details why `W02` was disqualified.

#### Case U3: Deterministic Order Splitting

- **Scenario**: An order requesting both cold-chain vaccines (`P002`: 10 units) and high-volume ambient consumables (`P001`: 150 units).
- **Invariant**: When no single qualified facility can fulfill the entire order (e.g. W01 lacks refrigerated fleet, W04 lacks sufficient P001 stock), the engine splits the order deterministically across the minimum number of warehouses.
- **Expected Outcome**:
  - `strategy === 'split_order'`
  - Shipment 1 dispatched from cold-chain qualified facility (`W04` or `W07`).
  - Shipment 2 dispatched from closest ambient facility with adequate inventory (`W01`).
  - Minimum number of distinct shipments.

#### Case U4: Dynamic Peak Traffic Heuristics

- **Scenario**: Delivery from `W01` or `W04` evaluated at different times of day (e.g., Friday 17:00 evening rush vs Monday 14:00 off-peak).
- **Invariant**: The engine must dynamically adjust duration and arrival estimates based on empirical traffic congestion factors derived from historical delivery data.
- **Expected Outcome**:
  - Duration during peak window is strictly greater than duration during off-peak window.
  - Traffic multiplier reflects empirical congestion records.

#### Case U5: Domain Validation & Boundary Invariants

- **Scenario A**: Payload with empty `items: []`.
  - **Expected Outcome**: Throws `ValidationError` with field `items` and message `Order items array must not be empty`.
- **Scenario B**: Non-positive quantities (`quantity: 0` or negative).
  - **Expected Outcome**: Throws `ValidationError` with field `items.X.quantity`.
- **Scenario C**: Unknown product identifier (`P999`).
  - **Expected Outcome**: Throws `ValidationError` with field `items.X.productId` indicating unknown item.

---

## 4. API Integration Test Specification (`tests/integration/api.test.ts`)

### 4.1 System & Catalog Endpoints

#### Case I1: System Health Check (`GET /api/health`)

- **Assertion**: HTTP status `200 OK`.
- **Envelope Conformance**:
  - `success === true`
  - `data.status === 'healthy'`
  - `meta.requestId` is a valid UUID v4.
  - `meta.timestamp` is a valid ISO-8601 string.

#### Case I2: Product Catalog Retrieval (`GET /api/v1/products`)

- **Assertion**: HTTP status `200 OK`.
- **Validation**:
  - Returns an array of 5 medical products.
  - Verifies presence of cold-chain indicators (`coldChainRequired: boolean`).

#### Case I3: Product Filtering via Query Parameters

- **Assertion**:
  - `GET /api/v1/products?coldChain=true`: Returns exactly 2 products (`P002`, `P004`).
  - `GET /api/v1/products?cold_chain=true`: Validates snake_case alias returns the same 2 products.
  - `GET /api/v1/products?coldChainRequired=true`: Validates legacy backwards-compatible alias.

#### Case I4: Warehouse Directory & Inventory (`GET /api/v1/warehouses`)

- **Assertion**: HTTP status `200 OK`.
- **Validation**:
  - Returns all 8 regional warehouses across East Java.
  - Verifies `fleetType` and `fullColdChainCapable` attributes for each facility.

#### Case I5: Warehouse Query Parameter Filtering

- **Assertion**:
  - `GET /api/v1/warehouses?city=Gresik&coldChain=true`: Returns exactly `W04`.
  - `GET /api/v1/warehouses?location=Surabaya`: Returns exactly 2 warehouses (`W01`, `W02`).

---

### 4.2 Order Fulfillment Endpoints

#### Case I6: Order Fulfillment Success (`POST /api/v1/orders/fulfill`)

- **Payload**: Valid items and customer destination (`Surabaya`).
- **Assertion**: HTTP status `200 OK`.
- **Validation**:
  - Conforms to ByJSON v2.0 envelope.
  - Returns `strategy`, `shipments`, and human-readable `explanation`.
  - Injects request ID into meta response.

#### Case I7: Resource-Oriented Alias (`POST /api/v1/fulfillments`)

- **Assertion**: HTTP status `200 OK`.
- **Validation**: Verifies ByJSON Section 3.1 resource-oriented alias returns identical fulfillment plan.

#### Case I8: AJV Schema Validation Failure (`POST /api/v1/orders/fulfill`)

- **Payload**: Invalid payload (e.g. `items[0].quantity = 0`).
- **Assertion**: HTTP status `422 Unprocessable Content`.
- **Envelope Conformance**:
  - `success === false`
  - `data === null`
  - `error.code === 'validation_error'`
  - `error.details[0].code === 'minimum'` (native AJV validator keyword without artificial mapping).
  - `error.details[0].field === 'items.0.quantity'`.

---

### 4.3 Traffic & In-Memory CSV Processing Endpoints

#### Case I9: In-Memory CSV File Upload (`POST /api/v1/traffic/upload`)

- **Payload**: Multipart form-data containing raw CSV text buffer without disk persistence.
- **Assertion**: HTTP status `200 OK`.
- **Validation**:
  - Parsed records recalibrate duration models in memory.
  - Database and disk remain completely untouched.

#### Case I10: Unsupported File Type Upload (`POST /api/v1/traffic/upload`)

- **Payload**: Non-CSV file (e.g. `.txt` or `.json`).
- **Assertion**: HTTP status `422 Unprocessable Content`.
- **Validation**: Returns `unsupported_file_type` error detail.

---

### 4.4 Documentation & Routing Endpoints

#### Case I11: Documentation Redirect (`GET /docs`)

- **Assertion**: HTTP status `302 Found` redirecting to `/docs/v1`.

#### Case I12: 404 Route Not Found (`GET /api/v1/non-existent-route`)

- **Assertion**: HTTP status `404 Not Found`.
- **Envelope Conformance**: ByJSON v2.0 error envelope with `error.code === 'not_found'`.

---

## 5. Verification Commands

To execute the test suite conforming to this specification:

```bash
# Run the complete test suite
npm test

# Run only unit tests
npx tsx --test tests/unit/fulfillment.test.ts

# Run only integration tests
npx tsx --test tests/integration/api.test.ts
```
