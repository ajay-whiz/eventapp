import React, { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';
import { Button } from '../../../components/atoms/Button';
import { useToast } from '../../../components/atoms/Toast';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isOwnMessage?: boolean;
}

interface ChatInterfaceProps {
  bookingId: string;
  vendorId: string;
  vendorName: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  bookingId,
  vendorId,
  vendorName,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Get current user ID from localStorage
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id || '';

  useEffect(() => {
    loadMessages();
    // Set up polling to refresh messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [bookingId, vendorId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.get(`/bookings/${bookingId}/chat`, {
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem('token')}`,
      //   },
      // });
      // setMessages(response.data?.data || []);
      
      // For now, use mock data
      // In production, replace this with actual API call
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // TODO: Replace with actual API call
      // const response = await api.post(`/bookings/${bookingId}/chat`, {
      //   message: messageText,
      //   vendorId,
      // }, {
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem('token')}`,
      //   },
      // });

      // For now, add message locally
      const tempMessage: Message = {
        id: Date.now().toString(),
        senderId: currentUserId,
        senderName: 'You',
        message: messageText,
        timestamp: new Date().toISOString(),
        isOwnMessage: true,
      };

      setMessages(prev => [...prev, tempMessage]);
      
      // Reload messages after a short delay
      setTimeout(loadMessages, 500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
            <User className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{vendorName}</p>
            <p className="text-xs text-gray-500">Vendor</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start a conversation with {vendorName}</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.isOwnMessage || message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-sky-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
            rows={2}
            disabled={sending}
          />
          <Button
            variant="primary"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};

