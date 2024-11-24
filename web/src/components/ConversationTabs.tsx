import React from 'react';
import { type Conversation } from '../types';

interface ConversationTabsProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function ConversationTabs({ conversations, activeId, onSelect, onRename }: ConversationTabsProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDoubleClick = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  React.useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 px-1">
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          onDoubleClick={() => handleDoubleClick(conv)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
            conv.id === activeId
              ? 'bg-blue-600 text-white shadow-md scale-105'
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
        >
          {editingId === conv.id ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent border-none outline-none focus:ring-0 px-0 py-0 w-20 text-inherit"
            />
          ) : (
            <span>{conv.title}</span>
          )}
        </button>
      ))}
    </div>
  );
}