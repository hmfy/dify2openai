import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { DifyAppService } from '../dify-app/dify-app.service';
import { LogService } from '../log/log.service';

@Injectable()
export class OpenaiService {
  constructor(
    private difyAppService: DifyAppService,
    private logService: LogService,
  ) {}

  async chatCompletions(apiKey: string, body: any) {
    const startTime = Date.now();
    let statusCode = 200;
    let errorMessage = null;
    let responseBody = null;

    try {
      const difyApp = await this.difyAppService.findByApiKey(apiKey);
      
      const messages = body.messages;
      let queryString;
      
      if (difyApp.botType === 'Chat') {
        // For Chat mode, just use the current message without history to avoid context mixing
          queryString = messages[messages.length - 1].content;
      } else if (difyApp.botType === 'Completion' || difyApp.botType === 'Workflow') {
        queryString = messages[messages.length - 1].content;
      }

      const stream = body.stream !== undefined ? body.stream : false;
      let requestBody;
      let apiPath;

      switch (difyApp.botType) {
        case 'Chat':
          apiPath = '/chat-messages';
          break;
        case 'Completion':
          apiPath = '/completion-messages';
          break;
        case 'Workflow':
          apiPath = '/workflows/run';
          break;
        default:
          throw new Error('Invalid bot type');
      }

      if (difyApp.inputVariable) {
        requestBody = {
          inputs: { [difyApp.inputVariable]: queryString },
          response_mode: stream ? "streaming" : "blocking",
          conversation_id: "",
          user: "apiuser",
          auto_generate_name: false
        };
      } else {
        requestBody = {
          inputs: {},
          query: queryString,
          response_mode: stream ? "streaming" : "blocking",
          conversation_id: "",
          user: "apiuser",
          auto_generate_name: false
        };
      }

      const response = await axios.post(difyApp.difyApiUrl + apiPath, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${difyApp.difyApiKey}`,
        },
        responseType: stream ? 'stream' : 'json',
      });

      // Don't store stream response in responseBody to avoid circular references
      if (!stream) {
        responseBody = response.data;
      } else {
        responseBody = 'Stream response';
      }
      return { response, difyApp };

    } catch (error) {
      statusCode = error.response?.status || 500;
      errorMessage = error.message;
      
      
      
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      await this.logService.create({
        apiKey,
        appName: 'Unknown',
        method: 'POST',
        endpoint: '/v1/chat/completions',
        requestBody: JSON.stringify(body),
        responseBody: responseBody && typeof responseBody === 'object' ? 
          JSON.stringify(responseBody) : 
          (responseBody ? String(responseBody) : null),
        statusCode,
        responseTime,
        errorMessage,
      });
    }
  }

  async getModels(apiKey: string) {
    try {
      const difyApp = await this.difyAppService.findByApiKey(apiKey);
      return {
        object: "list",
        data: [
          {
            id: difyApp.modelName || "dify",
            object: "model",
            owned_by: "dify",
            permission: null,
          }
        ]
      };
    } catch (error) {
      throw error;
    }
  }

  private generateId(): string {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 29; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}