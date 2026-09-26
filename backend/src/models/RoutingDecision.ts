import mongoose, { Schema, Document } from 'mongoose';

export interface IRoutingDecision extends Document {
  parcelId?: string;
  customerEmail?: string;
  weightKg: number;
  valueEur: number;
  destinationCountry: string;
  additionalAttributes?: Record<string, any>;
  
  status: 'ROUTED' | 'PENDING_APPROVAL' | 'REJECTED' | 'ERROR';
  department?: string;
  approvalType?: string;
  ruleId?: string;
  ruleVersion?: number;
  reason: string;
  insuranceDetails?: {
    policyNumber: string;
    provider: string;
    coverageAmount: number;
    documentUrl?: string;
  };
  requestId: string;
  batchId?: string;
  createdAt: Date;
}

const routingDecisionSchema = new Schema<IRoutingDecision>(
  {
    parcelId: { type: String, index: true },
    customerEmail: { type: String },
    weightKg: { type: Number, required: true },
    valueEur: { type: Number, required: true },
    destinationCountry: { type: String, required: true },
    additionalAttributes: { type: Schema.Types.Mixed },
    
    status: { type: String, required: true },
    department: { type: String },
    approvalType: { type: String },
    ruleId: { type: String },
    ruleVersion: { type: Number },
    reason: { type: String, required: true },
    insuranceDetails: {
      policyNumber: { type: String },
      provider: { type: String },
      coverageAmount: { type: Number },
      documentUrl: { type: String },
    },
    requestId: { type: String, required: true, index: true },
    batchId: { type: String, index: true },
  },
  { timestamps: true }
);

export const RoutingDecisionModel = mongoose.model<IRoutingDecision>('RoutingDecision', routingDecisionSchema);
