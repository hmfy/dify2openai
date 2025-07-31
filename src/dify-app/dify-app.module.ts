import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DifyAppService } from './dify-app.service';
import { DifyAppController } from './dify-app.controller';
import { DifyApp } from './entities/dify-app.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DifyApp])],
  controllers: [DifyAppController],
  providers: [DifyAppService],
  exports: [DifyAppService],
})
export class DifyAppModule {}
