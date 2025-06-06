import React from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function MessageList({ messages, onEdit, onDelete }: MessageListProps) {
  return (
    <div className="pt-2 pb-4">
      {messages.map((message) => (
        <div key={message.id} className="mb-3">
          <MessageBubble message={message} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ))}

      {messages.length === 0 && (
        <div className="text-center text-gray-400 py-8 italic">
          Start your conversation by adding a message below
        </div>
      )}

      {/* Add padding at the bottom to ensure space when scrolling */}
      <div className="h-4"></div>
    </div>
  );
}