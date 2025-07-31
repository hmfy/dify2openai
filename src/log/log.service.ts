import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from './entities/call-log.entity';
import { CreateCallLogDto } from './dto/create-call-log.dto';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(CallLog)
    private callLogRepository: Repository<CallLog>,
  ) {}

  async create(createCallLogDto: CreateCallLogDto): Promise<CallLog> {
    const callLog = this.callLogRepository.create(createCallLogDto);
    return this.callLogRepository.save(callLog);
  }

  async findAll(page: number = 1, limit: number = 50, filters?: any): Promise<{ data: CallLog[], total: number }> {
    const queryBuilder = this.callLogRepository.createQueryBuilder('log');
    
    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('log.statusCode = :status', { status: filters.status });
    }
    
    if (filters?.endpoint) {
      queryBuilder.andWhere('log.endpoint LIKE :endpoint', { endpoint: `%${filters.endpoint}%` });
    }
    
    if (filters?.dateFrom) {
      queryBuilder.andWhere('log.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    
    if (filters?.dateTo) {
      queryBuilder.andWhere('log.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }
    
    // Apply pagination and ordering
    queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    
    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async getStats(): Promise<any> {
    const totalCalls = await this.callLogRepository.count();
    const successfulCalls = await this.callLogRepository.count({
      where: { statusCode: 200 }
    });
    const errorCalls = totalCalls - successfulCalls;
    
    const avgResponseTime = await this.callLogRepository
      .createQueryBuilder('log')
      .select('AVG(log.responseTime)', 'avg')
      .getRawOne();

    return {
      totalCalls,
      successfulCalls,
      errorCalls,
      avgResponseTime: Math.round(avgResponseTime.avg || 0),
    };
  }

  async remove(id: number): Promise<void> {
    await this.callLogRepository.delete(id);
  }
}