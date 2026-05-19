import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { QueryMyArticlesDto } from './dto/query-my-articles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/entities/user.entity';
import type { JwtPayloadUser } from '../auth/types/jwt-payload.type';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR)
  create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.articleService.create(createArticleDto, user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR)
  findMine(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: QueryMyArticlesDto,
  ) {
    return this.articleService.findMyArticles(user.userId, query);
  }

  @Get()
  findAll(@Query() query: QueryArticlesDto) {
    return this.articleService.findAll(query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  readArticle(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayloadUser | null,
  ) {
    return this.articleService.readArticle(id, user?.userId ?? null);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR)
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.articleService.update(id, updateArticleDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.articleService.remove(id, user.userId);
  }
}
