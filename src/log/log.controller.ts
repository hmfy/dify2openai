import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/logs')
@UseGuards(JwtAuthGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1', 
    @Query('limit') limit: string = '50',
    @Query('status') status?: string,
    @Query('endpoint') endpoint?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters = {
      status: status ? +status : undefined,
      endpoint,
      dateFrom,
      dateTo,
    };
    return this.logService.findAll(+page, +limit, filters);
  }

  @Get('stats')
  getStats() {
    return this.logService.getStats();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logService.remove(+id);
  }
}