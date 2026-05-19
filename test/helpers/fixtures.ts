import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../src/user/entities/user.entity';
import { ArticleStatus } from '../../src/article/entities/article.entity';

export const PASSWORD_PLAIN = 'password123';

export async function hashPassword(plain = PASSWORD_PLAIN): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function createMockUser(overrides: Record<string, unknown> = {}) {
  const _id = (overrides._id as Types.ObjectId) ?? new Types.ObjectId();
  const doc = {
    _id,
    name: 'John Doe',
    email: 'john@example.com',
    password: overrides.password ?? 'hashed-password',
    role: UserRole.READER,
    createdAt: new Date('2026-05-19T10:00:00.000Z'),
    updatedAt: new Date('2026-05-19T10:00:00.000Z'),
    save: jest.fn(),
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
    toJSON() {
      return this.toObject();
    },
    ...overrides,
  };
  doc.save.mockResolvedValue(doc);
  return doc;
}

export function createMockArticle(overrides: Record<string, unknown> = {}) {
  const _id = (overrides._id as Types.ObjectId) ?? new Types.ObjectId();
  const authorId =
    (overrides.authorId as Types.ObjectId) ?? new Types.ObjectId();
  const doc = {
    _id,
    title: 'Test Article Title With Enough Length',
    content:
      'This is article content that is definitely longer than fifty characters for validation.',
    category: 'Tech',
    status: ArticleStatus.PUBLISHED,
    authorId,
    deletedAt: null as Date | null,
    createdAt: new Date('2026-05-19T11:00:00.000Z'),
    toObject() {
      return {
        _id: this._id,
        title: this.title,
        content: this.content,
        category: this.category,
        status: this.status,
        authorId: this.authorId,
        deletedAt: this.deletedAt,
        createdAt: this.createdAt,
      };
    },
    toJSON() {
      return this.toObject();
    },
    ...overrides,
  };
  return doc;
}
