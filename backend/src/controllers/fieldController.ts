import { Request, Response, NextFunction } from 'express';
import { ParcelFieldModel } from '../models/ParcelField';
import { AppError } from '../errors/AppError';

export const getOperatorsForType = (type: string) => {
  switch (type) {
    case 'string': return ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with'];
    case 'number': return ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'];
    case 'boolean': return ['equals', 'not_equals'];
    case 'enum': return ['equals', 'not_equals', 'in', 'not_in'];
    case 'date': return ['equals', 'before', 'after', 'on_or_before', 'on_or_after'];
    default: return [];
  }
};

export const getFields = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fields = await ParcelFieldModel.find().sort({ createdAt: 1 });
    return res.status(200).json(fields);
  } catch (error) {
    next(error);
  }
};

export const createField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, label, type, required, values } = req.body;
    
    if (!name || !label || !type) {
      throw new AppError('Name, label, and type are required', 400, 'VALIDATION_ERROR');
    }

    const existing = await ParcelFieldModel.findOne({ name });
    if (existing) {
      throw new AppError(`Field with name ${name} already exists`, 400, 'VALIDATION_ERROR');
    }

    const operators = getOperatorsForType(type);
    
    const field = new ParcelFieldModel({
      name,
      label,
      type,
      required: required || false,
      values: type === 'enum' ? values || [] : [],
      operators,
      active: true
    });

    await field.save();
    return res.status(201).json(field);
  } catch (error) {
    next(error);
  }
};

export const updateField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { label, required, values, active } = req.body;

    const field = await ParcelFieldModel.findById(id);
    if (!field) throw new AppError('Field not found', 404, 'NOT_FOUND');

    if (label !== undefined) field.label = label;
    if (required !== undefined) field.required = required;
    if (active !== undefined) field.active = active;
    if (field.type === 'enum' && values !== undefined) {
      field.values = values;
    }

    await field.save();
    return res.status(200).json(field);
  } catch (error) {
    next(error);
  }
};

export const deleteField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await ParcelFieldModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Field deleted' });
  } catch (error) {
    next(error);
  }
};
