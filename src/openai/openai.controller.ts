import { Controller, Post, Get, Body, Headers, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { OpenaiService } from './openai.service';

@Controller('v1')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Get('models')
  async getModels(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return this.openaiService.getModels(token);
  }

  @Post('chat/completions')
  async chatCompletions(
    @Headers('authorization') authHeader: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    if (!authHeader) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const { response, difyApp } = await this.openaiService.chatCompletions(token, body);
      const stream = body.stream !== undefined ? body.stream : false;
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let buffer = "";
        let isFirstChunk = true;
        let isResponseEnded = false;
        let fullAnswer = ""; // Track the complete answer for logging

        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          let lines = buffer.split('\n');

          for (let i = 0; i < lines.length - 1; i++) {
            let line = lines[i].trim();
            if (!line.startsWith('data:')) continue;
            line = line.slice(5).trim();
            
            let chunkObj;
            try {
              if (line.startsWith('{')) {
                chunkObj = JSON.parse(line);
              } else {
                continue;
              }
            } catch (error) {
              console.error('Error parsing chunk:', error);
              continue;
            }

            if (chunkObj.event === 'message' || chunkObj.event === 'agent_message' || chunkObj.event === 'text_chunk') {
              let chunkContent;
              if (chunkObj.event === 'text_chunk') {
                chunkContent = chunkObj.data.text;
              } else {
                chunkContent = chunkObj.answer;
              }

              if (isFirstChunk) {
                chunkContent = chunkContent.trimStart();
                isFirstChunk = false;
                // Log the question only once at the start - get the last user message
                const lastUserMessage = body.messages.filter(msg => msg.role === 'user').pop();
                const userContent = lastUserMessage?.content || 'No user message found';
                
                // Skip logging for automated system prompts
                const isSystemPrompt = userContent.includes('### Task:') || 
                                      userContent.includes('### Guidelines:') ||
                                      userContent.includes('### Output:') ||
                                      userContent.includes('JSON format:');
                
                if (!isSystemPrompt) {
                  console.log("ask------------", userContent);
                }
              }
              
              if (chunkContent !== "" && !isResponseEnded) {
                fullAnswer += chunkContent; // Accumulate the full answer
                const chunkId = `chatcmpl-${Date.now()}`;
                const chunkCreated = chunkObj.created_at;
                
                res.write(
                  "data: " +
                    JSON.stringify({
                      id: chunkId,
                      object: "chat.completion.chunk",
                      created: chunkCreated,
                      model: body.model,
                      choices: [
                        {
                          index: 0,
                          delta: {
                            content: chunkContent,
                          },
                          finish_reason: null,
                        },
                      ],
                    }) +
                    "\n\n"
                );
              }
            } else if (chunkObj.event === 'workflow_finished' || chunkObj.event === 'message_end') {
              const chunkId = `chatcmpl-${Date.now()}`;
              const chunkCreated = chunkObj.created_at;
              
              if (!isResponseEnded) {
                // Log the complete answer only once at the end (if not a system prompt)
                const lastUserMessage = body.messages.filter(msg => msg.role === 'user').pop();
                const userContent = lastUserMessage?.content || '';
                const isSystemPrompt = userContent.includes('### Task:') || 
                                      userContent.includes('### Guidelines:') ||
                                      userContent.includes('### Output:') ||
                                      userContent.includes('JSON format:');
                
                if (!isSystemPrompt) {
                  console.log("answer------------", fullAnswer);
                }
                
                res.write(
                  "data: " +
                    JSON.stringify({
                      id: chunkId,
                      object: "chat.completion.chunk",
                      created: chunkCreated,
                      model: body.model,
                      choices: [
                        {
                          index: 0,
                          delta: {},
                          finish_reason: "stop",
                        },
                      ],
                    }) +
                    "\n\n"
                );
                res.write("data: [DONE]\n\n");
                res.end();
                isResponseEnded = true;
              }
            } else if (chunkObj.event === 'agent_thought') {
              // Skip agent_thought events
            } else if (chunkObj.event === 'ping') {
              // Skip ping events
            } else if (chunkObj.event === 'error') {
              console.error(`Error: ${chunkObj.code}, ${chunkObj.message}`);
              console.log("answer------------ ERROR:", chunkObj.message);
              res.status(500).write(
                `data: ${JSON.stringify({ error: chunkObj.message })}\n\n`
              );
              if (!isResponseEnded) {
                res.write("data: [DONE]\n\n");
                res.end();
                isResponseEnded = true;
              }
            }
          }
          buffer = lines[lines.length - 1];
        });

        response.data.on('end', () => {
          if (!isResponseEnded) {
            res.write("data: [DONE]\n\n");
            res.end();
          }
        });

      } else {
        // Non-streaming response - blocking mode
        const responseData = response.data;
        
        // Log the question and answer for non-streaming responses
        const lastUserMessage = body.messages.filter(msg => msg.role === 'user').pop();
        const userContent = lastUserMessage?.content || 'No user message found';
        
        // Skip logging for automated system prompts (follow-up suggestions, title generation, etc.)
        const isSystemPrompt = userContent.includes('### Task:') || 
                              userContent.includes('### Guidelines:') ||
                              userContent.includes('### Output:') ||
                              userContent.includes('JSON format:');
        
        if (!isSystemPrompt) {
          console.log("ask------------", userContent);
          console.log('Non-streaming response data:', JSON.stringify(responseData, null, 2));
        }
        
        let result = "";
        let usageData: any = {
          prompt_tokens: 100,
          completion_tokens: 10,
          total_tokens: 110,
        };

        // Handle different response structures based on bot type
        if (responseData.answer) {
          // Chat/Completion mode response
          result = responseData.answer;
        } else if (responseData.data) {
          // Workflow mode response
          if (responseData.data.outputs) {
            const outputs = responseData.data.outputs;
            if (difyApp.outputVariable && outputs[difyApp.outputVariable]) {
              result = outputs[difyApp.outputVariable];
            } else {
              // Get the first output value or stringify all outputs
              const outputValues = Object.values(outputs);
              result = outputValues.length > 0 ? String(outputValues[0]) : JSON.stringify(outputs);
            }
          } else {
            result = String(responseData.data);
          }
        } else if (typeof responseData === 'string') {
          result = responseData;
        } else {
          console.warn('Unexpected response structure:', responseData);
          result = JSON.stringify(responseData);
        }

        // Extract usage data if available
        if (responseData.metadata && responseData.metadata.usage) {
          const usage = responseData.metadata.usage;
          usageData = {
            prompt_tokens: usage.prompt_tokens || 100,
            completion_tokens: usage.completion_tokens || 10,
            total_tokens: usage.total_tokens || 110,
          };
        }

        const finalResult = String(result).trim() || "Empty response";
        
        // Only log the answer if this wasn't a system prompt
        if (!isSystemPrompt) {
          console.log("answer------------", finalResult);
        }
        
        const formattedResponse = {
          id: `chatcmpl-${this.generateId()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: body.model,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: finalResult,
              },
              logprobs: null,
              finish_reason: "stop",
            },
          ],
          usage: usageData,
          system_fingerprint: "fp_2f57f81c11",
        };
        
        res.json(formattedResponse);
      }
    } catch (error) {
      console.error('Error:', error.message || error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      res.status(error.response?.status || 500).json({ error: errorMessage });
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