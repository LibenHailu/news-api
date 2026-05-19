import { Module } from '@nestjs/common';
import { ReadLogService } from './log.service';
import { ReadLog, ReadLogSchema } from './entities/log.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReadLog.name, schema: ReadLogSchema }]),
  ],
  providers: [ReadLogService],
  exports: [ReadLogService],
})
export class LogModule {}
