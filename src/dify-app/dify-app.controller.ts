import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { DifyAppService } from './dify-app.service';
import { CreateDifyAppDto } from './dto/create-dify-app.dto';
import { UpdateDifyAppDto } from './dto/update-dify-app.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/dify-apps')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DifyAppController {
  constructor(private readonly difyAppService: DifyAppService) {}

  @Post()
  create(@Body() createDifyAppDto: CreateDifyAppDto) {
    return this.difyAppService.create(createDifyAppDto);
  }

  @Get()
  findAll() {
    return this.difyAppService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.difyAppService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.difyAppService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDifyAppDto: UpdateDifyAppDto) {
    return this.difyAppService.update(+id, updateDifyAppDto);
  }

  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updateDifyAppDto: UpdateDifyAppDto) {
    return this.difyAppService.update(+id, updateDifyAppDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.difyAppService.remove(+id);
  }

  @Post(':id/regenerate-api-key')
  regenerateApiKey(@Param('id') id: string) {
    return this.difyAppService.regenerateApiKey(+id);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id') id: string, @Body() body: { isEnabled: boolean }) {
    return this.difyAppService.update(+id, { isEnabled: body.isEnabled });
  }
}