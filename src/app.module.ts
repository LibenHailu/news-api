import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ArticleModule } from './article/article.module';
import { LogModule } from './log/log.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthorModule } from './author/author.module';
import authConfig from './auth/auth.config';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [authConfig],
    }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    UserModule,
    AuthModule,
    ArticleModule,
    LogModule,
    AnalyticsModule,
    AuthorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
