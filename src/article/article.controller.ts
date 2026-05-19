import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/entities/user.entity';
import type { JwtPayloadUser } from '../auth/types/jwt-payload.type';

@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR)
  create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.articleService.create(createArticleDto, user.userId);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR)
  findMine(@CurrentUser() user: JwtPayloadUser) {
    return this.articleService.findByAuthor(user.userId);
  }

  @Get()
  findAll() {
    return this.articleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articleService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR)
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.articleService.update(id, updateArticleDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.articleService.remove(id, user.userId);
  }
}
