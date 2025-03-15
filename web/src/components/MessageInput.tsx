import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Server } from 'lucide-react';
import type { MessageRole } from '../types';

interface MessageInputProps {
  onSend: (content: string, role: MessageRole) => void;
  currentRole: MessageRole;
}

export function MessageInput({ onSend, currentRole }: MessageInputProps) {
  const [role, setRole] = useState<MessageRole>(currentRole);
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-focus the textarea on role change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [role]);
  
  // Update local role when currentRole prop changes
  useEffect(() => {
    setRole(currentRole);
  }, [currentRole]);
  
  // Handle typing indicator
  useEffect(() => {
    if (content.trim()) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSend(content, role);
      setContent('');
      
      // Toggle role between user and assistant
      setRole(role === 'user' ? 'assistant' : 'user');
      
      // Refocus the textarea after sending
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (content.trim()) {
        handleSubmit(e);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 p-0.5 rounded">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              role === 'user' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            <User className="w-3 h-3" />
            <span>User</span>
          </button>
          
          <button
            type="button"
            onClick={() => setRole('assistant')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              role === 'assistant' 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Assistant</span>
          </button>
        </div>
        
        <div className="text-xs text-gray-400">
          {isTyping ? (
            <span className="animate-pulse">Typing...</span>
          ) : (
            <span>Press Ctrl+Enter to send</span>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 mt-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            role === 'user' 
              ? "Type your message..." 
              : "Type the assistant's response..."
          }
          className="flex-1 p-2 rounded border border-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white text-sm"
          rows={2}
        />
        
        <button
          type="submit"
          disabled={!content.trim()}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end transition-colors h-10 w-10 flex items-center justify-center"
          title="Send message (Ctrl+Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}