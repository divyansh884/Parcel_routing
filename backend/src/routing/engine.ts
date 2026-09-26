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
    const baseValue = (parcel as any)[condition.field];
    const parcelValue = baseValue !== undefined ? baseValue : parcel.attributes?.[condition.field];

    if (parcelValue === undefined || parcelValue === null) {
      logger.debug(`Field ${condition.field} is missing on parcel`);
      return false; // Safely fail if field is missing
    }

    const cVal = condition.value;

    switch (condition.operator) {
      // String / Number / Boolean common
      case 'equals':
      case 'eq':
        return parcelValue === cVal;
      case 'not_equals':
        return parcelValue !== cVal;
      
      // Number / Date
      case 'greater_than':
      case 'gt':
        return parcelValue > cVal;
      case 'greater_than_or_equal':
      case 'gte':
        return parcelValue >= cVal;
      case 'less_than':
      case 'lt':
        return parcelValue < cVal;
      case 'less_than_or_equal':
      case 'lte':
        return parcelValue <= cVal;
        
      // String specific
      case 'contains':
        return String(parcelValue).includes(String(cVal));
      case 'starts_with':
        return String(parcelValue).startsWith(String(cVal));
      case 'ends_with':
        return String(parcelValue).endsWith(String(cVal));
        
      // Enum specific
      case 'in':
        return Array.isArray(cVal) && cVal.includes(parcelValue);
      case 'not_in':
        return Array.isArray(cVal) && !cVal.includes(parcelValue);
        
      // Date specific
      case 'before':
        return new Date(parcelValue) < new Date(cVal);
      case 'after':
        return new Date(parcelValue) > new Date(cVal);
      case 'on_or_before':
        return new Date(parcelValue) <= new Date(cVal);
      case 'on_or_after':
        return new Date(parcelValue) >= new Date(cVal);
        
      default:
        logger.error(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  private createDecision(rule: Rule): RoutingDecision {
    const { field, operator, value } = rule.condition;
    const valString = Array.isArray(value) ? `[${value.join(', ')}]` : value;
    const reason = `Parcel ${field} is ${operator} ${valString}`;

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
