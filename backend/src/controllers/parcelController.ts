import { Request, Response, NextFunction } from 'express';
import { parcelSchema } from '../domain/parcel';
import { RoutingEngine } from '../routing/engine';
import { RuleSetModel } from '../models/RuleSet';
import { RoutingDecisionModel } from '../models/RoutingDecision';
import { AppError } from '../errors/AppError';
import { randomUUID } from 'crypto';

export const routeParcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parcel = parcelSchema.parse(req.body);
    const requestId = req.id || randomUUID(); // pino-http assigns string id

    // Load active rule set
    const activeRuleSet = await RuleSetModel.findOne({ status: 'ACTIVE' });
    if (!activeRuleSet) {
      throw new AppError('No active routing rules found', 500, 'SYSTEM_ERROR');
    }

    // Evaluate
    const engine = new RoutingEngine(activeRuleSet.toObject());
    const decision = engine.evaluate(parcel);

    // Persist Decision
    const decisionRecord = new RoutingDecisionModel({
      parcelId: parcel.id,
      weightKg: parcel.weightKg,
      valueEur: parcel.valueEur,
      destinationCountry: parcel.destinationCountry,
      additionalAttributes: parcel.attributes,
      status: decision.status,
      department: 'department' in decision ? decision.department : undefined,
      approvalType: 'approvalType' in decision ? decision.approvalType : undefined,
      ruleId: 'ruleId' in decision ? decision.ruleId : undefined,
      ruleVersion: 'ruleVersion' in decision ? decision.ruleVersion : undefined,
      reason: decision.reason,
      requestId: requestId,
    });

    await decisionRecord.save();

    return res.status(200).json(decision);
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pending = await RoutingDecisionModel.find({ status: 'PENDING_APPROVAL' }).sort({ createdAt: -1 });
    return res.status(200).json(pending);
  } catch (error) {
    next(error);
  }
};

export const approveDecision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { insuranceDetails } = req.body;
    
    const decision = await RoutingDecisionModel.findById(id);
    if (!decision) {
      throw new AppError('Routing decision not found', 404, 'NOT_FOUND');
    }

    if (decision.status !== 'PENDING_APPROVAL') {
      throw new AppError('Decision is not pending approval', 400, 'INVALID_STATE');
    }

    decision.status = 'ROUTED';
    decision.reason = decision.reason + ' (Approved by Auditor)';
    
    if (insuranceDetails) {
      decision.set('insuranceDetails', {
        policyNumber: insuranceDetails.policyNumber || '',
        provider: insuranceDetails.provider || '',
        coverageAmount: insuranceDetails.coverageAmount || 0,
        documentUrl: insuranceDetails.documentUrl || '',
      });
      decision.markModified('insuranceDetails');
    }
    
    await decision.save();

    return res.status(200).json(decision);
  } catch (error) {
    next(error);
  }
};

export const getAllParcels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    let query: any = {};
    
    if (search && typeof search === 'string' && search.trim() !== '') {
      query = {
        $or: [
          { parcelId: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
          { destinationCountry: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const parcels = await RoutingDecisionModel.find(query).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json(parcels);
  } catch (error) {
    next(error);
  }
};

export const updateParcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parcelPayload = parcelSchema.parse(req.body);

    const decisionRecord = await RoutingDecisionModel.findById(id);
    if (!decisionRecord) {
      throw new AppError('Parcel not found', 404, 'NOT_FOUND');
    }

    const activeRuleSet = await RuleSetModel.findOne({ status: 'ACTIVE' });
    if (!activeRuleSet) {
      throw new AppError('No active routing rules found', 500, 'SYSTEM_ERROR');
    }

    // Re-evaluate
    const engine = new RoutingEngine(activeRuleSet.toObject());
    const decision = engine.evaluate(parcelPayload);

    // Update Record
    decisionRecord.parcelId = parcelPayload.id;
    decisionRecord.weightKg = parcelPayload.weightKg;
    decisionRecord.valueEur = parcelPayload.valueEur;
    decisionRecord.destinationCountry = parcelPayload.destinationCountry;
    decisionRecord.additionalAttributes = parcelPayload.attributes;
    
    // Preserve existing insurance details so Admin updates don't wipe it
    if (!decisionRecord.insuranceDetails && decisionRecord.get('insuranceDetails')) {
      decisionRecord.insuranceDetails = decisionRecord.get('insuranceDetails');
    }
    
    decisionRecord.status = decision.status;
    decisionRecord.department = 'department' in decision ? decision.department : undefined;
    decisionRecord.approvalType = 'approvalType' in decision ? decision.approvalType : undefined;
    decisionRecord.ruleId = 'ruleId' in decision ? decision.ruleId : undefined;
    decisionRecord.ruleVersion = 'ruleVersion' in decision ? decision.ruleVersion : undefined;
    decisionRecord.reason = `[Admin Updated] ${decision.reason}`;

    await decisionRecord.save();
    return res.status(200).json(decisionRecord);
  } catch (error) {
    next(error);
  }
};

export const deleteParcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const decision = await RoutingDecisionModel.findByIdAndDelete(id);
    if (!decision) {
      throw new AppError('Parcel not found', 404, 'NOT_FOUND');
    }
    return res.status(200).json({ message: 'Parcel deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateInsurance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { insuranceDetails } = req.body;

    const decision = await RoutingDecisionModel.findById(id);
    if (!decision) {
      throw new AppError('Parcel not found', 404, 'NOT_FOUND');
    }

    if (!insuranceDetails) {
      throw new AppError('Insurance details are required', 400, 'VALIDATION_ERROR');
    }

    decision.set('insuranceDetails', {
      policyNumber: insuranceDetails.policyNumber || '',
      provider: insuranceDetails.provider || '',
      coverageAmount: insuranceDetails.coverageAmount || 0,
      documentUrl: insuranceDetails.documentUrl || decision.insuranceDetails?.documentUrl || '',
    });
    decision.markModified('insuranceDetails');

    // If it was PENDING_APPROVAL and this is called, maybe it should be approved?
    // The user said auditor can modify it. So it just updates it.
    await decision.save();

    return res.status(200).json(decision);
  } catch (error) {
    next(error);
  }
};
