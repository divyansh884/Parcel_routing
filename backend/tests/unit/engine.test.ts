import { describe, it, expect } from 'vitest';
import { RoutingEngine } from '../../src/routing/engine';
import { RuleSet } from '../../src/domain/rule';
import { Parcel } from '../../src/domain/parcel';

describe('Routing Engine', () => {
  const defaultRules: RuleSet = {
    version: 1,
    rules: [
      {
        id: 'insurance-required',
        priority: 100,
        enabled: true,
        condition: { field: 'valueEur', operator: 'gt', value: 1000 },
        action: { type: 'REQUIRE_APPROVAL', approvalType: 'INSURANCE' },
      },
      {
        id: 'mail-routing',
        priority: 50,
        enabled: true,
        condition: { field: 'weightKg', operator: 'lte', value: 1 },
        action: { type: 'ROUTE', department: 'MAIL' },
      },
      {
        id: 'regular-routing',
        priority: 40,
        enabled: true,
        condition: { field: 'weightKg', operator: 'lte', value: 10 },
        action: { type: 'ROUTE', department: 'REGULAR' },
      },
      {
        id: 'heavy-routing',
        priority: 30,
        enabled: true,
        condition: { field: 'weightKg', operator: 'gt', value: 10 },
        action: { type: 'ROUTE', department: 'HEAVY' },
      },
    ],
  };

  it('routes to MAIL if weight <= 1kg', () => {
    const engine = new RoutingEngine(defaultRules);
    const parcel: Parcel = { weightKg: 0.5, valueEur: 100, destinationCountry: 'IN' };
    
    const decision = engine.evaluate(parcel);
    expect(decision).toEqual({
      status: 'ROUTED',
      department: 'MAIL',
      ruleId: 'mail-routing',
      ruleVersion: 1,
      reason: 'Parcel weightKg is lte 1',
    });
  });

  it('routes to REGULAR if weight is between 1kg and 10kg', () => {
    const engine = new RoutingEngine(defaultRules);
    const parcel: Parcel = { weightKg: 5, valueEur: 100, destinationCountry: 'IN' };
    
    const decision = engine.evaluate(parcel);
    expect(decision).toMatchObject({
      status: 'ROUTED',
      department: 'REGULAR',
      ruleId: 'regular-routing',
    });
  });

  it('routes to HEAVY if weight > 10kg', () => {
    const engine = new RoutingEngine(defaultRules);
    const parcel: Parcel = { weightKg: 10.01, valueEur: 100, destinationCountry: 'IN' };
    
    const decision = engine.evaluate(parcel);
    expect(decision).toMatchObject({
      status: 'ROUTED',
      department: 'HEAVY',
      ruleId: 'heavy-routing',
    });
  });

  it('requires INSURANCE approval if value > 1000', () => {
    const engine = new RoutingEngine(defaultRules);
    // Even if weight is small, priority of insurance rule is 100 > 50
    const parcel: Parcel = { weightKg: 0.5, valueEur: 1000.01, destinationCountry: 'IN' };
    
    const decision = engine.evaluate(parcel);
    expect(decision).toMatchObject({
      status: 'PENDING_APPROVAL',
      approvalType: 'INSURANCE',
      ruleId: 'insurance-required',
    });
  });

  it('evaluates based on rule priorities correctly', () => {
    const customRules: RuleSet = {
      version: 2,
      rules: [
        {
          id: 'low-priority',
          priority: 10,
          enabled: true,
          condition: { field: 'weightKg', operator: 'gt', value: 0 },
          action: { type: 'ROUTE', department: 'LOW' },
        },
        {
          id: 'high-priority',
          priority: 20,
          enabled: true,
          condition: { field: 'weightKg', operator: 'gt', value: 0 },
          action: { type: 'ROUTE', department: 'HIGH' },
        },
      ],
    };

    const engine = new RoutingEngine(customRules);
    const parcel: Parcel = { weightKg: 5, valueEur: 100, destinationCountry: 'IN' };
    
    const decision = engine.evaluate(parcel);
    expect(decision).toMatchObject({
      status: 'ROUTED',
      department: 'HIGH',
      ruleId: 'high-priority',
    });
  });
});
