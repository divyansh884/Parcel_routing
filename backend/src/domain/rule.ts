import { z } from 'zod';

export const ruleConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
  value: z.union([z.number(), z.string()]),
});

export type RuleCondition = z.infer<typeof ruleConditionSchema>;

export const ruleActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ROUTE'),
    department: z.string(),
  }),
  z.object({
    type: z.literal('REQUIRE_APPROVAL'),
    approvalType: z.string(),
  }),
]);

export type RuleAction = z.infer<typeof ruleActionSchema>;

export const ruleSchema = z.object({
  id: z.string(),
  priority: z.number().int(),
  enabled: z.boolean(),
  condition: ruleConditionSchema,
  action: ruleActionSchema,
});

export type Rule = z.infer<typeof ruleSchema>;

export const ruleSetSchema = z.object({
  version: z.number().int(),
  rules: z.array(ruleSchema),
});

export type RuleSet = z.infer<typeof ruleSetSchema>;
