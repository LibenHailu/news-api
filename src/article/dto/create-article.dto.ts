import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ArticleStatus } from '../entities/article.entity';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsString()
  @MinLength(50)
  content: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(ArticleStatus)
  status?: ArticleStatus = ArticleStatus.DRAFT;
}
