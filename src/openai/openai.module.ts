import { Module } from '@nestjs/common';
import { OpenaiController } from './openai.controller';
import { OpenaiService } from './openai.service';
import { DifyAppModule } from '../dify-app/dify-app.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [DifyAppModule, LogModule],
  controllers: [OpenaiController],
  providers: [OpenaiService],
})
export class OpenaiModule {}