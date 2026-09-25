import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../observability/logger';
import { BatchModel } from '../models/Batch';
import { RoutingDecisionModel } from '../models/RoutingDecision';
import { RuleSetModel } from '../models/RuleSet';
import { RoutingEngine } from '../routing/engine';
import { parcelSchema } from '../domain/parcel';

export const startBatchWorker = () => {
  const worker = new Worker(
    'batch-routing-queue',
    async (job: Job) => {
      const { batchId, parcels } = job.data;
      logger.info({ batchId, total: parcels.length }, 'Started processing batch chunk');

      const activeRuleSet = await RuleSetModel.findOne({ status: 'ACTIVE' }).lean();
      if (!activeRuleSet) {
        throw new Error('No active rule set found for batch processing');
      }

      const engine = new RoutingEngine(activeRuleSet as any);

      let successCount = 0;
      let failureCount = 0;

      for (const rawParcel of parcels) {
        try {
          const parcel = parcelSchema.parse(rawParcel);
          const decision = engine.evaluate(parcel);

          await RoutingDecisionModel.create({
            parcelId: parcel.id || 'unknown',
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
            requestId: job.id || 'batch',
            batchId,
          });

          successCount++;
        } catch (error) {
          logger.error({ error, parcelId: rawParcel.id }, 'Failed to process parcel in batch');
          failureCount++;
        }
      }

      // Update Batch progress
      await BatchModel.findOneAndUpdate(
        { batchId },
        {
          $inc: {
            processedCount: parcels.length,
            successCount,
            failureCount,
          },
        }
      );

      return { successCount, failureCount };
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 5, // Process 5 jobs concurrently
    }
  );

  worker.on('completed', async (job) => {
    logger.info({ jobId: job.id, batchId: job.data.batchId }, 'Batch chunk completed');
    
    // Check if entire batch is complete
    const batch = await BatchModel.findOne({ batchId: job.data.batchId });
    if (batch && batch.processedCount >= batch.totalCount) {
      batch.status = batch.failureCount === 0 ? 'COMPLETED' : 'PARTIAL_FAILURE';
      batch.completedAt = new Date();
      await batch.save();
    }
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Batch job failed');
  });

  return worker;
};
