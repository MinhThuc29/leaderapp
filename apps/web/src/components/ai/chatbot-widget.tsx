'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minus,
  RotateCcw,
  Paperclip,
  Maximize2,
  Info,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isInitial?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    content:
      'Xin chào Leader! 👋 Tôi là **LeaderOS Copilot**, trợ lý AI hỗ trợ quản trị kỹ thuật cá nhân của bạn.\n\nTôi có thể giúp bạn:\n- ⏰ Rà soát các công việc quá hạn & theo dõi phản hồi\n- 📅 Chuẩn bị agenda họp 1-on-1 và tổng hợp ghi chú\n- ⚠️ Phân tích ma trận rủi ro & đề xuất kế hoạch giảm thiểu\n- 📝 Soạn thảo nhật ký quyết định kỹ thuật (Decision Log)\n\n*Lưu ý: Đây là giao diện xem trước (UI Preview), tính năng kết nối mô hình xử lý nội bộ đang được phát triển.*',
    timestamp: '15:30',
    isInitial: true,
  },
  {
    id: 'msg-demo-user',
    sender: 'user',
    content: 'Tổng hợp giúp tôi các công việc trễ hạn và cuộc họp cần ưu tiên hôm nay.',
    timestamp: '15:31',
  },
  {
    id: 'msg-demo-assistant',
    sender: 'assistant',
    content:
      'Dưới đây là tổng hợp nhanh tình hình hôm nay dành cho bạn:\n\n### ⏰ 2 Công việc quá hạn cần xử lý:\n1. **Dự án PAY-V2**: Hoàn thiện kiến trúc High-Availability cho Payment Service *(Quá hạn 1 ngày)*\n2. **Security PR**: Chờ DevOps thẩm định mã nguồn bảo mật *(Quá hạn 2 ngày)*\n\n### 📅 1 Cuộc họp quan trọng:\n- **15:30 (Hôm nay)**: Họp 1-on-1 với Senior Backend Dev về lộ trình công nghệ & OKR Q3.\n\n💡 **Gợi ý từ Copilot**: Bạn nên dành 15 phút rà soát nhanh PR bảo mật trước giờ họp 1-on-1 để tháo gỡ điểm nghẽn cho đội ngũ Backend.',
    timestamp: '15:31',
  },
];

const SUGGESTED_PROMPTS = [
  '⏰ Rà soát các task đang trễ hạn hôm nay',
  '📅 Gợi ý agenda họp 1-on-1 với Senior Dev',
  '⚠️ Tóm tắt ma trận rủi ro dự án PAY-V2',
  '💡 Gợi ý phân bổ task sprint tuần này',
];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_NOTIFICATIONS_OR_DEFAULT);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Simulate typing feedback for preview UI
    setIsTyping(true);
    setTimeout(() => {
      const assistantReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: `ℹ️ **Chế độ xem trước giao diện (UI Preview)**\n\nBạn vừa gửi yêu cầu: *"${text}"*.\n\nHiện tại giao diện Chatbot đang hiển thị mẫu (Mockup UI). Tính năng kết nối trực tiếp với mô hình xử lý ngôn ngữ tự nhiên và cơ sở dữ liệu LeaderOS sẽ được kích hoạt ở bước tiếp theo!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantReply]);
      setIsTyping(false);
    }, 800);
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setInputValue('');
  };

  function INITIAL_NOTIFICATIONS_OR_DEFAULT() {
    return INITIAL_MESSAGES;
  }

  return (
    <>
      {/* Floating Action Button (FAB) at Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 hover:shadow-indigo-500/50 active:scale-95 transition-all duration-200 ring-2 ring-white/20"
            title="Mở LeaderOS Copilot (AI Assistant)"
            aria-label="Mở Chatbot AI"
          >
            {/* Pulsing indicator */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold text-white items-center justify-center border-2 border-slate-900">
                AI
              </span>
            </span>

            <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
          </button>
        )}
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl ring-1 ring-white/10 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-4 ${
            isMinimized ? 'h-14' : 'h-[580px] max-h-[calc(100vh-5rem)]'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              {/* Bot Avatar */}
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/10">
                <Bot className="h-4 w-4" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-foreground flex items-center gap-1">
                    LeaderOS Copilot
                    <Sparkles className="h-3 w-3 text-brand" />
                  </h3>
                  <span className="rounded bg-brand-bg px-1.5 py-0.2 text-[9px] font-bold text-brand-fg border border-brand-border uppercase">
                    Preview UI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Trợ lý Kỹ thuật & Quản trị Lãnh đạo</p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Làm mới cuộc trò chuyện"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Đóng Chatbot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Body (Only visible when not minimized) */}
          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin bg-slate-900">
                {/* Notice Pill */}
                <div className="rounded-xl border border-brand-border bg-brand-bg p-2.5 text-[11px] text-brand-fg flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 text-brand mt-0.5" />
                  <div>
                    <span className="font-semibold">Chế độ xem trước giao diện:</span> Giao diện Chatbot đã sẵn sàng; mô hình AI trả lời tự động bên trong chưa được liên kết.
                  </div>
                </div>

                {/* Messages List */}
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand-fg border border-brand-border mt-0.5">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <div className="whitespace-pre-line text-xs font-normal">
                          {msg.content}
                        </div>
                        <span
                          className={`block text-[9px] mt-1.5 ${
                            isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Simulated typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand-fg border border-brand-border">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl rounded-bl-none bg-slate-800 px-3.5 py-2.5 border border-slate-700/60 flex items-center gap-1.5 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Prompt Suggestions */}
              <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-indigo-500 hover:bg-slate-750 hover:text-white transition shrink-0 shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-slate-800 bg-slate-950">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Hỏi LeaderOS Copilot về dự án, task, cuộc họp..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-3.5 pr-8 py-2.5 text-xs text-foreground placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                      title="Đính kèm tài liệu (Sắp ra mắt)"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 transition"
                    title="Gửi tin nhắn"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

                <p className="mt-1.5 text-center text-[9px] text-slate-500">
                  LeaderOS AI Copilot • Giao diện xem trước • Chưa liên kết mô hình xử lý
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
