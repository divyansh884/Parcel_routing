# Parcel Routing System

A robust, production-ready Parcel Routing System that evaluates parcels against a deterministic, versioned rule engine to decide the appropriate routing department or flag for manual review/insurance.

## 🚀 Architecture
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (Mongoose)
- **Queue/Background**: Redis + BullMQ (for batch processing)
- **Validation**: Zod
- **Testing**: Vitest (Unit & Integration)
- **Logging**: Pino (Structured Logging)

## 📦 Features
- **Deterministic Rule Engine**: Rules are configured as structured data, versioned, and strictly evaluated.
- **Rule Lifecycle**: Rules start as DRAFT, can be validated, and then published to ACTIVE. Historical rules are never mutated in place.
- **Batch Processing**: Handle up to 100,000 parcels in a single upload. Uploads return immediately and are processed incrementally in the background via BullMQ.
- **Role-Based Access Control (RBAC)**: Distinct permissions for OPERATOR (routing), ADMIN (rule management), and AUDITOR (read-only).
- **Observability**: Request IDs, structured JSON logging, and `/health` endpoints.

## 🛠️ Local Setup

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start Infrastructure (MongoDB & Redis)**
   ```bash
   docker compose up -d
   ```

3. **Seed Database**
   ```bash
   cd backend
   npm run seed
   ```

4. **Run Application**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

5. **Access Application**
   - Single Parcel UI: `http://localhost:3000`
   - Batch Processing UI: `http://localhost:3000/batch`

## 🧠 Rule Engine Design
The rule engine evaluates structured objects instead of evaluating arbitrary JavaScript. This ensures security and explainability.

**Example Rule**:
```json
{
  "id": "insurance-required",
  "priority": 100,
  "enabled": true,
  "condition": { "field": "valueEur", "operator": "gt", "value": 1000 },
  "action": { "type": "REQUIRE_APPROVAL", "approvalType": "INSURANCE" }
}
```

## 🔄 Adding a New Rule (Git Workflow Example)
1. `git checkout -b feature/japan-heavy-routing`
2. Update tests in `tests/unit/engine.test.ts` to expect Japan routing.
3. Add the rule configuration payload.
4. Open Pull Request -> CI runs lint and tests -> Merge.
5. In production, an Admin calls `POST /api/rules/draft` and `POST /api/rules/vX/publish`.

## ⚖️ Trade-offs
- **MongoDB**: Chosen for its flexible schema representation, ideal for storing nested rule conditions and varied parcel attributes.
- **Redis + BullMQ**: Batch processing via HTTP is prone to timeouts. Offloading to BullMQ ensures memory stability and graceful retries.
- **Monolith over Microservices**: Reduces operational complexity for this assessment scale, while maintaining clear modular boundaries (`routing/`, `controllers/`, `queues/`).

## 🔮 Future Improvements
- Implement a true Identity Provider (OIDC/SSO) instead of basic JWT.
- Expose Prometheus metrics for Prometheus/Grafana anomaly detection (e.g., sudden spikes in INSURANCE approvals).
- Object storage (S3) for batch files instead of passing large payloads directly to Express.
- Pre-deployment "Simulation" endpoint to run historical parcels against DRAFT rules to preview impact.
