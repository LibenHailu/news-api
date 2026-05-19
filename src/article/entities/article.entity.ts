import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type ArticleDocument = HydratedDocument<Article>;

export enum ArticleStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
}

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class Article {
  @Prop({
    type: String,
    required: [true, 'Title is required.'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character long.'],
    maxlength: [150, 'Title cannot exceed 150 characters.'],
  })
  title: string;

  @Prop({
    type: String,
    required: [true, 'Content is required.'],
    minlength: [50, 'Content must contain a minimum of 50 characters.'],
  })
  content: string;

  @Prop({
    type: String,
    required: [true, 'Category field is required.'],
    trim: true,
  })
  category: string;

  @Prop({
    type: String,
    enum: {
      values: Object.values(ArticleStatus),
      message: 'Status must be either Draft or Published.',
    },
    default: ArticleStatus.DRAFT,
  })
  status: ArticleStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: [true, 'AuthorId foreign key relation is required.'],
  })
  authorId: Types.ObjectId;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt: Date | null;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
