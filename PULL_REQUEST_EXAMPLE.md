# Pull Request: Add "Fragile" Department Routing Feature

**Branch**: `feature/fragile-routing`
**Target**: `main`
**Author**: Candidate

## Overview
This PR introduces the ability to route parcels with the `isFragile` custom attribute to a dedicated `FRAGILE` department, ensuring they bypass the heavy sorting belts.

## Changes Made
1. **Zod Schema (parcel.ts)**: Confirmed that `attributes` allows unstructured data so `isFragile: true` passes validation without needing DB schema migrations.
2. **Rule Seed (seed.ts)**: Injected the new default rule into the initial DB seed for new environments.
   - *Condition*: `attributes.isFragile` == `true`
   - *Action*: Route to `FRAGILE`
   - *Priority*: 90 (Below Insurance (100), above Mail (50)).
3. **Tests (engine.test.ts)**: Added 3 new unit tests to cover boundary conditions:
   - Evaluates to FRAGILE when `isFragile` is true and value < 1000.
   - Correctly prioritizes INSURANCE if `isFragile` is true but value > 1000.
   - Does not route to FRAGILE if `isFragile` is false.

## Regression Protection
By running `npm run test`, we successfully verify that adding the Fragile rule priority (90) did not accidentally short-circuit or overwrite our existing `MAIL`, `REGULAR`, and `HEAVY` logic. The unit tests protect the deterministic nature of the `RoutingEngine`.

## Safety & Rollback Strategy
- This PR only modifies the default *seed* and the *tests*. 
- In production, we will **NOT** run database scripts to alter logic. Instead, an Admin will use the `Visual Rule Builder` UI to safely draft this rule.
- If the rule behaves unexpectedly (e.g., catching too many parcels), the Admin can instantly disable it or use the Draft/Publish system to rollback to the previous RuleSet version. No code rollback or server restart is required.
- Historical parcels will retain their original routing stamp, ensuring financial audit compliance.

## Pre-Merge Checklist
- [x] Unit tests written and passing (`vitest`)
- [x] No linter errors (`eslint`)
- [x] No hardcoded if/else statements introduced to `parcelController.ts`
- [x] Tested locally via Visual Rule Builder UI
