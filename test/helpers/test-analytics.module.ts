import { Module } from '@nestjs/common';
import { AnalyticsService } from '../../src/analytics/analytics.service';

export const mockAnalyticsService = {
  aggregateForDate: jest.fn().mockResolvedValue(0),
  getTotalViewsByArticleIds: jest.fn().mockResolvedValue(new Map()),
};

@Module({
  providers: [
    { provide: AnalyticsService, useValue: mockAnalyticsService },
  ],
  exports: [AnalyticsService],
})
export class TestAnalyticsModule {}
