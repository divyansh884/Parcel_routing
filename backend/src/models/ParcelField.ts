import mongoose, { Schema, Document } from 'mongoose';

export interface IParcelField extends Document {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'date';
  required: boolean;
  values?: string[]; // Allowed values for enum
  operators: string[];
  active: boolean;
}

const parcelFieldSchema = new Schema<IParcelField>(
  {
    name: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean', 'enum', 'date'], required: true },
    required: { type: Boolean, default: false },
    values: [{ type: String }],
    operators: [{ type: String }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ParcelFieldModel = mongoose.model<IParcelField>('ParcelField', parcelFieldSchema);
