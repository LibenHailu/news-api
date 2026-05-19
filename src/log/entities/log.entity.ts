import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type ReadLogDocument = HydratedDocument<ReadLog>;

@Schema({
  collection: 'readlogs',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class ReadLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Article',
    required: true,
    index: true,
  })
  articleId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  readerId: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  readAt: Date;
}

export const ReadLogSchema = SchemaFactory.createForClass(ReadLog);
