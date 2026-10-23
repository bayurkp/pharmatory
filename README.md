# 💊 Pharmatory

[![Node.js Version](https://img.shields.io/badge/Node.js-v22.x%20LTS-339933?logo=node.js&logoColor=white)](#prerequisites)
[![Fastify Version](https://img.shields.io/badge/Fastify-v5.x%20LTS-000000?logo=fastify&logoColor=white)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%207.x-3178C6?logo=typescript&logoColor=white)](#tech-stack)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-06B6D4?logo=tailwindcss&logoColor=white)](#tech-stack)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-v5.x-5A0EF8?logo=daisyui&logoColor=white)](#tech-stack)
[![Alpine.js](https://img.shields.io/badge/Alpine.js-v3.x-8BC0D0?logo=alpinedotjs&logoColor=white)](#tech-stack)
[![API Documentation](https://img.shields.io/badge/API_Docs-Scalar-059669)](#api-documentation--endpoints)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

> A high-throughput, enterprise-grade Pharmacy Management System and RESTful API engine engineered with **Fastify (LTS)**, **TypeScript**, **Tailwind CSS v4**, **DaisyUI v5**, **Alpine.js**, and modern interactive API documentation powered by **Scalar**.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architectural Highlights](#-architectural-highlights)
- [Directory Structure](#-directory-structure)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Mode](#development-mode)
  - [Production Build & Execution](#production-build--execution)
- [API Documentation & Endpoints](#-api-documentation--endpoints)
- [Frontend Architecture](#-frontend-architecture)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [License](#-license)

---

## 🌟 Overview

**Pharmatory** is designed as a lightweight, performance-critical pharmaceutical inventory management platform. Rather than incurring the heavy bundling, hydration latency, and memory footprint of complex Single Page Application (SPA) meta-frameworks, Pharmatory demonstrates a **lean full-stack architecture**:

- **Backend**: Microsecond-latency routing and JSON serialization powered by Fastify v5 LTS and native TypeScript.
- **Frontend**: Zero-hydration-overhead dynamic HTML served directly via `@fastify/static`, coupled with Alpine.js for local reactive state and DaisyUI 5 / Tailwind CSS 4 for utility-first styling.
- **Documentation**: Fully automated OpenAPI 3.1 specification serving interactive documentation via Scalar at `/docs/v1` (with convenience redirect from `/docs`), alongside raw OpenAPI JSON specs at `/docs/v1/openapi.json` and `/api/v1/openapi`.

---

## ⚡ Architectural Highlights

- **Fastify v5 LTS Runtime**: Delivers industry-leading Node.js throughput, utilizing compiled schema validation through AJV.
- **Full Type Safety**: Strict TypeScript compiler configuration (`target: ES2022`, `moduleResolution: NodeNext`) ensuring compile-time contract enforcement.
- **Modern CSS-First Pipeline**: Uses `@tailwindcss/cli` with Tailwind CSS v4 and DaisyUI v5 plugin integration, compiling in sub-second intervals without legacy PostCSS or JavaScript configuration files.
- **Autonomous & Offline-Ready**: Bundles the Alpine.js runtime locally within `public/js/alpine.min.js`, ensuring full functionality without external CDN dependencies.
- **Automated OpenAPI Contract**: Generates standards-compliant OpenAPI 3.1 definitions dynamically from route JSON schemas.

---

## 📁 Directory Structure

```text
pharmatory/
├── dist/                      # Production JavaScript output (compiled via tsc)
├── public/                    # Static assets served by @fastify/static
│   ├── css/
│   │   └── styles.css         # Minified Tailwind CSS v4 + DaisyUI bundle
│   ├── js/
│   │   └── alpine.min.js      # Local Alpine.js runtime distribution
│   └── index.html             # Responsive management dashboard
├── src/
│   ├── styles/
│   │   └── app.css            # Tailwind CSS entrypoint (@import & @plugin directives)
│   └── server.ts              # Fastify server bootstrap, schema definitions & route handlers
├── .gitignore                 # Version control exclusions (node_modules, dist, private files)
├── package.json               # Package manifest, dependencies, and build pipeline
├── README.md                  # Public documentation & architecture guide
└── tsconfig.json              # Strict TypeScript compiler options
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose / Justification |
| :--- | :--- | :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) | `^22.17.0` | Modern LTS JavaScript runtime with native fetch and ESM support. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^7.0.2` | Compile-time type verification, strong typing, and enhanced DX. |
| **Backend Framework** | [Fastify](https://fastify.dev/) | `^5.12.7` | High-performance, low-overhead Node.js web framework with built-in schema compilation. |
| **API Specification** | [@fastify/swagger](https://github.com/fastify/fastify-swagger) | `^9.9.2` | Generates OpenAPI 3.1 specifications dynamically from Fastify route schemas. |
| **API Documentation** | [@scalar/fastify-api-reference](https://scalar.com/) | `^1.75.1` | Modern, responsive, and interactive API documentation interface. |
| **Static Asset Engine** | [@fastify/static](https://github.com/fastify/fastify-static) | `^10.1.7` | High-efficiency static file serving with caching and index resolution. |
| **CSS Framework** | [Tailwind CSS](https://tailwindcss.com/) | `^4.3.3` | Next-generation utility-first stylesheet engine with native CSS imports. |
| **UI Components** | [DaisyUI](https://daisyui.com/) | `^5.7.50` | Semantic component classes with accessible themes (Emerald, Corporate, etc.). |
| **Client Reactivity** | [Alpine.js](https://alpinejs.dev/) | `^3.17.5` | Lightweight reactive state management without the complexity of a virtual DOM. |
| **Tooling & Watcher** | [tsx](https://github.com/privatenumber/tsx) | `^4.23.15` | Zero-configuration TypeScript execution with hot-reloading for development. |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `v20.x` or `v22.x LTS` (Verified on Node.js `v22.17.0`)
- **npm**: `v10.x` or `v11.x`

### Installation

Clone the repository and install all project dependencies:

```bash
git clone <repository-url>
cd pharmatory
npm install
```

### Development Mode

Start the integrated development environment. This concurrently spins up the Fastify server with hot-reload (`tsx watch`) and the Tailwind CSS watcher:

```bash
npm run dev
```

The application will be accessible at:
- **Application Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Interactive Scalar Docs**: [http://localhost:3000/docs/v1](http://localhost:3000/docs/v1) *(or [http://localhost:3000/docs](http://localhost:3000/docs))*
- **Raw OpenAPI 3.1 JSON**: [http://localhost:3000/docs/v1/openapi.json](http://localhost:3000/docs/v1/openapi.json) *(or [http://localhost:3000/api/v1/openapi](http://localhost:3000/api/v1/openapi))*

### Production Build & Execution

Compile both the CSS bundle and TypeScript source code into optimized production artifacts:

```bash
# 1. Build minified CSS and compile TypeScript into dist/
npm run build

# 2. Launch the compiled production server
npm run start
```

---

## 🔌 API Documentation & Endpoints

Pharmatory provides interactive documentation powered by **Scalar** alongside raw OpenAPI 3.1 schema endpoints for CI/CD, Postman, and automated client generation.

### Documentation Endpoints

- **Scalar API Reference UI**: `GET /docs/v1` *(convenience redirect from `GET /docs`)*  
  Interactive web portal showcasing endpoints, request body models, schema properties, and a live testing sandbox.
- **Raw OpenAPI Specification**: `GET /docs/v1/openapi.json` & `GET /api/v1/openapi`  
  Machine-readable OpenAPI 3.1 JSON contracts representing all registered routes and data models.

### Endpoint Catalog

| HTTP Method | Route | Description | Auth / Tag |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Web Management Dashboard (HTML) | Public |
| `GET` | `/docs/v1` | Scalar Interactive API Documentation | Public |
| `GET` | `/docs` | Convenience redirect to `/docs/v1` | Public |
| `GET` | `/docs/v1/openapi.json` | Raw OpenAPI 3.1 JSON Specification | Public |
| `GET` | `/api/v1/openapi` | Raw OpenAPI 3.1 JSON Specification (Alias) | Public |
| `GET` | `/api/health` | Service health status and timestamp | `System` |
| `GET` | `/api/v1/medicines` | Retrieve complete inventory of medicines | `Medicines` |
| `POST` | `/api/v1/medicines` | Create and register a new medicine item | `Medicines` |

---

## 🎨 Frontend Architecture

The user interface emphasizes **progressive enhancement** and **minimal client payload**:

1. **Server-Rendered HTML**: The core layout in [`public/index.html`](public/index.html) is served instantly with zero JavaScript compilation delay.
2. **DaisyUI & Tailwind v4**: Theme switching (e.g., `emerald`, `corporate`, `dark`) operates directly through the HTML `data-theme` attribute.
3. **Reactive State with Alpine.js**:
   - Asynchronous data fetching from `/api/v1/medicines` on initialization (`x-init`).
   - Client-side form submission using `fetch` with real-time UI state updates.
   - Client-side counter and dynamic theme switcher without page reloads.

---

## 📋 NPM Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Tailwind CSS compilation and Fastify server concurrently in watch mode. |
| `npm run dev:server` | Runs the Fastify backend via `tsx watch src/server.ts`. |
| `npm run dev:css` | Watches `src/styles/app.css` and updates `public/css/styles.css`. |
| `npm run build` | Builds both production assets: compiles minified CSS and compiles TypeScript to `dist/`. |
| `npm run build:css` | Compiles and minifies Tailwind CSS and DaisyUI into `public/css/styles.css`. |
| `npm run build:ts` | Compiles TypeScript source files into JavaScript inside the `dist/` folder. |
| `npm run start` | Executes the compiled production server from `dist/server.js`. |

---

## 📄 License

This repository is distributed under the terms of the **ISC License**. See the [LICENSE](LICENSE) file for further information.
