import React from 'react';
import { MessagesSquare, Plus } from 'lucide-react';
import { FileControls } from './FileControls';
import type { Conversation } from '../types';

interface ConversationHeaderProps {
  onNewConversation: () => void;
  onImport: (conversations: Conversation[]) => void;
  conversations: Conversation[];
}

export function ConversationHeader({ onNewConversation, onImport, conversations }: ConversationHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        <MessagesSquare className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Conversation Editor</h1>
          <p className="text-sm text-gray-500">Create and edit AI conversations</p>
        </div>
      </div>
      <div className="flex gap-2">
        <FileControls onImport={onImport} conversations={conversations} />
        <button
          onClick={onNewConversation}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>
    </header>
  );
}