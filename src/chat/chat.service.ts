import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async createSession(createChatSessionDto: CreateChatSessionDto): Promise<ChatSession> {
    const session = this.chatSessionRepository.create(createChatSessionDto);
    return this.chatSessionRepository.save(session);
  }

  async addMessage(createChatMessageDto: CreateChatMessageDto): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create(createChatMessageDto);
    return this.chatMessageRepository.save(message);
  }

  async getSessionHistory(appId: string, page: number = 1, limit: number = 20): Promise<{ data: ChatSession[], total: number }> {
    const queryBuilder = this.chatSessionRepository.createQueryBuilder('session');
    
    queryBuilder
      .where('session.appId = :appId', { appId })
      .orderBy('session.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    
    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' }
    });
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    await this.chatSessionRepository.update({ sessionId }, { title });
  }

  async clearAllSessions(): Promise<void> {
    // 先删除所有消息
    await this.chatMessageRepository.clear();
    // 再删除所有会话
    await this.chatSessionRepository.clear();
  }

  async deleteSession(sessionId: string): Promise<void> {
    // 先删除该会话的所有消息
    await this.chatMessageRepository.delete({ sessionId });
    // 再删除会话
    await this.chatSessionRepository.delete({ sessionId });
  }
}
