# AI Usage Documentation

This document outlines the meaningful ways AI was utilized during the development of this Parcel Routing System.

## 1. Generating Rule Engine Unit Tests

### Prompt
> Generate exhaustive unit tests for a TypeScript Rule Engine that routes parcels based on weight, value, and priority. Include boundary conditions for 1kg and 10kg, and rule precedence where value > €1000 requires insurance regardless of weight.

### What AI generated
The AI generated a standard Vitest suite with mock rule configurations and multiple test blocks covering the boundaries (e.g., 0.99, 1.00, 1.01) and precedence.

### What I changed
I refactored the test setup to utilize the Zod schemas and strict TypeScript interfaces defined in the domain module. I also modified the `decision` object expectations to match the exact exact schema `status: 'PENDING_APPROVAL'` instead of generic mocked responses.

### Why I changed it
Engineering reasoning: Tests must strictly validate the precise domain structures. AI-generated tests often guess the interface, which can lead to false positives if the application domain types are stricter.

### Validation
Verified by running `npx vitest run`. The tests correctly failed initially, guiding me to fix minor edge cases in the rule engine's operator evaluation loop.

### Limitations
AI doesn't natively understand the holistic structure of the database models and sometimes generates tests that pass on isolated functions but break when integrated with Mongoose ObjectId types.


---

## 2. Bootstrapping Batch Processing Queue with BullMQ

### Prompt
> Create a BullMQ worker in TypeScript that consumes a 'batch-routing-queue'. It needs to process a chunk of parcels, update a Mongoose BatchModel with success/failure counts, and gracefully handle concurrent execution.

### What AI generated
A functional BullMQ `Worker` instance that iterated through parcels, called an abstract routing function, and updated MongoDB. It included basic connection options for Redis.

### What I changed
I overhauled the MongoDB update logic. The AI suggested fetching the batch document, modifying properties, and calling `.save()` inside the loop for every parcel. I changed this to run the routing in memory, count successes/failures, and then perform a single atomic `$inc` update on `BatchModel` at the end of the chunk.

### Why I changed it
Engineering reasoning: Performing a MongoDB `.save()` per parcel inside a 100,000 record batch would completely exhaust connection pools and rate limit the database. Using MongoDB atomic operators (`$inc`) per chunk is significantly more performant and prevents race conditions.

### Validation
Simulated large payload processing locally and verified through logs that MongoDB updates occurred incrementally per chunk rather than per item.

### Limitations
The AI lacked the architectural context of a high-throughput system. Blindly accepting its `save()` inside a loop would have caused a production incident under load.
