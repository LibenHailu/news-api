import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DailyAnalytics } from './entities/daily-analytics.entity';
import { ReadLog } from '../log/entities/log.entity';
import { getGmtDayRange } from '../common/utils/date.util';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(DailyAnalytics.name)
    private dailyAnalyticsModel: Model<DailyAnalytics>,
    @InjectModel(ReadLog.name) private readLogModel: Model<ReadLog>,
  ) {}

  async aggregateForDate(dateKey: string): Promise<number> {
    const { start, end } = getGmtDayRange(dateKey);

    const grouped = await this.readLogModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { readAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$articleId', count: { $sum: 1 } } },
    ]);

    if (grouped.length === 0) {
      this.logger.log(`No reads to aggregate for ${dateKey} (GMT)`);
      return 0;
    }

    const ops = grouped.map((row) => ({
      updateOne: {
        filter: { articleId: row._id, date: dateKey },
        update: { $set: { readCount: row.count } },
        upsert: true,
      },
    }));

    await this.dailyAnalyticsModel.bulkWrite(ops);
    this.logger.log(
      `Aggregated ${grouped.length} article(s) for ${dateKey} (GMT)`,
    );
    return grouped.length;
  }

  async getTotalViewsByArticleIds(
    articleIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (articleIds.length === 0) {
      return map;
    }

    const rows = await this.dailyAnalyticsModel.aggregate<{
      _id: Types.ObjectId;
      totalViews: number;
    }>([
      { $match: { articleId: { $in: articleIds } } },
      { $group: { _id: '$articleId', totalViews: { $sum: '$readCount' } } },
    ]);

    for (const row of rows) {
      map.set(String(row._id), row.totalViews);
    }
    return map;
  }
}
