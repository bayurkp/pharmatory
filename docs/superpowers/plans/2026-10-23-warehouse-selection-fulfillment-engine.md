# Medical Distribution Warehouse Selection & Order Fulfillment Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic warehouse selection and order fulfillment engine for a medical and pharmaceutical distribution platform that optimizes warehouse selection based on inventory, strict cold chain compliance, delivery distance, and historical congestion patterns, returning decisions framed in the ByJSON v2.0 standard.

**Architecture:** A Fastify v5 LTS and TypeScript backend backed by SQLite (`better-sqlite3`) using the Repository pattern for product catalog and warehouse inventory persistence. Order fulfillment requests pass through a domain engine that validates inventory, enforces cold chain constraints (vaccines require refrigerated storage and refrigerated delivery vans), optimizes single vs. multi-warehouse split allocations, incorporates traffic congestion duration factors from streaming CSV ingestion, and outputs transparent human-readable explanations. An embedded Alpine.js and DaisyUI dashboard provides an interactive fulfillment simulator and traffic pattern explorer.

**Tech Stack:** Node.js 22 LTS, TypeScript, Fastify v5, `@fastify/static`, `@fastify/swagger`, `@scalar/fastify-api-reference`, `better-sqlite3`, Tailwind CSS v4, DaisyUI v5, Alpine.js v3, ByJSON v2.0 specification.

**Spec:** `docs/superpowers/specs/warehouse-selection-spec.md`

## Global Constraints

- No emojis or emoticons in code, comments, documentation, or commit messages.
- No company names, recruiter names, or third-party brief citations anywhere in the codebase or documentation.
- All API responses must strictly conform to ByJSON v2.0 envelope: `{ success, data, error, meta }`.
- Cold chain integrity is mandatory: vaccines (P002 Hepatitis B, P004 Tetanus Toxoid) require both refrigerated storage units AND refrigerated delivery fleet. Standard fleet is disqualified for vaccine delivery.
- Interactive documentation must be served via Scalar at `/docs/v1` with a convenience redirect from `/docs`. Raw OpenAPI 3.1 JSON must be available at `/docs/v1/openapi.json` and `/api/v1/openapi`.
- `README.private.md` must remain untracked and excluded in `.gitignore`.

---

### Task 1: Spec Documentation and Database Schema Setup

