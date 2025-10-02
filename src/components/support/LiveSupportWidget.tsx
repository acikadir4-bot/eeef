import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { blogService, LiveChatMessage } from '../../services/blogService';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { getTimeAgo } from '../../utils/dateUtils';

export function LiveSupportWidget() {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mobil cihaz kontrolü
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Hoş geldin mesajı
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: LiveChatMessage = {
        id: 'welcome',
        userName: 'AI Asistan',
        message: '👋 Merhaba! İşBuldum AI asistanıyım. Size nasıl yardımcı olabilirim?\n\n• İş arama\n• CV hazırlama\n• Platform kullanımı\n• Hızlı sorular',
        timestamp: Date.now(),
        isResolved: false
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Mobilde açıldığında otomatik full screen
  useEffect(() => {
    if (isOpen && isMobile) {
      setIsFullScreen(true);
      // Body scroll'u engelle
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, isMobile]);

  // Input focus için scroll önleme
  useEffect(() => {
    if (isOpen && inputRef.current && isMobile) {
      const handleFocus = () => {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      };
      
      inputRef.current.addEventListener('focus', handleFocus);
      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('focus', handleFocus);
        }
      };
    }
  }, [isOpen, isMobile]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Kullanıcı mesajını ekle
      const userName = user?.email?.split('@')[0] || 'Ziyaretçi';
      
      const newMessage = await blogService.handleLiveSupportMessage(
        userName,
        userMessage,
        user?.id,
        window.location.pathname
      );

      // Mesajları güncelle
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          userName,
          message: userMessage,
          timestamp: Date.now(),
          isResolved: false
        },
        {
          id: `ai-${Date.now()}`,
          userName: 'AI Asistan',
          message: newMessage.aiResponse || 'Yanıt oluşturulamadı',
          timestamp: Date.now() + 1000,
          isResolved: false
        }
      ]);

    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          userName: 'AI Asistan',
          message: '🤖 Teknik sorun yaşıyorum. Lütfen tekrar deneyin.',
          timestamp: Date.now(),
          isResolved: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsFullScreen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group animate-pulse touch-target"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed z-50 bg-white shadow-2xl border border-gray-200 transition-all duration-300 ${
          isFullScreen || isMobile 
            ? 'inset-0 rounded-none' 
            : 'bottom-4 right-4 w-80 sm:w-96 h-96 rounded-xl'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white ${
            isFullScreen || isMobile ? 'rounded-none' : 'rounded-t-xl'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">AI Canlı Destek</h3>
                <p className="text-xs opacity-90">Anında yanıt alın</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isMobile && (
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1 hover:bg-white/20 rounded transition-colors touch-target"
                >
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded transition-colors touch-target"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`overflow-y-auto p-4 space-y-4 ${
            isFullScreen || isMobile ? 'h-[calc(100vh-140px)]' : 'h-64'
          }`}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userName === 'AI Asistan' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.userName === 'AI Asistan'
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-900 border border-purple-200'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.userName === 'AI Asistan' && (
                      <Sparkles className="h-3 w-3 text-purple-600" />
                    )}
                    <span className="text-xs font-medium">{message.userName}</span>
                    <span className="text-xs opacity-70">{getTimeAgo(message.timestamp)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-purple-600 animate-pulse" />
                    <span className="text-xs text-gray-600">AI yazıyor...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - Mobilde sabit alt kısım */}
          <div className={`p-4 border-t border-gray-200 bg-white ${
            isFullScreen || isMobile ? 'sticky bottom-0' : ''
          }`}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Kısa sorunuzu yazın..."
                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm touch-target"
                disabled={isLoading}
                maxLength={200}
                style={{ fontSize: '16px' }} // iOS zoom önleme
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                🤖 AI asistan - Kısa net yanıtlar
              </p>
              <span className="text-xs text-gray-400">
                {inputMessage.length}/200
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobil Full Screen Overlay */}
      {isOpen && (isFullScreen || isMobile) && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={handleClose} />
      )}
    </>
  );
}