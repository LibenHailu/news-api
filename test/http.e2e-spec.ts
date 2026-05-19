import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { Types } from 'mongoose';
import {
  createTestApp,
  createDefaultModelMocks,
  mockQuery,
  mockCountQuery,
} from './helpers/create-test-app';
import {
  createMockUser,
  createMockArticle,
  hashPassword,
  PASSWORD_PLAIN,
} from './helpers/fixtures';
import { UserRole } from '../src/user/entities/user.entity';
import { ArticleStatus } from '../src/article/entities/article.entity';
import { mockAnalyticsService } from './helpers/test-analytics.module';

describe('HTTP API (e2e, mocked database)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const mocks = createDefaultModelMocks();

  const authorId = new Types.ObjectId();
  const readerId = new Types.ObjectId();
  const articleId = new Types.ObjectId();

  beforeAll(async () => {
    const testApp = await createTestApp(mocks);
    app = testApp.app;
    jwtService = testApp.module.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.getTotalViewsByArticleIds.mockResolvedValue(
      new Map(),
    );
  });

  function authorToken() {
    return jwtService.sign({
      sub: String(authorId),
      email: 'author@test.com',
      role: UserRole.AUTHOR,
    });
  }

  function readerToken() {
    return jwtService.sign({
      sub: String(readerId),
      email: 'reader@test.com',
      role: UserRole.READER,
    });
  }

  describe('App', () => {
    it('GET /', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            success: true,
            data: 'Hello World!',
          });
        });
    });
  });

  describe('Users', () => {
  const user = createMockUser({
    _id: readerId,
    email: 'new@test.com',
    role: UserRole.READER,
  });

    it('POST /users creates a user', async () => {
      mocks.userModel.findOne.mockReturnValue(mockQuery(null));
      mocks.userModel.create.mockResolvedValue(user);

      const res = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'new@test.com',
          password: PASSWORD_PLAIN,
          role: UserRole.READER,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('new@test.com');
      expect(res.body.data.password).toBeUndefined();
    });

    it('POST /users returns 409 for duplicate email', async () => {
      mocks.userModel.findOne.mockReturnValue(mockQuery(user));

      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'new@test.com',
          password: PASSWORD_PLAIN,
          role: UserRole.READER,
        })
        .expect(409);
    });

    it('GET /users returns all users', async () => {
      mocks.userModel.find.mockResolvedValue([user]);

      const res = await request(app.getHttpServer()).get('/users').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].password).toBeUndefined();
    });

    it('GET /users/:id returns one user', async () => {
      mocks.userModel.findById.mockReturnValue(mockQuery(user));

      const res = await request(app.getHttpServer())
        .get(`/users/${readerId}`)
        .expect(200);

      expect(res.body.data._id).toBe(String(readerId));
    });

    it('GET /users/:id returns 404 when missing', async () => {
      mocks.userModel.findById.mockReturnValue(mockQuery(null));

      await request(app.getHttpServer())
        .get(`/users/${new Types.ObjectId()}`)
        .expect(404);
    });

    it('PATCH /users/:id updates a user', async () => {
      const updated = createMockUser({ _id: readerId, name: 'Jane Doe' });
      mocks.userModel.findByIdAndUpdate.mockReturnValue(mockQuery(updated));

      const res = await request(app.getHttpServer())
        .patch(`/users/${readerId}`)
        .send({ name: 'Jane Doe' })
        .expect(200);

      expect(res.body.data.name).toBe('Jane Doe');
    });

    it('DELETE /users/:id removes a user', async () => {
      mocks.userModel.findByIdAndDelete.mockReturnValue(mockQuery(user));

      await request(app.getHttpServer())
        .delete(`/users/${readerId}`)
        .expect(200);
    });
  });

  describe('Auth', () => {
    it('POST /auth/login returns access_token', async () => {
      const hashed = await hashPassword();
      const user = createMockUser({
        email: 'login@test.com',
        password: hashed,
        role: UserRole.READER,
      });
      mocks.userModel.findOne.mockReturnValue(mockQuery(user));

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@test.com', password: PASSWORD_PLAIN })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
    });

    it('POST /auth/login returns 401 for invalid credentials', async () => {
      mocks.userModel.findOne.mockReturnValue(mockQuery(null));

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@test.com', password: PASSWORD_PLAIN })
        .expect(401);
    });
  });

  describe('Articles', () => {
    const publishedArticle = createMockArticle({
      _id: articleId,
      authorId,
      status: ArticleStatus.PUBLISHED,
    });

    const deletedArticle = createMockArticle({
      _id: articleId,
      authorId,
      deletedAt: new Date(),
      status: ArticleStatus.PUBLISHED,
    });

    it('GET /articles returns paginated published articles', async () => {
      mocks.articleModel.find.mockReturnValue(mockQuery([publishedArticle]));
      mocks.articleModel.countDocuments.mockReturnValue(mockCountQuery(1));

      const res = await request(app.getHttpServer())
        .get('/articles?page=1&size=10')
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.page).toBe(1);
    });

    it('GET /articles supports category filter', async () => {
      mocks.articleModel.find.mockReturnValue(mockQuery([]));
      mocks.articleModel.countDocuments.mockReturnValue(mockCountQuery(0));

      await request(app.getHttpServer())
        .get('/articles?category=Tech')
        .expect(200);

      expect(mocks.articleModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Tech' }),
      );
    });

    it('GET /articles/:id reads article and logs guest read', async () => {
      mocks.articleModel.findById.mockReturnValue(
        mockQuery(publishedArticle),
      );

      const res = await request(app.getHttpServer())
        .get(`/articles/${articleId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(publishedArticle.title);
      expect(mocks.readLogModel.create).toHaveBeenCalled();
      expect(mocks.readLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          readerId: null,
        }),
      );
    });

    it('GET /articles/:id logs reader id when authenticated', async () => {
      mocks.articleModel.findById.mockReturnValue(
        mockQuery(publishedArticle),
      );
      mocks.userModel.findById.mockReturnValue(
        mockQuery(createMockUser({ _id: readerId, role: UserRole.READER })),
      );

      await request(app.getHttpServer())
        .get(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${readerToken()}`)
        .expect(200);

      expect(mocks.readLogModel.create).toHaveBeenCalled();
      const createArg = mocks.readLogModel.create.mock.calls[0][0];
      expect(createArg.readerId).toBeInstanceOf(Types.ObjectId);
    });

    it('GET /articles/:id returns success false when deleted', async () => {
      mocks.articleModel.findById.mockReturnValue(mockQuery(deletedArticle));

      const res = await request(app.getHttpServer())
        .get(`/articles/${articleId}`)
        .expect(200);

      expect(res.body).toEqual({
        success: false,
        message: 'News article no longer available',
      });
      expect(mocks.readLogModel.create).not.toHaveBeenCalled();
    });

    it('POST /articles creates article for author', async () => {
      const author = createMockUser({ _id: authorId, role: UserRole.AUTHOR });
      mocks.userModel.findById.mockReturnValue(mockQuery(author));
      mocks.articleModel.create.mockResolvedValue(publishedArticle);

      const res = await request(app.getHttpServer())
        .post('/articles')
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({
          title: 'Test Article Title With Enough Length',
          content:
            'This is article content that is definitely longer than fifty characters for validation.',
          category: 'Tech',
          status: ArticleStatus.PUBLISHED,
        })
        .expect(201);

      expect(res.body.data.title).toBe(publishedArticle.title);
    });

    it('POST /articles returns 403 for reader', async () => {
      const reader = createMockUser({ _id: readerId, role: UserRole.READER });
      mocks.userModel.findById.mockReturnValue(mockQuery(reader));

      await request(app.getHttpServer())
        .post('/articles')
        .set('Authorization', `Bearer ${readerToken()}`)
        .send({
          title: 'Test Article Title With Enough Length',
          content:
            'This is article content that is definitely longer than fifty characters for validation.',
          category: 'Tech',
        })
        .expect(403);
    });

    it('GET /articles/me returns author articles paginated', async () => {
      const draft = createMockArticle({
        authorId,
        status: ArticleStatus.DRAFT,
      });
      mocks.userModel.findById.mockReturnValue(
        mockQuery(createMockUser({ _id: authorId, role: UserRole.AUTHOR })),
      );
      mocks.articleModel.find.mockReturnValue(mockQuery([draft]));
      mocks.articleModel.countDocuments.mockReturnValue(mockCountQuery(1));

      const res = await request(app.getHttpServer())
        .get('/articles/me?page=1&size=10')
        .set('Authorization', `Bearer ${authorToken()}`)
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].displayStatus).toBe(ArticleStatus.DRAFT);
    });

    it('PATCH /articles/:id updates own article', async () => {
      const author = createMockUser({ _id: authorId, role: UserRole.AUTHOR });
      const updated = createMockArticle({
        _id: articleId,
        authorId,
        title: 'Updated Title With Enough Length Here',
      });
      mocks.userModel.findById.mockReturnValue(mockQuery(author));
      mocks.articleModel.findOne.mockReturnValue(mockQuery(publishedArticle));
      mocks.articleModel.findByIdAndUpdate.mockReturnValue(mockQuery(updated));

      const res = await request(app.getHttpServer())
        .patch(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({ title: 'Updated Title With Enough Length Here' })
        .expect(200);

      expect(res.body.data.title).toBe('Updated Title With Enough Length Here');
    });

    it('DELETE /articles/:id soft-deletes own article', async () => {
      const author = createMockUser({ _id: authorId, role: UserRole.AUTHOR });
      const softDeleted = createMockArticle({
        _id: articleId,
        authorId,
        deletedAt: new Date(),
      });
      mocks.userModel.findById.mockReturnValue(mockQuery(author));
      mocks.articleModel.findOne.mockReturnValue(mockQuery(publishedArticle));
      mocks.articleModel.findByIdAndUpdate.mockReturnValue(
        mockQuery(softDeleted),
      );

      await request(app.getHttpServer())
        .delete(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${authorToken()}`)
        .expect(200);
    });
  });

  describe('Author dashboard', () => {
    it('GET /author/dashboard returns metrics', async () => {
      const author = createMockUser({ _id: authorId, role: UserRole.AUTHOR });
      const article = createMockArticle({ _id: articleId, authorId });
      mocks.userModel.findById.mockReturnValue(mockQuery(author));
      mocks.articleModel.find.mockReturnValue(mockQuery([article]));
      mocks.articleModel.countDocuments.mockReturnValue(mockCountQuery(1));
      mockAnalyticsService.getTotalViewsByArticleIds.mockResolvedValue(
        new Map([[String(articleId), 25]]),
      );

      const res = await request(app.getHttpServer())
        .get('/author/dashboard?page=1&size=10')
        .set('Authorization', `Bearer ${authorToken()}`)
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]).toMatchObject({
        title: article.title,
        totalViews: 25,
      });
      expect(res.body.data.items[0].createdAt).toBeDefined();
    });

    it('GET /author/dashboard returns 403 for reader', async () => {
      const reader = createMockUser({ _id: readerId, role: UserRole.READER });
      mocks.userModel.findById.mockReturnValue(mockQuery(reader));

      await request(app.getHttpServer())
        .get('/author/dashboard')
        .set('Authorization', `Bearer ${readerToken()}`)
        .expect(403);
    });
  });
});