**Files:**
- Create: `docs/superpowers/specs/warehouse-selection-spec.md`
- Create: `src/db/database.ts`
- Create: `src/db/schema.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `getDb(): Database` exporting initialized SQLite connection with migrated tables (`products`, `warehouses`, `warehouse_stock`).

- [ ] **Step 1: Write the specification document**
Write `docs/superpowers/specs/warehouse-selection-spec.md` detailing domain entities, warehouse capabilities, cold-chain rules, and distance data without any organization or candidate names.

- [ ] **Step 2: Install SQLite dependencies**
Run `npm i better-sqlite3 && npm i -D @types/better-sqlite3`.

- [ ] **Step 3: Define schema and seed data in `src/db/schema.ts`**
Define SQL DDL for:
- `products`: `id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, requires_cold_chain INTEGER NOT NULL`
- `warehouses`: `id TEXT PRIMARY KEY, location TEXT NOT NULL, distance_km REAL NOT NULL, storage_type TEXT NOT NULL, fleet_type TEXT NOT NULL, has_refrigerated_storage INTEGER NOT NULL, has_refrigerated_fleet INTEGER NOT NULL`
- `warehouse_stock`: `warehouse_id TEXT, product_id TEXT, stock INTEGER NOT NULL, PRIMARY KEY(warehouse_id, product_id)`
Seed with all 5 products (P001–P005) and 8 warehouses (W01–W08) as specified.

- [ ] **Step 4: Implement database bootstrap in `src/db/database.ts`**
Create and export `getDb()` utilizing file-backed `data/pharmatory.db` (ensuring parent directory exists), executing DDL migrations, and seeding initial records if tables are empty.

- [ ] **Step 5: Verify database initialization via test script**
Create temporary test in `test/db.test.ts` verifying all 5 products and 8 warehouses are loaded with accurate stock levels.

- [ ] **Step 6: Commit changes**
`git add docs/ src/db/ package.json package-lock.json && git commit -m "feat: add domain specification and sqlite database persistence"`

---

### Task 2: Repositories Layer (Product and Warehouse Repositories)

**Files:**
- Create: `src/repositories/product.repository.ts`
- Create: `src/repositories/warehouse.repository.ts`
- Create: `src/types/domain.ts`

**Interfaces:**
- Consumes: `getDb()` from `src/db/database.ts`
- Produces:
  - `ProductRepository.findAll(): Product[]`
  - `ProductRepository.findById(id: string): Product | null`
  - `WarehouseRepository.findAllWithStock(): WarehouseWithStock[]`
  - `WarehouseRepository.findStock(warehouseId: string, productId: string): number`

- [ ] **Step 1: Define TypeScript domain models in `src/types/domain.ts`**
Define interfaces: `Product`, `Warehouse`, `WarehouseStock`, `WarehouseWithStock`, `OrderItem`, `FulfillmentDecision`.

- [ ] **Step 2: Implement `ProductRepository`**
Implement methods to query products, checking cold-chain requirement flags.

- [ ] **Step 3: Implement `WarehouseRepository`**
Implement methods to query warehouses, including location, distance, storage type, fleet type, and current stock for each product.

- [ ] **Step 4: Verify repository operations**
Write automated verification asserting stock retrieval for W01 (P001: 200, P003: 500, P005: 300) and cold chain status for W04 (has_refrigerated_storage: 1, has_refrigerated_fleet: 1).

- [ ] **Step 5: Commit changes**
`git add src/repositories/ src/types/ && git commit -m "feat: implement product and warehouse repositories"`

---

### Task 3: Historical Delivery Traffic Ingestion Service (Bonus Scope)

**Files:**
- Create: `data/delivery_historical_data.csv`
- Create: `src/services/traffic.service.ts`
- Test: `test/traffic.test.ts`

**Interfaces:**
- Consumes: `data/delivery_historical_data.csv`
- Produces:
  - `TrafficService.initialize(): Promise<void>`
  - `TrafficService.getEstimatedDuration(warehouseId: string, orderTime?: string | Date): { durationMinutes: number, isPeakHour: boolean, reason?: string }`
  - `TrafficService.getTrafficPatterns(): TrafficPatternSummary[]`

- [ ] **Step 1: Place CSV data into repository data directory**
Copy historical delivery records into `data/delivery_historical_data.csv` without external source references.

- [ ] **Step 2: Implement streaming CSV ingestion in `src/services/traffic.service.ts`**
Use Node.js `fs.createReadStream` and `readline` to parse the 38 delivery records asynchronously on server startup.

- [ ] **Step 3: Build congestion index and duration lookup**
Index delivery duration by warehouse and time slot:
- Compute baseline duration (off-peak average).
- Identify peak congestion periods:
  - Surabaya morning peak (Mon-Wed 07:30–08:30)
  - Surabaya/Gresik Friday evening peak (Fri 16:30–17:30)
  - Malang weekend getaway / return peak (Fri 14:00–18:00, Sat 08:00–12:00, Sun 15:00–19:00)
- Expose method `getEstimatedDuration(warehouseId, orderTime)` resolving duration and congestion annotations.

- [ ] **Step 4: Verify traffic service calculations**
Test that W01 at Monday 08:00 yields ~50 mins with peak congestion flag, while W01 at Monday 14:00 yields ~15 mins baseline.

- [ ] **Step 5: Commit changes**
`git add data/ src/services/traffic.service.ts test/ && git commit -m "feat: implement streaming historical delivery traffic service"`

---

### Task 4: Core Warehouse Selection and Fulfillment Engine

**Files:**
- Create: `src/services/fulfillment.service.ts`
- Test: `test/fulfillment.test.ts`

**Interfaces:**
- Consumes: `ProductRepository`, `WarehouseRepository`, `TrafficService`
- Produces:
  - `FulfillmentService.fulfillOrder(items: OrderItem[], orderTime?: string): FulfillmentResult`

- [ ] **Step 1: Implement input segregation and constraint verification**
Verify all product IDs exist and quantities are positive integers. Identify if any item requires cold chain storage and transport.

- [ ] **Step 2: Implement single warehouse evaluation logic**
Check if any qualified warehouse can satisfy 100% of all requested quantities:
- For standard-only orders: all warehouses with sufficient inventory qualify.
- For cold chain orders: only warehouses with both refrigerated storage and refrigerated fleet qualify.
Rank eligible single warehouses by composite score: distance (km) and traffic-adjusted duration (minutes).

- [ ] **Step 3: Implement multi-warehouse split order optimizer**
When no single facility can cover the entire order:
- Separate cold chain items from ambient/standard items.
- Assign cold chain items to the closest fully qualified cold chain facility with stock.
- Assign standard items to the closest facility with stock.
- Minimize the number of warehouse dispatches while favoring closest facilities.

- [ ] **Step 4: Implement transparent explanation generator**
Generate clear, deterministic textual explanations for the dispatch decision:
- Why specific warehouses were selected or disqualified (distance, stock exhaustion, cold chain fleet limitations).
- If an order was split, explicitly detail the item-to-warehouse breakdown.
- If traffic congestion was detected at the order time, describe the duration impact.

- [ ] **Step 5: Automated test suite for fulfillment scenarios**
Verify:
- Standard order fulfilled by closest warehouse W01 (5 km).
- Vaccine-only order routed to W04 (Gresik, 30 km, refrigerated fleet) despite W02 being closer (12 km, standard fleet).
- High-volume order split across facilities due to stock limits.
- Clear explanation strings generated for all scenarios.

- [ ] **Step 6: Commit changes**
`git add src/services/fulfillment.service.ts test/ && git commit -m "feat: implement core warehouse selection and split fulfillment engine"`

---

### Task 5: RESTful API Integration and ByJSON v2.0 Schemas

**Files:**
- Modify: `src/server.ts`
- Modify: `src/utils/by-json.ts`

**Interfaces:**
- Exposes:
  - `POST /api/v1/orders/fulfill`
  - `GET /api/v1/products`
  - `GET /api/v1/warehouses`
  - `GET /api/v1/traffic/patterns`
  - `GET /docs/v1` (Scalar UI)
  - `GET /docs/v1/openapi.json` (OpenAPI 3.1 Spec)
  - `GET /api/v1/openapi` (Raw JSON Spec Alias)
  - `GET /docs` (302 Redirect to `/docs/v1`)

- [ ] **Step 1: Register endpoints in `src/server.ts`**
Wire repositories and services to Fastify routes.
Wrap all responses in ByJSON v2.0 envelopes (`byJsonSuccess` / `byJsonError`).

- [ ] **Step 2: Define comprehensive OpenAPI 3.1 schemas**
Define request bodies and response schemas using `buildByJsonSuccessSchema` and `buildByJsonErrorSchema` for all endpoints.

- [ ] **Step 3: Verify HTTP responses and status codes**
Test `POST /api/v1/orders/fulfill` returns HTTP 200 with ByJSON structure on success, and HTTP 422 on invalid payloads.

- [ ] **Step 4: Commit changes**
`git add src/server.ts src/utils/by-json.ts && git commit -m "feat: wire fulfillment and traffic routes to fastify with byjson envelopes"`

---

### Task 6: Interactive Web Dashboard (Alpine.js + DaisyUI)

**Files:**
- Modify: `public/index.html`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Build Order Simulation Form in `public/index.html`**
Provide a multi-item order builder allowing users to choose products, input quantities, and select an optional order timestamp (to test rush hour vs off-peak routing).

- [ ] **Step 2: Build Fulfillment Decision Visualizer**
Display:
- Fulfillment plan summary (Single Warehouse vs Split Order badge).
- Selected warehouse(s), distance, estimated travel time, and cold chain compliance checkmark.
- Item breakdown table indicating which warehouse fulfills which item and quantity.
- Decision explanation box detailing the logic.

- [ ] **Step 3: Build Historical Traffic Explorer Section**
Display historical delivery performance, peak hour indicators, and route comparison.

- [ ] **Step 4: Recompile CSS bundle**
Run `npm run build:css` to ensure all DaisyUI and Tailwind CSS classes used in the new HTML components are compiled into `public/css/styles.css`.

- [ ] **Step 5: Commit changes**
`git add public/ src/styles/ && git commit -m "feat: enhance interactive dashboard with order simulator and decision visualizer"`

---

### Task 7: Documentation, Tech Stack Comparison & Final Verification

**Files:**
- Modify: `README.md`
- Modify: `README.private.md`
- Modify: `.gitignore`

- [ ] **Step 1: Update `README.md` in professional English**
Incorporate the objective Tech Stack Selection, Justification, and Comparison Matrix without any company or recruiter names. Detail architecture, ByJSON standards, installation instructions, and script references.

- [ ] **Step 2: Update `README.private.md`**
Record comprehensive Architectural Decision Records (ADRs), cold-chain engineering justifications, traffic heuristics analysis, and technical interview talking points.

- [ ] **Step 3: Verify `.gitignore` exclusions**
Verify `README.private.md` and database files remain untracked.

- [ ] **Step 4: Run full production build and end-to-end test**
Run `npm run build` and launch server to verify:
- `http://localhost:3000` (Dashboard)
- `http://localhost:3000/docs/v1` (Scalar Docs)
- `http://localhost:3000/docs/v1/openapi.json` (OpenAPI JSON)

- [ ] **Step 5: Final commit**
`git add .gitignore README.md && git commit -m "docs: finalize professional tech stack justification and architecture documentation"`
