import { z } from 'zod';

export const parcelSchema = z.object({
  id: z.string().optional(),
  customerEmail: z.string().email({ message: 'Invalid email address' }).optional(),
  weightKg: z.number().min(0, { message: 'Weight cannot be negative' }),
  valueEur: z.number().min(0, { message: 'Value cannot be negative' }),
  destinationCountry: z.string().length(2, { message: 'Must be a 2-letter ISO code' }),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export type Parcel = z.infer<typeof parcelSchema>;

export enum RoutingDepartment {
  MAIL = 'MAIL',
  REGULAR = 'REGULAR',
  HEAVY = 'HEAVY',
  INTERNATIONAL_HEAVY = 'INTERNATIONAL_HEAVY',
}

export enum ApprovalType {
  INSURANCE = 'INSURANCE',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}

export type RoutingDecision = 
  | { status: 'ROUTED'; department: string; ruleId: string; ruleVersion: number; reason: string }
  | { status: 'PENDING_APPROVAL'; approvalType: string; ruleId: string; ruleVersion: number; reason: string }
  | { status: 'REJECTED'; reason: string }
  | { status: 'ERROR'; reason: string };
