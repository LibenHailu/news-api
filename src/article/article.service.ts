import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { UserService } from '../user/user.service';
import { isAuthor } from '../common/utils/role.util';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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

  async findAll() {
    return this.articleModel.find({ deletedAt: null }).exec();
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
