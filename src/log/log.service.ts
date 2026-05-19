import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReadLog } from './entities/log.entity';

@Injectable()
export class ReadLogService {
  constructor(
    @InjectModel(ReadLog.name) private readLogModel: Model<ReadLog>,
  ) {}

  async recordRead(articleId: string, readerId?: string | null) {
    return this.readLogModel.create({
      articleId: new Types.ObjectId(articleId),
      readerId: readerId ? new Types.ObjectId(readerId) : null,
      readAt: new Date(),
    });
  }
}
