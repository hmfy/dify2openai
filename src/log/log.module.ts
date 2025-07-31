import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogService } from './log.service';
import { LogController } from './log.controller';
import { CallLog } from './entities/call-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog])],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}