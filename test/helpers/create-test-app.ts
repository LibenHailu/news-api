import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../src/user/entities/user.entity';
import { Article, ArticleSchema } from '../../src/article/entities/article.entity';
import { ReadLog, ReadLogSchema } from '../../src/log/entities/log.entity';
import {
  DailyAnalytics,
  DailyAnalyticsSchema,
} from '../../src/analytics/entities/daily-analytics.entity';
import { UserModule } from '../../src/user/user.module';
import { AuthModule } from '../../src/auth/auth.module';
import { ArticleModule } from '../../src/article/article.module';
import { LogModule } from '../../src/log/log.module';
import { AuthorModule } from '../../src/author/author.module';
import { AnalyticsModule } from '../../src/analytics/analytics.module';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import authConfig from '../../src/auth/auth.config';
import { ResponseInterceptor } from '../../src/common/intercepters/response';
import { SanitizeInterceptor } from '../../src/common/filters/sanitizer';
import { MongooseExceptionFilter } from '../../src/common/filters/mongoose-exception.filter';
import { TestAnalyticsModule } from './test-analytics.module';
import { mockQuery, mockCountQuery } from './mock-query';

export type ModelMocks = {
  userModel: Record<string, jest.Mock>;
  articleModel: Record<string, jest.Mock>;
  readLogModel: Record<string, jest.Mock>;
  dailyAnalyticsModel: Record<string, jest.Mock>;
};

export function createDefaultModelMocks(): ModelMocks {
  return {
    userModel: {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    },
    articleModel: {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      bulkWrite: jest.fn(),
    },
    readLogModel: {
      create: jest.fn().mockResolvedValue({}),
    },
    dailyAnalyticsModel: {
      aggregate: jest.fn().mockReturnValue(mockQuery([])),
      bulkWrite: jest.fn().mockResolvedValue(undefined),
    },
  };
}

export async function createTestApp(
  mocks: ModelMocks = createDefaultModelMocks(),
): Promise<{ app: INestApplication; module: TestingModule; mocks: ModelMocks }> {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

  const moduleFixture = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [authConfig] }),
      MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
        { name: Article.name, schema: ArticleSchema },
        { name: ReadLog.name, schema: ReadLogSchema },
        { name: DailyAnalytics.name, schema: DailyAnalyticsSchema },
      ]),
      UserModule,
      AuthModule,
      ArticleModule,
      LogModule,
      AuthorModule,
    ],
    controllers: [AppController],
    providers: [AppService],
  })
    .overrideModule(AnalyticsModule)
    .useModule(TestAnalyticsModule)
    .overrideProvider(getModelToken(User.name))
    .useValue(mocks.userModel)
    .overrideProvider(getModelToken(Article.name))
    .useValue(mocks.articleModel)
    .overrideProvider(getModelToken(ReadLog.name))
    .useValue(mocks.readLogModel)
    .overrideProvider(getModelToken(DailyAnalytics.name))
    .useValue(mocks.dailyAnalyticsModel)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new SanitizeInterceptor(),
  );
  app.useGlobalFilters(new MongooseExceptionFilter());
  await app.init();

  return { app, module: moduleFixture, mocks };
}

export { mockQuery, mockCountQuery };
