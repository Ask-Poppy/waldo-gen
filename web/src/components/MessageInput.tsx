import React from 'react';
import { Send, User, Bot } from 'lucide-react';
import type { MessageRole } from '../types';

interface MessageInputProps {
  onSend: (content: string, role: MessageRole) => void;
  currentRole: MessageRole;
}

export function MessageInput({ onSend, currentRole }: MessageInputProps) {
  const [content, setContent] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSend(content, currentRole);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end bg-gray-50 p-4 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 text-sm">
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            currentRole === 'user' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-purple-100 text-purple-700'
          }`}>
            {currentRole === 'user' ? (
              <>
                <User className="w-4 h-4" />
                <span>User Message</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Assistant Response</span>
              </>
            )}
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={currentRole === 'user' ? "Type your message..." : "Type the assistant's response..."}
          className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-white"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={!content.trim()}
        className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-[50px] transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
}