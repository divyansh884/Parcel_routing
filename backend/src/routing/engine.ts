import { Parcel, RoutingDecision } from '../domain/parcel';
import { Rule, RuleSet, RuleCondition } from '../domain/rule';
import { logger } from '../observability/logger';

export class RoutingEngine {
  constructor(private ruleSet: RuleSet) {
    // Sort rules by descending priority on initialization
    this.ruleSet.rules.sort((a, b) => b.priority - a.priority);
  }

  public evaluate(parcel: Parcel): RoutingDecision {
    for (const rule of this.ruleSet.rules) {
      if (!rule.enabled) continue;

      if (this.evaluateCondition(parcel, rule.condition)) {
        return this.createDecision(rule);
      }
    }

    return {
      status: 'REJECTED',
      reason: 'No applicable routing rule found for this parcel.',
    };
  }

  private evaluateCondition(parcel: Parcel, condition: RuleCondition): boolean {
    // We only support first-level properties for now, but could use lodash.get for deep nested fields.
    const parcelValue = (parcel as any)[condition.field];

    if (parcelValue === undefined) {
      logger.debug(`Field ${condition.field} is missing on parcel`);
      return false; // Safely fail if field is missing
    }

    switch (condition.operator) {
      case 'eq':
        return parcelValue === condition.value;
      case 'gt':
        return parcelValue > condition.value;
      case 'gte':
        return parcelValue >= condition.value;
      case 'lt':
        return parcelValue < condition.value;
      case 'lte':
        return parcelValue <= condition.value;
      default:
        logger.error(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  private createDecision(rule: Rule): RoutingDecision {
    let reason = '';
    
    // Generate explainable reason
    const { field, operator, value } = rule.condition;
    reason = `Parcel ${field} is ${operator} ${value}`;

    if (rule.action.type === 'ROUTE') {
      return {
        status: 'ROUTED',
        department: rule.action.department,
        ruleId: rule.id,
        ruleVersion: this.ruleSet.version,
        reason,
      };
    } else if (rule.action.type === 'REQUIRE_APPROVAL') {
      return {
        status: 'PENDING_APPROVAL',
        approvalType: rule.action.approvalType,
        ruleId: rule.id,
        ruleVersion: this.ruleSet.version,
        reason,
      };
    }

    return {
      status: 'ERROR',
      reason: 'Invalid rule action type',
    };
  }
}
