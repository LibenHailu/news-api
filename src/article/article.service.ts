import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { Article, ArticleStatus } from './entities/article.entity';
import { UserService } from '../user/user.service';
import { isAuthor } from '../common/utils/role.util';
import { escapeRegex } from '../common/utils/regex.util';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

export type PaginatedArticles = {
  items: Article[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
    private readonly userService: UserService,
  ) {}

  async create(createArticleDto: CreateArticleDto, userId: string) {
    await this.assertAuthorFromDb(userId);
    const article = await this.articleModel.create({
      ...createArticleDto,
      authorId: new Types.ObjectId(userId),
    });
    return article;
  }

  async findAll(query: QueryArticlesDto): Promise<PaginatedArticles> {
    const page = query.page ?? 1;
    const size = query.size ?? 10;
    const filter: Record<string, unknown> = {
      deletedAt: null,
      status: ArticleStatus.PUBLISHED,
    };

    if (query.category?.trim()) {
      filter.category = query.category.trim();
    }

    if (query.q?.trim()) {
      filter.title = { $regex: escapeRegex(query.q.trim()), $options: 'i' };
    }

    if (query.author?.trim()) {
      const authorIds = await this.userService.findIdsByNamePartial(
        query.author,
      );
      if (authorIds.length === 0) {
        return { items: [], page, size, total: 0, totalPages: 0 };
      }
      filter.authorId = { $in: authorIds };
    }

    const skip = (page - 1) * size;
    const [items, total] = await Promise.all([
      this.articleModel
        .find(filter)
        .populate('authorId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.articleModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      page,
      size,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / size),
    };
  }

  async findByAuthor(authorId: string) {
    return this.articleModel
      .find({
        authorId: new Types.ObjectId(authorId),
        deletedAt: null,
      })
      .exec();
  }

  async findOne(id: string) {
    const article = await this.articleModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async update(id: string, updateArticleDto: UpdateArticleDto, userId: string) {
    await this.assertAuthorFromDb(userId);
    const article = await this.findOne(id);
    this.assertArticleOwner(article, userId);
    const updated = await this.articleModel
      .findByIdAndUpdate(id, updateArticleDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Article not found');
    }
    return updated;
  }

  async remove(id: string, userId: string) {
    await this.assertAuthorFromDb(userId);
    const article = await this.findOne(id);
    this.assertArticleOwner(article, userId);
    return this.articleModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }

  private async assertAuthorFromDb(userId: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!isAuthor(user.role)) {
      throw new ForbiddenException(
        'Only authors can create, update, or delete articles',
      );
    }
  }

  private assertArticleOwner(article: Article, userId: string): void {
    if (String(article.authorId) !== userId) {
      throw new ForbiddenException('You can only modify your own articles');
    }
  }
}
