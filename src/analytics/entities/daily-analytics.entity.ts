import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type DailyAnalyticsDocument = HydratedDocument<DailyAnalytics>;

@Schema({
  collection: 'dailyanalytics',
  timestamps: false,
  versionKey: false,
})
export class DailyAnalytics {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Article',
    required: true,
    index: true,
  })
  articleId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  date: string;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  readCount: number;
}

export const DailyAnalyticsSchema =
  SchemaFactory.createForClass(DailyAnalytics);

DailyAnalyticsSchema.index({ articleId: 1, date: 1 }, { unique: true });
