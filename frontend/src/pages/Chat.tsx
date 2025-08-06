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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [isMobile, setIsMobile] = useState(false);
  const [chatHistory, setChatHistory] = useState<{id: string, title: string, timestamp: number, sessionId: string}[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // 移动端默认隐藏侧边栏
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // 解析URL参数获取应用配置
    const data = searchParams.get('data');
    if (!data) {
      setError('无效的分享链接');
      return;
    }

    try {
      const decodedData = JSON.parse(decodeURIComponent(atob(data)));
      setAppConfig(decodedData);
      
      // 检查是否有当前会话ID（页面刷新后恢复）
      const savedSessionId = localStorage.getItem(`current_session_${decodedData.id}`);
      
      if (savedSessionId) {
        // 恢复现有会话
        setCurrentSessionId(savedSessionId);
        loadSessionMessages(savedSessionId);
      } else {
        // 初始化新会话和欢迎消息
        initializeNewSession(decodedData);
      }
      
      // 加载历史对话列表
      loadChatHistoryWithConfig(decodedData);
    } catch (err) {
      setError('无法解析分享链接');
    }
  }, [searchParams]);

  const loadChatHistoryWithConfig = async (config: AppConfig) => {
    try {
      // 调用新的chat sessions API获取历史对话
      const response = await fetch(`/api/chat/sessions?appId=${config.id}&page=1&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      
      const { data: sessions } = await response.json();
      const historyList = sessions.map((session: any) => ({
        id: session.id.toString(),
        title: session.title,
        timestamp: new Date(session.updatedAt).getTime(),
        sessionId: session.sessionId,
      }));
      
      setChatHistory(historyList);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch session messages');
      }
      
      const sessionMessages = await response.json();
      
      if (sessionMessages.length === 0) {
        // 如果会话没有消息，显示欢迎消息
        if (appConfig) {
          const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: `你好！我是 ${appConfig.name}，很高兴为你服务。我可以帮助你解答问题、提供建议或进行有趣的对话。请随时告诉我你需要什么帮助！`,
            timestamp: Date.now(),
          };
          setMessages([welcomeMessage]);
        }
      } else {
        // 转换为前端Message格式
        const convertedMessages: Message[] = sessionMessages.map((msg: any) => ({
          id: `saved_${msg.id}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt).getTime(),
        }));
        setMessages(convertedMessages);
      }
    } catch (error) {
      console.error('Failed to load session messages:', error);
      // 如果加载失败，显示欢迎消息
      if (appConfig) {
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: `你好！我是 ${appConfig.name}，很高兴为你服务。我可以帮助你解答问题、提供建议或进行有趣的对话。请随时告诉我你需要什么帮助！`,
          timestamp: Date.now(),
        };
        setMessages([welcomeMessage]);
      }
    }
  };

  const initializeNewSession = async (config: AppConfig) => {
    // 创建新会话
    const sessionId = await createNewSession(config);
    if (sessionId) {
      setCurrentSessionId(sessionId);
      // 保存当前会话ID到localStorage
      localStorage.setItem(`current_session_${config.id}`, sessionId);
    }
    
    // 显示AI的开场白
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `你好！我是 ${config.name}，很高兴为你服务。我可以帮助你解答问题、提供建议或进行有趣的对话。请随时告诉我你需要什么帮助！`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
  };

  const createNewSession = async (config?: AppConfig) => {
    const targetConfig = config || appConfig;
    if (!targetConfig) return null;
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          appId: targetConfig.id,
          title: '新对话',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      return sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  };

  useEffect(() => {
    // 当有新消息且有当前会话时，保存消息到后端
    if (currentSessionId && messages.length > 0) {
      // 只处理新的消息（不以saved_、history_开头，且不是welcome消息）
      const newMessages = messages.filter(msg => 
        msg.id !== 'welcome' && 
        !msg.id.startsWith('history_') &&
        !msg.id.startsWith('saved_')
      );
      
      if (newMessages.length === 0) return;
      
      // 保存新消息到后端
      const saveMessages = async () => {
        let shouldUpdateTitle = false;
        let titleToUpdate = '';
        
        for (const message of newMessages) {
          try {
            const response = await fetch('/api/chat/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: currentSessionId,
                role: message.role,
                content: message.content,
              }),
            });
            
            if (response.ok) {
              // 标记消息为已保存
              message.id = `saved_${message.id}`;
              
              // 如果是用户消息且还没有设置标题，准备更新标题
              if (message.role === 'user' && !shouldUpdateTitle) {
                shouldUpdateTitle = true;
                titleToUpdate = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
              }
            }
          } catch (error) {
            console.error('Failed to save message:', error);
          }
        }
        
        // 更新会话标题
        if (shouldUpdateTitle && titleToUpdate) {
          await updateSessionTitle(currentSessionId, titleToUpdate);
        }
        
        // 重新加载历史对话列表
        if (appConfig) {
          await loadChatHistoryWithConfig(appConfig);
        }
      };
      
      saveMessages();
    }
  }, [messages, currentSessionId]);

  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      await fetch(`/api/chat/sessions/${sessionId}/title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
    } catch (error) {
      console.error('Failed to update session title:', error);
    }
  };

  useEffect(() => {
    // 自动滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !appConfig || isLoading || !currentSessionId) return;

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
            ...messages.filter(msg => msg.id !== 'welcome').map(msg => ({ role: msg.role, content: msg.content })),
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
        duration: 3000, // 3秒后自动关闭
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
        const response = await fetch('/api/chat/sessions/clear', {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear history');
        }
        
        // 清除localStorage中的当前会话ID
        localStorage.removeItem(`current_session_${appConfig.id}`);
        
        // 重新初始化新会话
        await initializeNewSession(appConfig);
        
        // 重新加载历史对话列表
        await loadChatHistoryWithConfig(appConfig);
        
        toast({
          title: "已清空",
          description: "对话历史已清空",
          duration: 3000, // 3秒后自动关闭
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

  const startNewChat = async () => {
    if (appConfig) {
      // 清除旧的会话ID
      localStorage.removeItem(`current_session_${appConfig.id}`);
      // 重新初始化新会话
      await initializeNewSession(appConfig);
      // 重新加载历史对话列表
      await loadChatHistoryWithConfig(appConfig);
    }
  };

  const loadHistoryChat = async (historyItem: any) => {
    try {
      // 调用后端API获取会话消息
      const response = await fetch(`/api/chat/sessions/${historyItem.sessionId}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch session messages');
      }
      
      const sessionMessages = await response.json();
      
      // 转换为前端Message格式
      const convertedMessages: Message[] = sessionMessages.map((msg: any) => ({
        id: `history_${msg.id}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt).getTime(),
      }));
      
      setMessages(convertedMessages);
      setCurrentSessionId(historyItem.sessionId);
      
      // 更新localStorage中的当前会话ID
      if (appConfig) {
        localStorage.setItem(`current_session_${appConfig.id}`, historyItem.sessionId);
      }
      
      toast({
        title: "已加载",
        description: "历史对话已加载",
        duration: 3000, // 3秒后自动关闭
      });
    } catch (error) {
      console.error('Failed to load session messages:', error);
      toast({
        title: "加载失败",
        description: "无法加载历史对话",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    
    try {
      const response = await fetch(`/api/chat/sessions/${deleteSessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      // 如果删除的是当前会话，创建新会话
      if (currentSessionId === deleteSessionId && appConfig) {
        localStorage.removeItem(`current_session_${appConfig.id}`);
        await initializeNewSession(appConfig);
      }
      
      // 重新加载历史对话列表
      if (appConfig) {
        await loadChatHistoryWithConfig(appConfig);
      }
      
      // 关闭删除弹窗
      setDeleteSessionId(null);
      
      toast({
        title: "已删除",
        description: "对话已删除",
        duration: 3000, // 3秒后自动关闭
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: "删除失败",
        description: "无法删除对话",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    setDeleteSessionId(sessionId);
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
    <div className="h-screen bg-white flex overflow-hidden relative">
      {/* 移动端遮罩层 */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* 左侧边栏 */}
      <div className={`
        ${isMobile 
          ? `fixed top-0 left-0 h-full w-[280px] z-50 transform transition-transform duration-300 ${
              sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
            } md:relative md:translate-x-0 md:w-[260px] md:z-auto`
          : `${sidebarCollapsed ? 'w-0' : 'w-[260px]'} transition-all duration-300`
        } 
        bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col overflow-hidden flex-shrink-0
      `}>
        <div className={`${isMobile ? 'w-[280px]' : 'min-w-[260px]'} flex flex-col h-full p-2`}>
          {/* 顶部区域 */}
          <div className="flex justify-between items-center h-10 px-2 mb-2 flex-shrink-0">
            <div className="text-[20px] font-semibold text-[#111827]">{appConfig?.name || 'AI助手'}</div>
            <button 
              onClick={() => setSidebarCollapsed(true)}
              className={`
                bg-[#F3F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E7EB] transition-colors
                ${isMobile ? 'w-8 h-8' : 'w-6 h-6'}
              `}
            >
              <ChevronLeft className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} text-[#6B7280]`} strokeWidth={2} />
            </button>
          </div>

          {/* 开启新对话按钮 */}
          <button 
            onClick={startNewChat}
            className={`
              flex items-center justify-center bg-[#EBF5FF] rounded-lg px-4 mb-2 hover:bg-[#DBEAFE] transition-colors flex-shrink-0
              ${isMobile ? 'h-12 text-[15px]' : 'h-11 text-[14px]'}
            `}
          >
            <MessageSquarePlus className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-[#3B82F6] mr-2`} />
            <span className="font-medium text-[#3B82F6]">开启新对话</span>
          </button>

          {/* 历史记录列表 - 独立滚动 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-2 py-4">
              <div className="text-[12px] font-medium text-[#6B7280] mb-2">30天内</div>
              <div className="space-y-1">
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat) => (
                    <div 
                      key={chat.id} 
                      className={`
                        group flex items-center justify-between px-3 bg-[#F3F4F6] rounded-md hover:bg-[#E5E7EB] cursor-pointer
                        ${isMobile ? 'h-12' : 'h-10'}
                      `}
                      onClick={() => loadHistoryChat(chat)}
                    >
                      <span className={`text-[#374151] truncate flex-1 ${isMobile ? 'text-[15px]' : 'text-[14px]'}`}>{chat.title}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(chat.sessionId);
                          }}
                          className={`
                            opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-[#EF4444] transition-all
                            ${isMobile ? 'p-2' : 'p-1'}
                          `}
                          title="删除对话"
                        >
                          <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
                        </button>
                        <MoreHorizontal className={`text-[#6B7280] ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-[#9CA3AF] text-center py-4">暂无历史对话</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 侧边栏展开按钮（当侧边栏收起时显示） */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className={`
            fixed top-4 left-4 z-10 p-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg transition-colors
            ${isMobile ? 'w-10 h-10' : 'w-8 h-8'}
          `}
        >
          <MessageSquarePlus className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-[#6B7280]`} />
        </button>
      )}

      {/* 右侧主内容区 */}
      <div className={`
        flex-1 flex flex-col bg-white min-h-screen
        ${isMobile ? 'w-full' : ''}
      `}>
        {/* 顶部标题 */}
        <div className="h-[60px] border-b border-[#E5E7EB] px-6 flex items-center justify-between flex-shrink-0">
          {/* <h1 className="text-[16px] font-semibold text-[#111827] ml-10">{appConfig?.name || 'AI助手'}</h1> */}
          <button
            onClick={clearHistory}
            className="hidden p-2 text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            title="清除历史对话"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 聊天记录区 - 独立滚动容器 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-[768px] mx-auto py-8 px-6 min-h-full">
              {messages.length === 0 ? (
                <div className="space-y-6">
                  <div className="flex items-start space-x-3 mb-6">
                    <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose prose-sm max-w-none break-words">
                        <p className="text-[14px] leading-[24px] text-[#374151] mb-4 last:mb-0">
                          你好！我是 {appConfig?.name || 'AI助手'}，很高兴为你服务。我可以帮助你解答问题、提供建议或进行有趣的对话。请随时告诉我你需要什么帮助！
                        </p>
                      </div>
                    </div>
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
        </div>

        {/* 输入框区域 - 固定在底部 */}
        <div className="flex-shrink-0 bg-white">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除对话</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个对话吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSession} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}