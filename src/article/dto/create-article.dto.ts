export class CreateArticleDto {
  title: string;
  content: string;
  category: string;
  status: ArticleStatus;
  authorId: string;
  deletedAt: Date | null;
}

export enum ArticleStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
}
