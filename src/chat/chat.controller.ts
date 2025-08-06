import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  createSession(@Body() createChatSessionDto: CreateChatSessionDto) {
    return this.chatService.createSession(createChatSessionDto);
  }

  @Post('messages')
  addMessage(@Body() createChatMessageDto: CreateChatMessageDto) {
    return this.chatService.addMessage(createChatMessageDto);
  }

  @Get('sessions')
  getSessionHistory(
    @Query('appId') appId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.chatService.getSessionHistory(appId, +page, +limit);
  }

  @Get('sessions/:sessionId/messages')
  getSessionMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.getSessionMessages(sessionId);
  }

  @Post('sessions/:sessionId/title')
  updateSessionTitle(
    @Param('sessionId') sessionId: string,
    @Body('title') title: string
  ) {
    return this.chatService.updateSessionTitle(sessionId, title);
  }

  @Delete('sessions/clear')
  clearAllSessions() {
    return this.chatService.clearAllSessions();
  }

  @Delete('sessions/:sessionId')
  deleteSession(@Param('sessionId') sessionId: string) {
    return this.chatService.deleteSession(sessionId);
  }
}
