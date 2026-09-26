# Parcel Routing System

A robust, production-ready Parcel Routing System that evaluates parcels against a deterministic, versioned rule engine to decide the appropriate routing department or flag for manual review/insurance.

## 🏗️ Architecture
- **Frontend**: Next.js, React, Tailwind CSS (Mobile-First, Responsive Design)
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (Mongoose)
- **Queue/Background**: Redis + BullMQ (for batch processing)
- **Validation**: Zod
- **Testing**: Vitest (Unit & Integration)
- **Logging**: Pino (Structured Logging)
- **Notifications**: Nodemailer (Ethereal Email fallback)
- **File Storage**: Cloudinary (Direct Upload for Insurance Documents)

### Architecture Decisions
- **Dynamic Field & Rule Engine**: Instead of hardcoding conditions (e.g. `weight`, `value`), the database supports a `ParcelField` schema. Admins can create dynamic Custom Fields (Enum, String, Date, Number, Boolean). The frontend dynamically adapts Rule Builders and Forms to match these Custom Fields, and the Backend Engine can recursively evaluate dynamic operators (`contains`, `in`, `after`, `gt`).
- **Decoupled Notification Layer**: The Email service runs asynchronously in a `try/catch` wrapper utilizing Ethereal Email out of the box. This prevents SMTP lag or misconfiguration from crashing the core database transactions.
- **Client-Side Cloudinary Uploads**: Insurance documents upload directly from the browser to Cloudinary utilizing a Presigned URL pattern from the backend. This saves our Node server from processing heavy multi-part form data uploads.

## 🤖 AI Usage Documentation
During the development of this project, AI (Google DeepMind's Antigravity / Gemini) was utilized to rapidly prototype and extend the architecture:
1. **Dynamic Form Generation**: AI assisted in rewriting the Rule Engine UI and the Parcel Creation forms to dynamically render standard and dynamic HTML inputs (selects, calendars, number spinners) strictly based on field typings fetched from the API.
2. **Responsive CSS Overhaul**: AI was instructed to perform a comprehensive "Mobile-First" audit. The AI automatically mapped standard HTML tables into responsive CSS Flexbox Cards for mobile viewports, resolving horizontal scrolling UX issues.
3. **Refactoring Legacy Endpoints**: AI was utilized to automate repetitive refactoring when we upgraded the `RoutingDecision` Mongoose schema to include dynamic `attributes`, ensuring the controller and `engine.ts` were properly updated.
4. **Tooling & Setup**: Background tasks such as Vite/Vitest test runner configuration and Express Rate Limiter setups were scaffolded by the AI.

## 🚀 Features
- **Deterministic Rule Engine**: Rules are configured as structured data, versioned, and strictly evaluated.
- **Dynamic Custom Fields**: Admins can define entirely new attributes (e.g., `destinationCountry`, `substance`, `fragile`) in the UI without writing code.
- **Role-Based Access Control (RBAC)**: Distinct permissions for OPERATOR (routing), ADMIN (rule management), and AUDITOR (read-only).
- **Responsive UI/UX**: Dashboard forms, tables, and modals adapt beautifully from mobile phones to 4K displays.
- **Batch Processing**: Handle up to 100,000 parcels in a single upload processed via BullMQ.
- **Automated Email Pipeline**: Stakeholders receive automated emails for waitlists, approvals, and rejections.

## 💻 Local Setup

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
   - Main App: `http://localhost:3000`
   - Login: Default seeded credentials are provided in the database (or create a new user).

## 🛠️ How to Extend the System with New Routing Rules
The architecture is designed specifically so that **no code changes** are required to extend routing logic!

1. **Create a Field**: Go to the **Admin > Parcel Fields** menu. Create a new data property (e.g., `isFragile` as a Boolean).
2. **Draft a Rule**: Go to the **Admin > Rule Engine**. The system will now dynamically list `isFragile` as a condition field.
3. **Set the Logic**: Specify `IF isFragile EQUALS True -> ROUTE TO Fragile Department`.
4. **Publish**: Save the rule. The Rule Engine backend automatically invalidates previous cache states and retro-routes DRAFT objects if applicable.
5. **Use**: Go to **Route Parcel**. A checkbox for `isFragile` will now dynamically appear on the UI for operators to fill out!

## ⚖️ Trade-offs
- **MongoDB**: Chosen for its flexible schema representation, ideal for storing nested rule conditions and dynamically typed custom fields. A strictly typed SQL DB (like PostgreSQL) would have required complex EAV (Entity-Attribute-Value) anti-patterns or extensive JSONB querying, which is slower to implement dynamically.
- **Redis + BullMQ**: Batch processing via HTTP is prone to timeouts. Offloading to BullMQ ensures memory stability and graceful retries.
- **Monolith over Microservices**: Reduces operational complexity for this assessment scale, while maintaining clear modular boundaries (`routing/`, `controllers/`, `queues/`).
