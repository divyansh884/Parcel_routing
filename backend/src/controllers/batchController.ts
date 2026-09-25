import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { BatchModel } from '../models/Batch';
import { batchQueue } from '../queues/batchQueue';
import { AppError } from '../errors/AppError';

export const uploadBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parcels = req.body; // Expecting a JSON array for the assessment
    if (!Array.isArray(parcels)) {
      throw new AppError('Request body must be an array of parcels', 400, 'VALIDATION_ERROR');
    }

    if (parcels.length === 0) {
      throw new AppError('Batch cannot be empty', 400, 'VALIDATION_ERROR');
    }

    if (parcels.length > 100000) {
      throw new AppError('Batch exceeds maximum allowed size (100,000)', 413, 'PAYLOAD_TOO_LARGE');
    }

    const batchId = `BATCH-${randomUUID()}`;
    const filename = req.headers['x-filename'] as string || 'upload.json';

    const batch = new BatchModel({
      batchId,
      filename,
      status: 'PROCESSING',
      totalCount: parcels.length,
      createdBy: 'operator_user', // Mocked RBAC
    });

    await batch.save();

    // Chunk the parcels into smaller jobs to avoid blocking redis/memory
    const CHUNK_SIZE = 500;
    for (let i = 0; i < parcels.length; i += CHUNK_SIZE) {
      const chunk = parcels.slice(i, i + CHUNK_SIZE);
      await batchQueue.add('process-chunk', {
        batchId,
        parcels: chunk,
      });
    }

    return res.status(202).json({
      batchId,
      status: 'PROCESSING',
      totalCount: parcels.length,
      message: 'Batch is being processed in the background.',
    });
  } catch (error) {
    next(error);
  }
};

export const getBatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { batchId } = req.params;
    const batch = await BatchModel.findOne({ batchId });

    if (!batch) {
      throw new AppError('Batch not found', 404, 'NOT_FOUND');
    }

    return res.status(200).json(batch);
  } catch (error) {
    next(error);
  }
};
