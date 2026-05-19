import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import {
  DailyAnalytics,
  DailyAnalyticsSchema,
} from './entities/daily-analytics.entity';
import { ReadLog, ReadLogSchema } from '../log/entities/log.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from './analytics.processor';
import { AnalyticsScheduler } from './analytics.scheduler';
import { ANALYTICS_QUEUE } from './analytics.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ANALYTICS_QUEUE,
      connection: {
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    MongooseModule.forFeature([
      { name: DailyAnalytics.name, schema: DailyAnalyticsSchema },
      { name: ReadLog.name, schema: ReadLogSchema },
    ]),
  ],
  providers: [AnalyticsService, AnalyticsProcessor, AnalyticsScheduler],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
