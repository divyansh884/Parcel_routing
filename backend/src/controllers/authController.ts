import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { UserModel } from '../models/User';
import { AppError } from '../errors/AppError';
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ token, role: user.role, email: user.email });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already in use', 409, 'CONFLICT');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email,
      passwordHash,
      role,
    });

    return res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserModel.find({}, { passwordHash: 0 }); // exclude hash
    return res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, role, password } = req.body;

    const user = await UserModel.findById(id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    if (email) user.email = email;
    if (role) user.role = role;
    if (password && password.trim() !== '') {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();
    return res.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
