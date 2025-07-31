import { PartialType } from '@nestjs/mapped-types';
import { CreateDifyAppDto } from './create-dify-app.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDifyAppDto extends PartialType(CreateDifyAppDto) {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}