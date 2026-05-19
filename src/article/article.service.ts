import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
  ) {}

  async create(createArticleDto: CreateArticleDto) {
    const article = await this.articleModel.create(createArticleDto);
    return article;
  }

  async findAll() {
    const allArticles = await this.articleModel.find();
    return allArticles;
  }

  async findOne(id: number) {
    const article = await this.articleModel.findOne({ where: { id: id } });
    if (article) {
      return article;
    }
    throw new NotFoundException('Article not found');
  }

  update(id: number, updateArticleDto: UpdateArticleDto) {
    return `This action updates a #${id} article`;
    return this.articleModel.findByIdAndUpdate(id, updateArticleDto, {
      new: true,
    });
  }

  remove(id: number) {
    return this.articleModel.findByIdAndDelete(id);
  }
}
