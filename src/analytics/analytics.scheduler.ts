import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ANALYTICS_QUEUE } from './analytics.constants';
import { getYesterdayGmtDateKey } from '../common/utils/date.util';

@Injectable()
export class AnalyticsScheduler {
  private readonly logger = new Logger(AnalyticsScheduler.name);

  constructor(
    @InjectQueue(ANALYTICS_QUEUE) private readonly analyticsQueue: Queue,
  ) {}

  /** Every day at 00:05 GMT — queue aggregation for yesterday. */
  @Cron('5 0 * * *', { timeZone: 'GMT' })
  async scheduleDailyAggregation(): Promise<void> {
    const dateKey = getYesterdayGmtDateKey();
    await this.analyticsQueue.add(
      'aggregate-daily',
      { dateKey },
      {
        jobId: `aggregate-${dateKey}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log(`Queued daily analytics for ${dateKey} (GMT)`);
  }
}
