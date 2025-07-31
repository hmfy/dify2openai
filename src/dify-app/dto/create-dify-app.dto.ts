import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl, IsBoolean } from 'class-validator';

export class CreateDifyAppDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsUrl()
  @IsNotEmpty()
  difyApiUrl: string;

  @IsString()
  @IsNotEmpty()
  difyApiKey: string;

  @IsEnum(['Chat', 'Completion', 'Workflow'])
  @IsOptional()
  botType: string;

  @IsString()
  @IsOptional()
  inputVariable: string;

  @IsString()
  @IsOptional()
  outputVariable: string;

  @IsString()
  @IsNotEmpty()
  modelName: string;

  @IsBoolean()
  @IsOptional()
  isEnabled: boolean;
}
