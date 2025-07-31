import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateCallLogDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsNotEmpty()
  appName: string;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsString()
  @IsNotEmpty()
  requestBody: string;

  @IsString()
  @IsOptional()
  responseBody?: string;

  @IsNumber()
  @IsOptional()
  statusCode?: number;

  @IsNumber()
  @IsOptional()
  responseTime?: number;

  @IsString()
  @IsOptional()
  errorMessage?: string;
}