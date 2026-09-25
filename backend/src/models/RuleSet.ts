import mongoose, { Schema, Document } from 'mongoose';
import { RuleSet } from '../domain/rule';

export interface IRuleSet extends Document {
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ROLLED_BACK';
  rules: any[]; // Using any here to bypass strict mongoose typing for mixed schemas, validated by Zod
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  publishedAt?: Date;
}

const ruleSetSchema = new Schema<IRuleSet>(
  {
    version: { type: Number, required: true, unique: true },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'ROLLED_BACK'], default: 'DRAFT' },
    rules: [{ type: Schema.Types.Mixed, required: true }],
    createdBy: { type: String, required: true },
    approvedBy: { type: String },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// We need an index on version and status
ruleSetSchema.index({ status: 1 });

export const RuleSetModel = mongoose.model<IRuleSet>('RuleSet', ruleSetSchema);
