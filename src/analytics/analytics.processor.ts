import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AnalyticsService } from './analytics.service';
import { ANALYTICS_QUEUE } from './analytics.constants';

export type AggregateDailyJobData = {
  dateKey: string;
};

@Processor(ANALYTICS_QUEUE)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly analyticsService: AnalyticsService) {
    super();
  }

  async process(job: Job<AggregateDailyJobData>): Promise<void> {
    this.logger.log(
      `Processing daily analytics job ${job.id} for ${job.data.dateKey}`,
    );
    await this.analyticsService.aggregateForDate(job.data.dateKey);
  }
}
