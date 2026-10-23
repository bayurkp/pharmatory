# 💊 Pharmatory

> High-performance Pharmacy Management System and API service built with **Fastify (LTS)**, **TypeScript**, **Tailwind CSS v4**, **DaisyUI v5**, **Alpine.js**, and modern interactive API documentation powered by **Scalar**.

---

## 🌟 Overview

**Pharmatory** is a modern, lightweight pharmaceutical application engineered for speed, reliability, and developer experience. It demonstrates a lean architecture combining a high-throughput Fastify backend with reactive, low-overhead frontend components without the baggage of heavy single-page application (SPA) frameworks.

### Key Highlights

- **⚡ Fastify LTS (v5.x)**: Industry-leading Node.js web framework with built-in JSON schema validation and high performance.
- **🛡️ Full TypeScript Support**: Type-safe development with strict type checks and ES2022 / NodeNext module resolution.
- **✨ Interactive API Documentation (Scalar)**:
  - **Scalar Docs UI**: Accessible at `/api/v1/docs`
  - **Raw OpenAPI 3.1 JSON**: Accessible at `/api/v1/openapi`
- **🎨 Modern Utility-First UI**: Powered by **Tailwind CSS v4** and **DaisyUI v5** for accessible, customizable components and dynamic themes.
- **⚡ Reactive Frontend**: Built with **Alpine.js (v3)** running locally (no CDN required), handling reactive state management seamlessly.

---

## 📁 Project Structure

```text
pharmatory/
├── dist/                   # Compiled JavaScript output (production)
├── public/                 # Static assets served by Fastify
│   ├── css/
│   │   └── styles.css      # Compiled Tailwind CSS + DaisyUI
│   ├── js/
│   │   └── alpine.min.js   # Local Alpine.js runtime
│   └── index.html          # Interactive frontend dashboard
├── src/
│   ├── styles/
│   │   └── app.css         # Tailwind v4 entrypoint (@plugin "daisyui")
│   └── server.ts           # Fastify application entrypoint & API routes
├── .gitignore              # Ignored files (node_modules, dist, private notes)
├── package.json            # Scripts & dependencies
├── README.md               # Public documentation
└── tsconfig.json           # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x or v22.x LTS (Recommended: Node.js 22+)
- **npm**: v10+

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pharmatory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server with live watch mode for both TypeScript backend and Tailwind CSS:

```bash
npm run dev
```

- Web Application: [http://localhost:3000](http://localhost:3000)
- Scalar API Reference: [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)
- Raw OpenAPI JSON: [http://localhost:3000/api/v1/openapi](http://localhost:3000/api/v1/openapi)

### Production Build

Compile CSS assets and TypeScript code for production:

```bash
npm run build
npm run start
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Tags |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Web frontend dashboard | Frontend |
| `GET` | `/api/v1/docs` | Scalar interactive API documentation | Docs |
| `GET` | `/api/v1/openapi`| Raw OpenAPI 3.1 JSON schema | Docs |
| `GET` | `/api/health` | Service health status | System |
| `GET` | `/api/v1/medicines` | Retrieve list of pharmacy medicines | Medicines |
| `POST`| `/api/v1/medicines` | Create a new medicine entry | Medicines |

---

## 🛠️ Tech Stack

- **Backend**: [Fastify](https://fastify.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Documentation**: [@fastify/swagger](https://github.com/fastify/fastify-swagger), [@scalar/fastify-api-reference](https://scalar.com/)
- **Frontend**: [Alpine.js](https://alpinejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [DaisyUI v5](https://daisyui.com/)
- **Static Serving**: [@fastify/static](https://github.com/fastify/fastify-static)
- **Dev Tools**: `tsx`, `concurrently`

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
