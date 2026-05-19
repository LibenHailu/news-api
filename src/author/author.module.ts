import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from '../article/entities/article.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorController } from './author.controller';
import { AuthorService } from './author.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    AuthModule,
    AnalyticsModule,
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
  ],
  controllers: [AuthorController],
  providers: [AuthorService, JwtAuthGuard, RolesGuard],
})
export class AuthorModule {}
