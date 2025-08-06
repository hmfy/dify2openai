import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Copy,
  Bot,
  ChevronLeft,
  Loader2,
  AlertCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AppConfig {
  id: string;
  name: string;
  apiKey: string;
  modelName: string;
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState<{id: string, title: string, timestamp: number, requestData?: any, responseData?: any}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // 解析URL参数获取应用配置
    const data = searchParams.get('data');
    if (!data) {
      setError('无效的分享链接');
      return;
    }

    try {
      const decodedData = JSON.parse(atob(data));
      setAppConfig(decodedData);
      
      // 从localStorage加载历史对话
      const savedMessages = localStorage.getItem(`chat_history_${decodedData.id}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } else {
        // 如果没有历史消息，显示AI的开场白
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: `你好！我是 ${decodedData.name}，很高兴为你服务。我可以帮助你解答问题、提供建议或进行有趣的对话。请随时告诉我你需要什么帮助！`,
          timestamp: Date.now(),
        };
        setMessages([welcomeMessage]);
      }

      // 加载历史对话列表
      loadChatHistory();
    } catch (err) {
      setError('无法解析分享链接');
    }
  }, [searchParams]);

  const loadChatHistory = async () => {
    try {
      // 调用后端API获取历史对话
      const response = await fetch('/api/logs?page=1&limit=6&endpoint=/v1/chat/completions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      
      const { data: logs } = await response.json();
      const historyList = [];
      
      for (const log of logs) {
        try {
          // 解析requestBody获取对话消息
          const requestData = JSON.parse(log.requestBody);
          if (requestData.messages && Array.isArray(requestData.messages)) {
            // 找到第一条用户消息作为标题
            const firstUserMessage = requestData.messages.find((msg: any) => msg.role === 'user' && msg.content && !msg.content.includes('### Task:'));
            if (firstUserMessage) {
              const title = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
              historyList.push({
                id: log.id.toString(),
                title,
                timestamp: new Date(log.createdAt).getTime(),
                requestData,
                responseData: log.responseBody ? JSON.parse(log.responseBody) : null,
              });
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse log:', parseError);
        }
      }
      
      setChatHistory(historyList);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  useEffect(() => {
    // 保存对话历史到localStorage，但不保存欢迎消息
    if (appConfig && messages.length > 0) {
      const messagesToSave = messages.filter(msg => msg.id !== 'welcome');
      if (messagesToSave.length > 0) {
        localStorage.setItem(`chat_history_${appConfig.id}`, JSON.stringify(messagesToSave));
        // 更新历史对话列表
        loadChatHistory();
      }
    }
  }, [messages, appConfig]);

  useEffect(() => {
    // 自动滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !appConfig || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${appConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: appConfig.modelName || 'gpt-3.5-turbo',
          messages: [
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage.content }
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0]?.message?.content || '抱歉，我无法生成回复。',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('发送消息失败，请重试');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = async (content: string) => {
    try {
      // 优先使用现代clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        // 降级方案：使用传统的execCommand
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      toast({
        title: "已复制",
        description: "消息内容已复制到剪贴板",
      });
    } catch (err) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  const clearHistory = async () => {
    if (appConfig) {
      try {
        // 调用后端API清空所有历史记录
        const response = await fetch('/api/logs/clear', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear history');
        }
        
        // 清空localStorage中的当前对话
        localStorage.removeItem(`chat_history_${appConfig.id}`);
        
        // 保留欢迎消息
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: `你好！我是 ${appConfig.name}，很高兴为你服务。我可以帮助你解答问题、提供建议或进行有趣的对话。请随时告诉我你需要什么帮助！`,
          timestamp: Date.now(),
        };
        setMessages([welcomeMessage]);
        
        // 重新加载历史对话列表
        await loadChatHistory();
        
        toast({
          title: "已清空",
          description: "对话历史已清空",
        });
      } catch (error) {
        console.error('Failed to clear history:', error);
        toast({
          title: "清空失败",
          description: "无法清空对话历史，请重试",
          variant: "destructive",
        });
      }
    }
  };

  const startNewChat = () => {
    clearHistory();
  };

  const loadHistoryChat = (historyItem: any) => {
    if (historyItem.requestData && historyItem.requestData.messages) {
      // 将API日志中的messages转换为我们的Message格式
      const convertedMessages: Message[] = historyItem.requestData.messages
        .filter((msg: any) => msg.role !== 'system') // 过滤掉系统消息
        .map((msg: any, index: number) => ({
          id: `history_${historyItem.id}_${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: historyItem.timestamp,
        }));
      
      // 如果有响应数据，也添加AI的回复
      if (historyItem.responseData) {
        try {
          let aiResponse = '';
          if (typeof historyItem.responseData === 'string') {
            const responseObj = JSON.parse(historyItem.responseData);
            if (responseObj.choices && responseObj.choices[0] && responseObj.choices[0].message) {
              aiResponse = responseObj.choices[0].message.content;
            }
          } else if (historyItem.responseData.choices && historyItem.responseData.choices[0]) {
            aiResponse = historyItem.responseData.choices[0].message.content;
          }
          
          if (aiResponse) {
            convertedMessages.push({
              id: `history_${historyItem.id}_response`,
              role: 'assistant',
              content: aiResponse,
              timestamp: historyItem.timestamp + 1,
            });
          }
        } catch (error) {
          console.warn('Failed to parse response data:', error);
        }
      }
      
      setMessages(convertedMessages);
      toast({
        title: "已加载",
        description: "历史对话已加载",
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">错误</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* 左侧边栏 */}
      <div className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'hidden w-[260px]'} bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col p-2 transition-all duration-300`}>
        {/* 顶部区域 */}
        <div className="flex justify-between items-center h-10 px-2 mb-2">
          <div className="text-[20px] font-semibold text-[#111827]">{appConfig?.name || 'AI助手'}</div>
          <button 
            onClick={() => setSidebarCollapsed(true)}
            className="w-6 h-6 bg-[#F3F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E7EB]"
          >
            <ChevronLeft className="w-3 h-3 text-[#6B7280]" strokeWidth={2} />
          </button>
        </div>

        {/* 开启新对话按钮 */}
        <button 
          onClick={startNewChat}
          className="flex items-center justify-center h-11 bg-[#EBF5FF] rounded-lg px-4 py-2.5 mb-2 hover:bg-[#DBEAFE] transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#3B82F6] mr-2" />
          <span className="text-[14px] font-medium text-[#3B82F6]">开启新对话</span>
        </button>

        {/* 历史记录列表 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-2 py-4">
            <div className="text-[12px] font-medium text-[#6B7280] mb-2">30天内</div>
            <div className="space-y-1">
              {chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div 
                    key={chat.id} 
                    className="flex items-center justify-between h-10 px-3 bg-[#F3F4F6] rounded-md hover:bg-[#E5E7EB] cursor-pointer"
                    onClick={() => loadHistoryChat(chat)}
                  >
                    <span className="text-[14px] text-[#374151] truncate">{chat.title}</span>
                    <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-[#9CA3AF] text-center py-4">暂无历史对话</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 侧边栏展开按钮（当侧边栏收起时显示） */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed top-4 left-4 z-10 p-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#6B7280]" />
        </button>
      )}

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col bg-white">
        {/* 顶部标题 */}
        <div className="h-[60px] border-b border-[#E5E7EB] px-6 flex items-center justify-between">
          <h1 className="text-[16px] font-semibold text-[#111827]">{appConfig?.name || 'AI助手'}</h1>
          <button
            onClick={clearHistory}
            className="hidden p-2 text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            title="清除历史对话"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 聊天记录区 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-[768px] mx-auto py-8 px-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#9CA3AF]">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-[#D1D5DB]" />
                  <p className="text-[14px]">开始对话吧</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.role === 'user' ? (
                      /* 用户消息 */
                      <div className="flex justify-end mb-6">
                        <div className="bg-[#EFF6FF] rounded-xl p-3 max-w-[80%]">
                          <div className="text-[14px] leading-[22px] text-[#1F2937] whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* AI回复消息 */
                      <div className="flex items-start space-x-3 mb-6">
                        <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="prose prose-sm max-w-none break-words">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => (
                                  <p className="text-[14px] leading-[24px] text-[#374151] mb-4 last:mb-0">{children}</p>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-[18px] font-semibold text-[#111827] mt-4 mb-3 first:mt-0">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-[16px] font-medium text-[#1F2937] mt-3 mb-2">{children}</h2>
                                ),
                                ul: ({ children }) => (
                                  <ul className="space-y-2 my-3">{children}</ul>
                                ),
                                li: ({ children }) => (
                                  <li className="text-[14px] leading-[22px] text-[#374151] pl-6 relative">
                                    <span className="absolute left-2 top-[2px] w-1.5 h-1.5 bg-[#9CA3AF] rounded-full"></span>
                                    {children}
                                  </li>
                                ),
                                code: ({ inline, className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeContent = String(children).replace(/\n$/, '');
                                  
                                  return !inline && match ? (
                                    <div className="relative group">
                                      <SyntaxHighlighter
                                        style={tomorrow}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-md text-sm my-3 overflow-x-auto"
                                        wrapLines={true}
                                        wrapLongLines={true}
                                        customStyle={{
                                          margin: '12px 0',
                                          borderRadius: '6px',
                                          fontSize: '14px',
                                          maxWidth: '100%',
                                          overflowX: 'auto',
                                          whiteSpace: 'pre-wrap',
                                          wordBreak: 'break-word'
                                        }}
                                        {...props}
                                      >
                                        {codeContent}
                                      </SyntaxHighlighter>
                                      <button
                                        onClick={() => copyMessage(codeContent)}
                                        className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="复制代码"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[13px] font-mono text-[#374151]" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          {/* AI回答的复制按钮 */}
                          <div className="flex justify-end mt-2">
                            <button 
                              onClick={() => copyMessage(message.content)}
                              className="p-1 text-[#9CA3AF] hover:text-[#6B7280]"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
                  <span className="text-[14px] text-[#6B7280]">正在思考...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入框区域 */}
        <div className="max-w-[768px] mx-auto w-full px-6 pt-4 pb-6">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* 输入框容器 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] p-6">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`给 ${appConfig?.name || 'AI助手'} 发送消息`}
                  className="w-full px-0 py-2 text-[14px] placeholder-[#9CA3AF] border-0 outline-none resize-none bg-transparent"
                  rows={4}
                  disabled={isLoading}
                  style={{
                    minHeight: '120px',
                    maxHeight: '200px',
                  }}
                  onInput={(e: any) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2563EB]"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* 底部提示 */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-[12px] text-[#9CA3AF]">内容由AI生成，请仔细甄别</span>
          </div>
        </div>
      </div>
    </div>
  );
}