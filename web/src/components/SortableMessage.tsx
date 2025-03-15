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
    ? 'bg-blue-600 text-white'
    : 'bg-gray-100 text-gray-800';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 group ${
        isDragging ? 'opacity-70 bg-gray-50' : ''
      } ${isUser ? 'justify-end' : 'justify-start'} w-full mb-3`}
    >
      {/* Avatar and handle for assistant messages */}
      {!isUser && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex items-center px-1 self-start mt-1 opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
          <Bot className="w-6 h-6 text-gray-600 flex-shrink-0 self-start" />
        </>
      )}

      {/* Message content */}
      <div className={`flex flex-col max-w-[80%]`}>
        <div className={`rounded-lg px-3 py-2 ${bubbleClass} ${isEditing ? 'border border-blue-300 ring-1 ring-blue-200' : ''}`}>
          {isEditing ? (
            <textarea
              className="w-full min-h-[60px] p-1 text-gray-800 rounded border-none focus:outline-none text-sm bg-transparent"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          )}
        </div>
        
        {/* Message actions */}
        <div className="flex gap-1 mt-0.5 text-xs">
          {isEditing ? (
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                className="text-blue-600 hover:underline"
              >
                Save
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-1 text-gray-400 items-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out flex gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="hover:text-blue-600"
                >
                  Edit
                </button>
                <span>•</span>
                <button
                  onClick={() => onDelete(message.id)}
                  className="hover:text-red-600"
                >
                  Delete
                </button>
              </div>
              <span className="text-gray-300 text-[10px] ml-1">
                {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Avatar and handle for user messages */}
      {isUser && (
        <>
          <UserCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 self-start" />
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex items-center px-1 self-start mt-1 opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        </>
      )}
    </div>
  );
}