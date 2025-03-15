import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Tag, Star, FolderOpen, Terminal } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
    variant?: 'default' | 'danger' | 'success';
  }[];
}

export function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  
  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      // Adjust X position if menu goes off right edge
      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 10;
      }
      
      // Adjust Y position if menu goes off bottom edge
      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 10;
      }
      
      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] animate-fadeIn"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      ref={menuRef}
    >
      {options.map(option => (
        <button
          key={option.id}
          onClick={() => {
            option.action();
            onClose();
          }}
          className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-100 ${
            option.variant === 'danger' ? 'text-red-600 hover:bg-red-50' :
            option.variant === 'success' ? 'text-green-600 hover:bg-green-50' :
            'text-gray-700'
          }`}
        >
          <span className="w-5 h-5 flex items-center justify-center">
            {option.icon}
          </span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

// Utility function to create context menu options for conversations
export function createConversationContextMenu(
  conversationId: string,
  isPinned: boolean,
  onRename: (id: string) => void,
  onDelete: (id: string) => void,
  onPin: (id: string, pinned: boolean) => void,
  onMove: (id: string) => void,
  onTag: (id: string) => void,
  onSystemPrompt?: (id: string) => void
) {
  const menuItems = [
    {
      id: 'rename',
      label: 'Rename',
      icon: <Edit2 className="w-4 h-4" />,
      action: () => onRename(conversationId),
    },
    {
      id: 'pin',
      label: isPinned ? 'Unpin' : 'Pin',
      icon: <Star className="w-4 h-4" />,
      action: () => onPin(conversationId, !isPinned),
      variant: 'success',
    },
    {
      id: 'move',
      label: 'Move to folder',
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => onMove(conversationId),
    },
  ];
  
  if (onSystemPrompt) {
    menuItems.push({
      id: 'system-prompt',
      label: 'Edit System Prompt',
      icon: <Terminal className="w-4 h-4" />,
      action: () => onSystemPrompt(conversationId),
      variant: 'success',
    });
  }
  
  menuItems.push({
    id: 'tag',
    label: 'Add tags',
    icon: <Tag className="w-4 h-4" />,
    action: () => onTag(conversationId),
  });
  
  menuItems.push({
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    action: () => onDelete(conversationId),
    variant: 'danger',
  });
  
  return menuItems;
}

// Utility function to create folder context menu options
export function createFolderContextMenu(
  folderId: string,
  onRename: (id: string) => void,
  onDelete: (id: string) => void,
  onAddConversation: (folderId: string) => void,
  onAddSubfolder: (parentId: string) => void
) {
  return [
    {
      id: 'rename',
      label: 'Rename',
      icon: <Edit2 className="w-4 h-4" />,
      action: () => onRename(folderId),
    },
    {
      id: 'add-conversation',
      label: 'New conversation',
      icon: <Edit2 className="w-4 h-4" />,
      action: () => onAddConversation(folderId),
      variant: 'success',
    },
    {
      id: 'add-subfolder',
      label: 'New subfolder',
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => onAddSubfolder(folderId),
    },
    {
      id: 'delete',
      label: 'Delete folder',
      icon: <Trash2 className="w-4 h-4" />,
      action: () => onDelete(folderId),
      variant: 'danger',
    },
  ];
}