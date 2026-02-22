# 🎓 VNSGU Timetable Management Platform (NEP-Scheduler)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: Monorepo](https://img.shields.io/badge/Structure-PNPM--Monorepo-blue)](https://pnpm.io/)
[![Engine: Google OR-Tools](https://img.shields.io/badge/Engine-Google_OR--Tools-brightgreen)](https://developers.google.com/optimization)

**NEP-Scheduler** is a high-performance, AI-driven academic scheduling platform designed for large-scale universities like VNSGU. It automates the complex task of generating conflict-free, workload-balanced timetables while adhering to **NEP 2020** mandates.

---

## 🏗️ System Architecture

The project is structured as a **Polyglot Monorepo**, isolating concerns while maintaining strong type safety across the stack.

```mermaid
graph TD
    User((User)) --> Web[Next.js Frontend]
    Web --> API[Node.js / Express API]
    API --> DB[(PostgreSQL)]
    API --> Redis[(Redis Cache)]
    API --> AI[Python AI Engine]
    AI --> Solver[Google OR-Tools]
    
    subgraph "Real-Time Updates"
    API <--> Socket[Socket.io]
    Socket <--> Web
    end
```

### Microservices Breakdown
| Service | Tech Stack | Responsibility |
| :--- | :--- | :--- |
| **`apps/web`** | Next.js 14, Tailwind, Shadcn | Multi-role responsive dashboard (4 Panels). |
| **`apps/api`** | Node.js, TypeScript, Prisma | Business logic, RBAC, and AI orchestration. |
| **`apps/ai-engine`**| Python 3.10, FastAPI | Constraint solving and optimization logic. |
| **`packages/types`** | TypeScript | Shared Zod schemas and TypeScript interfaces. |

---

## 🧠 The AI Scheduling Engine

The "brain" of the platform uses **Google OR-Tools CP-SAT Solver** to resolve billions of possible scheduling combinations in seconds.

### 🛡️ Hard Constraints (Immutable)
- **Faculty Availability**: No faculty can be in two rooms at once.
- **Room Conflict**: No classroom can host two different batches simultaneously.
- **Batch Integrity**: A student batch cannot have overlapping lectures.
- **Capacity**: Batch strength must not exceed room capacity.
- **Lab Requirements**: Lab sessions must be assigned to Lab-type resources.

### 📈 Soft Constraints (Optimized)
- **Workload Balance**: Distribute hours evenly across faculty members.
- **No Gaps**: Minimize "empty slots" in faculty and student daily schedules.
- **Preferred Slots**: Prioritize major subjects for morning hours.

---

## 🛠️ Feature Matrix

The platform is divided into 4 specialized panels to handle the university hierarchy:

### 1. Global Superadmin
- Managing multiple university tenants.
- Global user credential control and audit logging.
- Cross-university timetable monitoring.

### 2. University Admin
- Full infrastructure management (Classrooms, Labs, Departments).
- Faculty pool coordination and primary/secondary workload assignment.
- Global university-level scheduling parameters.

### 3. Department Admin
- Granular control over department-specific courses and batches.
- **Standard Generation**: AI-triggered master schedules.
- **Special Contingency**: Regenerate schedules on-the-fly when faculty are absent.

### 4. Faculty Portal
- Personalized weekly schedule view.
- Real-time updates on room changes or substitutions.
- Profile and credential management.

---

## 🚀 Step-by-Step Project Start

Follow these exact steps to launch the entire ecosystem in under 2 minutes:

### 1. External Infrastructure (Docker)
Ensure Docker is running, then spin up the database, cache, and solvers:
```bash
docker-compose up -d
```

### 2. Backend & Database Sync
Initialize the database schema and seed the environment with VNSGU demo data:
```bash
cd apps/api
pnpm install
npx prisma db push
npx prisma db seed # This creates Ravi's account!
# Start the API
pnpm run dev
```

### 3. Solvers & Health Check
The AI engine and Redis start automatically with Docker. You can check the solver health at `http://localhost:5000/health`.

### 4. Frontend Launch
In a new terminal:
```bash
cd apps/web
pnpm install
pnpm run dev
```
Open `http://localhost:3000` and login.

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Superadmin** | `admin@nep-scheduler.com` | `password123` |
| **Uni Admin** | `admin@vnsgu.ac.in` | `password123` |
| **Dept Admin** | `admin_dcs@vnsgu.ac.in` | `password123` |
| **Faculty (Ravi)** | `ravi@vnsgu.ac.in` | `password123` |

---

## ☁️ Deployment

This project is optimized for **Google Cloud Platform (GCP)** using:
- **Cloud Run** for horizontal scaling of microservices.
- **Cloud SQL** for managed PostgreSQL.
- **Memorystore** for managed Redis.

See the [In-depth GCP Deployment Guide](./gcp_deployment_guide.md) for step-by-step instructions.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

*Built with ❤️ By [Rajput Shivam Singh](https://github.com/WhiteDevil-rss)*
