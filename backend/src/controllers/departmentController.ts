import { Request, Response, NextFunction } from 'express';
import { DepartmentModel } from '../models/Department';
import { AppError } from '../errors/AppError';

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await DepartmentModel.find().sort({ name: 1 });
    return res.status(200).json(departments.map(d => d.name));
  } catch (error) {
    next(error);
  }
};

export const addDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      throw new AppError('Department name is required', 400, 'VALIDATION_ERROR');
    }

    const upperName = name.trim().toUpperCase();
    const existing = await DepartmentModel.findOne({ name: upperName });
    if (existing) {
      throw new AppError('Department already exists', 400, 'VALIDATION_ERROR');
    }

    const dept = new DepartmentModel({ name: upperName });
    await dept.save();

    return res.status(201).json(dept);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.params.name);
    await DepartmentModel.findOneAndDelete({ name: name.toUpperCase() });
    return res.status(200).json({ message: 'Department deleted' });
  } catch (error) {
    next(error);
  }
};
