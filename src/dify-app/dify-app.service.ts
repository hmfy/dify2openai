import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { DifyApp } from './entities/dify-app.entity';
import { CreateDifyAppDto } from './dto/create-dify-app.dto';
import { UpdateDifyAppDto } from './dto/update-dify-app.dto';

@Injectable()
export class DifyAppService {
  constructor(
    @InjectRepository(DifyApp)
    private difyAppRepository: Repository<DifyApp>,
  ) {}

  async create(createDifyAppDto: CreateDifyAppDto): Promise<DifyApp> {
    const difyApp = this.difyAppRepository.create({
      ...createDifyAppDto,
      generatedApiKey: this.generateApiKey(),
    });
    return this.difyAppRepository.save(difyApp);
  }

  async findAll(): Promise<DifyApp[]> {
    const apps = await this.difyAppRepository.find({
      order: { createdAt: 'DESC' },
    });
    
    // Generate API keys for apps that don't have one
    for (const app of apps) {
      if (!app.generatedApiKey) {
        app.generatedApiKey = this.generateApiKey();
        await this.difyAppRepository.save(app);
      }
    }
    
    return apps;
  }

  async findOne(id: number): Promise<DifyApp> {
    const difyApp = await this.difyAppRepository.findOne({
      where: { id },
    });
    if (!difyApp) {
      throw new NotFoundException(`DifyApp with ID ${id} not found`);
    }
    
    // Generate API key if it doesn't exist
    if (!difyApp.generatedApiKey) {
      difyApp.generatedApiKey = this.generateApiKey();
      await this.difyAppRepository.save(difyApp);
    }
    
    return difyApp;
  }

  async findByApiKey(apiKey: string): Promise<DifyApp> {
    const difyApp = await this.difyAppRepository.findOne({
      where: { generatedApiKey: apiKey, isEnabled: true },
    });
    
    if (!difyApp) {
      throw new NotFoundException('Invalid API key or app is disabled');
    }
    
    // Ensure the app has a generated API key
    if (!difyApp.generatedApiKey) {
      difyApp.generatedApiKey = this.generateApiKey();
      await this.difyAppRepository.save(difyApp);
    }
    
    return difyApp;
  }

  async update(id: number, updateDifyAppDto: UpdateDifyAppDto): Promise<DifyApp> {
    const difyApp = await this.findOne(id);
    Object.assign(difyApp, updateDifyAppDto);
    return this.difyAppRepository.save(difyApp);
  }

  async remove(id: number): Promise<void> {
    const difyApp = await this.findOne(id);
    await this.difyAppRepository.remove(difyApp);
  }

  async regenerateApiKey(id: number): Promise<DifyApp> {
    const difyApp = await this.findOne(id);
    difyApp.generatedApiKey = this.generateApiKey();
    return this.difyAppRepository.save(difyApp);
  }

  async getOriginalDifyKey(generatedApiKey: string): Promise<string> {
    const difyApp = await this.findByApiKey(generatedApiKey);
    return difyApp.difyApiKey;
  }

  async getStats(): Promise<any> {
    const totalApps = await this.difyAppRepository.count();
    const activeApps = await this.difyAppRepository.count({
      where: { isEnabled: true }
    });
    
    return {
      totalApps,
      activeApps,
    };
  }

  private generateApiKey(): string {
    return 'sk-' + uuidv4().replace(/-/g, '');
  }
}