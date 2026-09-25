# AI Usage Reflection

As requested in the technical assessment guidelines, I utilized AI tools (Google Antigravity / Gemini) to assist with the development of this project. Below is a reflection on my process, the prompts used, and the limitations encountered.

## 1. Prompts Used & Modifications Made

### Example 1: The Deterministic Rule Engine
**Initial Prompt**: *"I need a Node.js Express backend to route parcels based on weight and value. Create a controller that routes up to 1kg to Mail, up to 10kg to Regular, etc."*

**What the AI generated**: The AI initially generated a giant `if/else` block inside the controller.
```typescript
if (weight <= 1) return 'MAIL';
else if (weight <= 10) return 'REGULAR';
// ...
```
**What I modified and why**: I immediately rejected this approach. Hardcoding business logic in a controller violates the Open/Closed Principle and requires a redeployment every time a rule changes. I instructed the AI: *"Refactor this into a deterministic Rule Engine where the rules are stored as JSON in MongoDB, and the engine evaluates them dynamically based on priority."* This guided the AI to create the `RoutingEngine` class found in `src/routing/engine.ts`, which safely evaluates rules at runtime.

### Example 2: Batch Upload Processing
**Initial Prompt**: *"Create an endpoint to upload a JSON array of 10,000 parcels and route all of them."*

**What the AI generated**: It wrote an endpoint with a massive `for` loop that evaluated all 10,000 parcels synchronously and awaited `RoutingDecision.insertMany()`.
**What I modified and why**: I recognized that evaluating a massive array synchronously would block the Node.js event loop, causing the server to freeze and drop other incoming requests. I instructed the AI: *"Do not process this inline. Setup BullMQ and Redis to offload the array processing to a background worker queue, and return a batchId to the frontend for polling."* I then oversaw the implementation of `batchWorker.ts` to ensure memory safety.

## 2. Demonstrating Understanding of Generated Code

While the AI wrote the boilerplate, I architected the flow. Two critical areas I understand deeply:
1. **The Routing Engine (`engine.ts`)**: The engine uses a unified `evaluate` function. It loops through rules sorted by `priority`. It dynamically maps operators (`gt`, `lte`, `eq`) to standard JavaScript math operations. Because it operates strictly on JSON configuration and uses Zod schemas, it cannot execute arbitrary code (preventing remote code execution vulnerabilities).
2. **BullMQ Worker (`batchWorker.ts`)**: I understand that BullMQ relies on Redis lists and pub/sub. The worker processes chunks of the array asynchronously. If the Express process crashes midway, the Redis queue persists the remaining jobs, guaranteeing that the batch completes once the server restarts.

## 3. Limitations of AI in this Context

Throughout this project, I observed several limitations of AI:
- **Lack of Domain Context**: AI tends to favor the absolute simplest path (e.g., hardcoded `if/else` statements or raw JSON text editors). It does not natively consider the "business risk" of an operator accidentally corrupting a JSON configuration. I had to explicitly intervene and force the creation of the `Draft/Publish` versioning lifecycle and the Visual Rule Builder UI to protect the system.
- **Context Loss on Refactors**: When migrating from the initial "mock authentication" to the secure `sessionStorage` JWT implementation, the AI sometimes forgot to update corresponding Typescript interfaces. I had to manually guide the compiler errors (e.g., ensuring `additionalAttributes` matched the Zod schema's `attributes` key).
- **Physical Logic Blindspots**: The AI suggested retroactively changing the physical `department` of historical parcels when a rule changed. I had to implement an immutable `RoutingDecision` log because, in the real world, you cannot digitally re-route a box that shipped yesterday. AI struggles to bridge digital code with physical logistics without human guidance.
