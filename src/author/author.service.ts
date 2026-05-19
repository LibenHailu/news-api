import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article } from '../article/entities/article.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';

export type DashboardItem = {
  title: string;
  createdAt: Date;
  totalViews: number;
};

export type PaginatedDashboard = {
  items: DashboardItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getDashboard(
    authorId: string,
    query: QueryDashboardDto,
  ): Promise<PaginatedDashboard> {
    const page = query.page ?? 1;
    const size = query.size ?? 10;
    const filter = {
      authorId: new Types.ObjectId(authorId),
      deletedAt: null,
    };

    const skip = (page - 1) * size;
    const [articles, total] = await Promise.all([
      this.articleModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.articleModel.countDocuments(filter).exec(),
    ]);

    const viewMap = await this.analyticsService.getTotalViewsByArticleIds(
      articles.map((a) => a._id),
    );

    const items: DashboardItem[] = articles.map((article) => ({
      title: article.title,
      createdAt: (article as Article & { createdAt?: Date }).createdAt!,
      totalViews: viewMap.get(String(article._id)) ?? 0,
    }));

    return {
      items,
      page,
      size,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / size),
    };
  }
}
