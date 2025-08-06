import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { DifyAppModule } from './dify-app/dify-app.module';
import { OpenaiModule } from './openai/openai.module';
import { LogModule } from './log/log.module';
import { ChatModule } from './chat/chat.module';

import { User } from './auth/entities/user.entity';
import { DifyApp } from './dify-app/entities/dify-app.entity';
import { CallLog } from './log/entities/call-log.entity';
import { ChatSession } from './chat/entities/chat-session.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';

const imports = [
  TypeOrmModule.forRoot({
    type: 'sqlite',
    database: 'dify-manager.db',
    entities: [User, DifyApp, CallLog, ChatSession, ChatMessage],
    synchronize: true,
  }),
  AuthModule,
  DifyAppModule,
  OpenaiModule,
  LogModule,
  ChatModule,
];

// Only serve static files if SERVE_STATIC is true
if (process.env.SERVE_STATIC === 'true') {
  imports.unshift(
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
      serveRoot: '/',
    })
  );
}

@Module({
  imports,
})
export class AppModule {}
