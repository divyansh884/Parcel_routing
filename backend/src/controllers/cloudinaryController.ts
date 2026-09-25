import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

export const generateSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
      throw new AppError('Cloudinary is not configured in backend environment.', 500, 'SYSTEM_ERROR');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Cloudinary signature parameters. 
    // We can allow frontend to dictate folder, or enforce it here.
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: 'parcel-routing-insurance'
      },
      env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      timestamp,
      signature,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      folder: 'parcel-routing-insurance'
    });
  } catch (error) {
    next(error);
  }
};
