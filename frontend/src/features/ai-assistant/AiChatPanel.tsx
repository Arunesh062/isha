import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  ShieldCheck,
  ChevronDown,
  Info,
} from 'lucide-react';
import { sendChatMessage, AiServiceError } from './aiService';
import AiProductCard from './AiProductCard';
import type { ReferencedProductSummary, ChatHistoryMessage } from '@/types/ai';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  referencedProducts?: ReferencedProductSummary[];
  isError?: boolean;
}

interface AiChatPanelProps {
  onViewProduct?: (productId: string) => void;
  currentProductId?: string;
}

const SUGGESTED_QUESTIONS = [
  'Help me find a product for daily immunity',
  'Recommend a natural wellness gift',
  'What are your shipping and COD policies?',
  'What are the benefits of copper water bottles?',
];

const WELCOME_MESSAGE: ChatMessageItem = {
  id: 'welcome-msg',
  sender: 'assistant',
  text: 'Namaste! 🙏 I am your Sattva Life AI Shopping & Wellness Concierge. I can help you discover authentic Ayurvedic supplements, natural body care, yoga essentials, and handcrafted copperware, or clarify our verified shipping and store policies.\n\nHow may I support your wellbeing journey today?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export default function AiChatPanel({ onViewProduct, currentProductId }: AiChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || isLoading) return;

    setInputText('');
    setLastFailedMessage(null);

    const userMsgId = `user-${Date.now()}`;
    const userMessageItem: ChatMessageItem = {
      id: userMsgId,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMessageItem];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      // Build conversation history for API (bounded to last 6 entries, excluding welcome message)
      const historyPayload: ChatHistoryMessage[] = nextMessages
        .filter((m) => m.id !== 'welcome-msg' && !m.isError)
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text,
        }));

      const response = await sendChatMessage({
        message,
        history: historyPayload,
        productId: currentProductId,
      });

      const assistantMessageItem: ChatMessageItem = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedProducts: response.referencedProducts,
      };

      setMessages((prev) => [...prev, assistantMessageItem]);
    } catch (err: unknown) {
      setLastFailedMessage(message);

      let errorMessage = 'I encountered a momentary issue while processing your question. Please try again.';
      if (err instanceof AiServiceError) {
        errorMessage = err.message;
      }

      const errorItem: ChatMessageItem = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: errorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setMessages((prev) => [...prev, errorItem]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  return (
    <>
      {/* Floating Chat Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-gradient-to-r from-primary-700 to-primary-800 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Open Sattva Life AI Assistant"
          aria-expanded={false}
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-sage-400 rounded-full" />
          </div>
          <span className="font-serif text-sm font-semibold tracking-wide pr-1">
            Ask Sattva AI
          </span>
        </button>
      )}

      {/* Expandable Chat Panel Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sattva Life AI Shopping Assistant"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[420px] h-[min(540px,calc(100vh-5rem))] max-h-[calc(100vh-5rem)] z-50 bg-warmwhite rounded-lg shadow-2xl border border-primary-200/90 flex flex-col overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="bg-primary-900 text-white px-4 py-3.5 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-700/80 border border-primary-500/50 flex items-center justify-center text-accent-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold leading-none tracking-wide text-cream">
                  Sattva Wellness Concierge
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-pulse" />
                  <span className="text-[10px] text-primary-200 uppercase tracking-widest font-sans">
                    Grounded Store Assistant
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-primary-200 hover:text-white hover:bg-primary-800 transition-colors"
                aria-label="Minimize chat panel"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-primary-200 hover:text-white hover:bg-primary-800 transition-colors"
                aria-label="Close chat panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Trust & Policy Badge Bar */}
          <div className="bg-primary-50/80 border-b border-primary-100 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-primary-600 shrink-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
              <span>Grounded in verified Sattva inventory</span>
            </div>
            <span className="text-[10px] text-primary-400">Support: 8010 479480</span>
          </div>

          {/* Scrollable Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center shrink-0 mt-0.5 text-primary-700">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed transition-all ${
                    msg.sender === 'user'
                      ? 'bg-primary-700 text-white rounded-br-none shadow-sm'
                      : msg.isError
                      ? 'bg-accent-50 border border-accent-300 text-primary-900 rounded-bl-none shadow-sm'
                      : 'bg-white border border-primary-100 text-primary-900 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Referenced Verified Product Cards */}
                  {msg.referencedProducts && msg.referencedProducts.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-primary-100/80 space-y-2">
                      <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary-500" />
                        Recommended products:
                      </p>
                      {msg.referencedProducts.map((prod) => (
                        <AiProductCard
                          key={prod.id}
                          product={prod}
                          onViewProduct={(id) => {
                            setIsOpen(false);
                            onViewProduct?.(id);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Retry button if error */}
                  <div
                    className={`mt-1.5 flex items-center justify-between gap-3 text-[10px] ${
                      msg.sender === 'user' ? 'text-primary-200' : 'text-primary-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.isError && (
                      <button
                        onClick={handleRetry}
                        className="inline-flex items-center gap-1 text-primary-700 font-medium hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-primary-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center shrink-0 text-primary-700">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-primary-100 rounded-lg p-3 text-sm text-primary-600 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-primary-500 font-serif italic">
                    Consulting Sattva catalogue...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips (only if history is short) */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-2 bg-warmwhite border-t border-primary-100 shrink-0">
              <p className="text-[10px] font-medium text-primary-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Info className="w-3 h-3 text-primary-400" />
                Suggested topics:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(question)}
                    className="text-left text-xs bg-white hover:bg-primary-50 text-primary-800 border border-primary-200/70 rounded-full px-3 py-1 transition-colors hover:border-primary-400 shadow-2xs"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-primary-200 shrink-0 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about teas, copperware, meditation..."
              disabled={isLoading}
              className="flex-1 bg-primary-50/70 border border-primary-200 rounded-sm px-3.5 py-2.5 text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors disabled:opacity-50"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-primary-700 hover:bg-primary-800 disabled:bg-primary-200 disabled:cursor-not-allowed text-white p-2.5 rounded-sm transition-colors flex items-center justify-center shrink-0 shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
