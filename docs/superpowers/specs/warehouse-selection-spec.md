# Medical Distribution Warehouse Selection & Order Fulfillment Specification

## 1. Domain Overview

A regional medical and pharmaceutical distribution platform manages a network of 8 warehouses across East Java to serve healthcare facilities (hospitals, clinics, and pharmacies). When an incoming customer order is placed, the fulfillment engine must select the optimal warehouse or combination of warehouses to fulfill the order and return a transparent, human-readable rationale.

All distances are measured relative to a single fixed customer location.

---

## 2. Catalog & Resource Specifications

### 2.1 Products Catalog

| Product ID | Name                                    | Category         | Cold Chain Required | Description                               |
| :--------- | :-------------------------------------- | :--------------- | :-----------------: | :---------------------------------------- |
| P001       | Surgical Gloves (Box of 100)            | Medical Supplies |         No          | Standard ambient medical supply           |
| P002       | Vaccine — Hepatitis B (10-dose vial)    | Pharmaceutical   |       **Yes**       | Temperature-sensitive vaccine (2°C - 8°C) |
| P003       | Disposable Syringe (Box of 50)          | Medical Supplies |         No          | Standard ambient medical supply           |
| P004       | Vaccine — Tetanus Toxoid (10-dose vial) | Pharmaceutical   |       **Yes**       | Temperature-sensitive vaccine (2°C - 8°C) |
| P005       | Paracetamol Tablets (Box of 100)        | Pharmaceutical   |         No          | Standard ambient oral medication          |

### 2.2 Warehouses Specification

| Warehouse ID | Location | Distance (km) | Storage Capability | Delivery Fleet        | Full Cold Chain Qualified | Initial Inventory               |
| :----------- | :------- | :-----------: | :----------------- | :-------------------- | :-----------------------: | :------------------------------ |
| W01          | Surabaya |       5       | General Storage    | Standard Vehicles     |            No             | P001: 200, P003: 500, P005: 300 |
| W02          | Surabaya |      12       | Refrigerated Unit  | Standard Vehicles     |   **No (Storage only)**   | P001: 50, P002: 30, P004: 20    |
| W03          | Sidoarjo |      25       | General Storage    | Standard Vehicles     |            No             | P001: 300, P003: 200            |
| W04          | Gresik   |      30       | Refrigerated Unit  | **Refrigerated Vans** |          **Yes**          | P002: 40, P004: 25, P005: 100   |
| W05          | Malang   |      90       | General Storage    | Standard Vehicles     |            No             | P001: 400, P003: 300, P005: 500 |
| W06          | Malang   |      95       | Refrigerated Unit  | Standard Vehicles     |   **No (Storage only)**   | P002: 20, P004: 30, P003: 100   |
| W07          | Pasuruan |      45       | Refrigerated Unit  | **Refrigerated Vans** |          **Yes**          | P001: 150, P002: 8, P004: 10    |
| W08          | Jember   |      150      | Refrigerated Unit  | **Refrigerated Vans** |          **Yes**          | P002: 60, P004: 50, P005: 200   |

---

## 3. Business Rules and Constraints

### 3.1 Cold Chain Integrity Rule

- Any order containing cold-chain items (`P002`, `P004`) requires **both** refrigerated warehouse storage and an active **refrigerated delivery fleet**.
- Warehouses W02 and W06 maintain refrigerated storage units but only operate standard non-refrigerated delivery vehicles. They **cannot** be selected to dispatch vaccines because transporting vaccines in standard vehicles without active cooling risks temperature excursions and spoiled biologicals.
- Consequently, only facilities with refrigerated vans (**W04, W07, W08**) are qualified for vaccine fulfillment.

### 3.2 Single Warehouse Fulfillment Priority

- Consolidating an order into a single warehouse delivery is prioritized whenever feasible to minimize transportation costs, administrative overhead, and duplicate deliveries for the receiving facility.
- A single warehouse qualifies only if:
  1. It possesses sufficient stock for all requested items.
  2. It satisfies cold chain requirements if any temperature-sensitive product is in the order.
- When multiple single warehouses qualify, the engine selects the facility with the lowest combined distance and congestion duration score.

### 3.3 Multi-Warehouse Split Strategy

- If no single facility can satisfy the entire order (due to stock deficits or cold-chain vehicle incompatibility), the order is split deterministically:
  1. **Cold Chain Items**: Assigned to the closest fully qualified cold chain facility (W04, W07, W08) holding sufficient stock.
  2. **Ambient / Standard Items**: Assigned to the closest facility with sufficient inventory.
  3. The engine minimizes total distinct warehouse dispatches.

### 3.4 Historical Traffic Analysis (Congestion Heuristic)

- Utilizing empirical delivery duration records, the engine calculates estimated travel durations based on the scheduled or actual order time:
  - **Surabaya Morning Rush** (Mon–Wed 07:30–08:30): Severe urban congestion increases transit times for W01 (50–55 min) and W02 (65–70 min).
  - **Surabaya/Gresik Friday Evening Peak** (Fri 16:30–17:30): Evening exit traffic increases transit times for W01 (65 min), W02 (100 min), and W04 (85 min).
  - **Malang Weekend Congestion** (W05, W06): Outward weekend tourist traffic on Friday afternoon and Saturday morning increases transit to 165–180 min. Sunday afternoon return traffic increases transit to 190–200 min.
- If an order timestamp is provided, the engine applies traffic-adjusted duration scoring alongside base road distance.

---

## 4. API Standard (ByJSON v2.0)

All endpoints return the 4-key envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "ISO-8601"
  }
}
```

Validation errors return `HTTP 422 Unprocessable Content`:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "validation_error",
    "message": "The request data is invalid. Please check your input.",
    "details": [
      {
        "field": "items.0.quantity",
        "code": "minimum_value",
        "message": "Quantity must be greater than zero."
      }
    ]
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "ISO-8601"
  }
}
```
