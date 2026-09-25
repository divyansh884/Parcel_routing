import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, uppercase: true },
  },
  { timestamps: true }
);

export const DepartmentModel = mongoose.model<IDepartment>('Department', departmentSchema);
