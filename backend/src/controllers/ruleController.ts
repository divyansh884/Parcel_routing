import { Request, Response, NextFunction } from 'express';
import { RuleSetModel } from '../models/RuleSet';
import { RoutingDecisionModel } from '../models/RoutingDecision';
import { ruleSetSchema } from '../domain/rule';
import { AppError } from '../errors/AppError';
import { RoutingEngine } from '../routing/engine';
import { logger } from '../observability/logger';

export const getActiveRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeRuleSet = await RuleSetModel.findOne({ status: 'ACTIVE' });
    if (!activeRuleSet) {
      return res.status(404).json({ message: 'No active rules found' });
    }
    return res.status(200).json(activeRuleSet);
  } catch (error) {
    next(error);
  }
};

export const createDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedData = ruleSetSchema.parse(req.body);
    
    // Check if the version already exists
    const existingVersion = await RuleSetModel.findOne({ version: parsedData.version });
    if (existingVersion) {
      throw new AppError(`RuleSet version ${parsedData.version} already exists`, 409, 'VERSION_EXISTS');
    }

    // Validate duplicate rule IDs
    const ids = parsedData.rules.map(r => r.id);
    if (new Set(ids).size !== ids.length) {
      throw new AppError('Duplicate rule IDs found in RuleSet', 400, 'VALIDATION_ERROR');
    }

    const draft = new RuleSetModel({
      version: parsedData.version,
      status: 'DRAFT',
      rules: parsedData.rules,
      createdBy: 'admin_user', // Mocked, will use req.user in auth phase
    });

    await draft.save();

    return res.status(201).json(draft);
  } catch (error) {
    next(error);
  }
};

export const publishRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { version } = req.params;

    const draft = await RuleSetModel.findOne({ version: Number(version), status: 'DRAFT' });
    if (!draft) {
      throw new AppError(`Draft RuleSet version ${version} not found`, 404, 'NOT_FOUND');
    }

    // Demote current active to ROLLED_BACK or archive
    await RuleSetModel.updateMany({ status: 'ACTIVE' }, { status: 'ROLLED_BACK' });

    draft.status = 'ACTIVE';
    draft.publishedAt = new Date();
    draft.approvedBy = 'admin_user'; // Mocked
    await draft.save();

    // 🚀 Retroactively re-route all existing parcels using the new RuleSet
    logger.info(`RuleSet v${version} published. Initiating retro-active re-routing for all existing parcels...`);
    
    const engine = new RoutingEngine(draft.toObject());
    
    // Use a cursor to prevent memory exhaustion if millions of records exist
    const cursor = RoutingDecisionModel.find().cursor();
    
    let reRoutedCount = 0;
    
    for await (const doc of cursor) {
      // Reconstruct the raw parcel data from the stored document
      const parcelPayload = {
        id: doc.parcelId,
        weightKg: doc.weightKg,
        valueEur: doc.valueEur,
        destinationCountry: doc.destinationCountry,
        additionalAttributes: doc.additionalAttributes || {}
      };
      
      try {
        // Re-evaluate against the new active engine
        const newDecision = engine.evaluate(parcelPayload);
        
        const newRuleId = 'ruleId' in newDecision ? newDecision.ruleId : undefined;
        const newRuleVersion = 'ruleVersion' in newDecision ? newDecision.ruleVersion : undefined;

        // Check if the decision actually changed
        if (
          doc.status !== newDecision.status || 
          doc.department !== (newDecision as any).department ||
          doc.approvalType !== (newDecision as any).approvalType ||
          doc.ruleId !== newRuleId
        ) {
           doc.status = newDecision.status;
           doc.department = 'department' in newDecision ? newDecision.department : undefined;
           doc.approvalType = 'approvalType' in newDecision ? newDecision.approvalType : undefined;
           doc.ruleId = newRuleId;
           doc.ruleVersion = newRuleVersion;
           doc.reason = `[Retro-Routed by v${version} update] ${newDecision.reason}`;
           
           await doc.save();
           reRoutedCount++;
        }
      } catch (err) {
        logger.error({ err, parcelId: doc.parcelId }, 'Failed to retroactively route parcel');
      }
    }
    
    logger.info(`Retro-active routing complete. Updated ${reRoutedCount} existing parcels to new department/status.`);

    return res.status(200).json({ 
      ...draft.toObject(), 
      meta: { reRoutedCount } 
    });
  } catch (error) {
    next(error);
  }
};

export const publishDirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = req.body;
    
    // Find latest version
    const latest = await RuleSetModel.findOne().sort({ version: -1 });
    const nextVersion = latest ? latest.version + 1 : 1;

    // Demote current active to ROLLED_BACK
    await RuleSetModel.updateMany({ status: 'ACTIVE' }, { status: 'ROLLED_BACK' });

    // Create new ACTIVE rule set
    const activeRuleSet = new RuleSetModel({
      version: nextVersion,
      status: 'ACTIVE',
      rules: rules,
      createdBy: 'admin_user', // Mocked
      publishedAt: new Date(),
      approvedBy: 'admin_user'
    });
    
    await activeRuleSet.save();

    // Retroactively re-route all existing parcels
    logger.info(`RuleSet v${nextVersion} published directly. Initiating retro-active re-routing...`);
    const engine = new RoutingEngine(activeRuleSet.toObject());
    const cursor = RoutingDecisionModel.find().cursor();
    
    let reRoutedCount = 0;
    for await (const doc of cursor) {
      const parcelPayload = {
        id: doc.parcelId,
        weightKg: doc.weightKg,
        valueEur: doc.valueEur,
        destinationCountry: doc.destinationCountry,
        additionalAttributes: doc.additionalAttributes || {}
      };
      
      try {
        const newDecision = engine.evaluate(parcelPayload);
        const newRuleId = 'ruleId' in newDecision ? newDecision.ruleId : undefined;
        const newRuleVersion = 'ruleVersion' in newDecision ? newDecision.ruleVersion : undefined;

        if (
          doc.status !== newDecision.status || 
          doc.department !== (newDecision as any).department ||
          doc.approvalType !== (newDecision as any).approvalType ||
          doc.ruleId !== newRuleId
        ) {
           doc.status = newDecision.status;
           doc.department = 'department' in newDecision ? newDecision.department : undefined;
           doc.approvalType = 'approvalType' in newDecision ? newDecision.approvalType : undefined;
           doc.ruleId = newRuleId;
           doc.ruleVersion = newRuleVersion;
           doc.reason = `[Retro-Routed by v${nextVersion} update] ${newDecision.reason}`;
           
           if (!doc.insuranceDetails && doc.get('insuranceDetails')) {
             doc.set('insuranceDetails', doc.get('insuranceDetails'));
             doc.markModified('insuranceDetails');
           }
           
           await doc.save();
           reRoutedCount++;
        }
      } catch (err) {
        logger.error({ err, parcelId: doc.parcelId }, 'Failed to retroactively route parcel');
      }
    }
    
    logger.info(`Retro-active routing complete. Updated ${reRoutedCount} existing parcels.`);
    return res.status(200).json({ ...activeRuleSet.toObject(), reRoutedCount });
  } catch (error) {
    next(error);
  }
};
