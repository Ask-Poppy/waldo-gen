import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, UserCircle2, Bot } from 'lucide-react';
import type { Message } from '../types';

interface SortableMessageProps {
  message: Message;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function SortableMessage({ message, onEdit, onDelete }: SortableMessageProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(message.content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onEdit(message.id, editContent);
    setIsEditing(false);
  };

  const isUser = message.role === 'user';
  const bubbleClass = isUser
    ? 'bg-blue-600 text-white ml-auto'
    : 'bg-gray-100 text-gray-800';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-3 max-w-[80%] ${isUser ? 'ml-auto' : ''} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex items-center px-1"
      >
        <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </div>

      {!isUser && (
        <Bot className="w-8 h-8 text-gray-600 flex-shrink-0 mt-1" />
      )}

      <div className="flex flex-col flex-1">
        <div className={`rounded-2xl px-4 py-2 ${bubbleClass} shadow-sm`}>
          {isEditing ? (
            <textarea
              className="w-full min-h-[100px] p-2 text-gray-800 rounded border focus:ring-2 focus:ring-blue-500 outline-none"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <div className="flex gap-2 mt-1 text-xs text-gray-500">
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="hover:text-blue-600"
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="hover:text-blue-600"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => onDelete(message.id)}
            className="hover:text-red-600"
          >
            Delete
          </button>
          <span className="ml-auto">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {isUser && (
        <UserCircle2 className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
      )}
    </div>
  );
}