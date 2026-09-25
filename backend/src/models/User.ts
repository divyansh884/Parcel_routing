import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'OPERATOR' | 'ADMIN' | 'AUDITOR';
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['OPERATOR', 'ADMIN', 'AUDITOR'], required: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
