import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  batchId: string;
  filename: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL_FAILURE';
  totalCount: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  createdBy: string;
  completedAt?: Date;
  createdAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    batchId: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    status: { type: String, required: true, default: 'UPLOADED' },
    totalCount: { type: Number, required: true, default: 0 },
    processedCount: { type: Number, required: true, default: 0 },
    successCount: { type: Number, required: true, default: 0 },
    failureCount: { type: Number, required: true, default: 0 },
    createdBy: { type: String, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const BatchModel = mongoose.model<IBatch>('Batch', batchSchema);
