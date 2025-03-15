import React, { useState, useRef } from 'react';
import { 
  Folder as FolderIcon, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2, 
  MessageSquare,
  Star,
  Tag,
  Hash,
  Move
} from 'lucide-react';
import type { Conversation, Folder } from '../types';
import { ContextMenu, createConversationContextMenu } from './ContextMenu';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface SidebarProps {
  folders: Folder[];
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onToggleFolderExpanded: (id: string) => void;
  onCreateConversation: (folderId: string | null) => void;
  onMoveConversation: (conversationId: string, folderId: string | null) => void;
  onMoveFolder: (folderId: string, newParentId: string | null) => void;
  onPinConversation: (conversationId: string, pinned: boolean) => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, title: string) => void;
  onUpdateSystemPrompt: (conversationId: string, systemPrompt: string) => void;
}

export function Sidebar({
  folders,
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderExpanded,
  onCreateConversation,
  onMoveConversation,
  onMoveFolder,
  onPinConversation,
  onDeleteConversation,
  onRenameConversation,
  onUpdateSystemPrompt
}: SidebarProps) {
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingConversationTitle, setEditingConversationTitle] = useState<string>('');
  const [editingSystemPrompt, setEditingSystemPrompt] = useState<{ id: string, prompt: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'conversation' | 'folder' } | null>(null);
  
  // Get root folders and build folder hierarchy
  const rootFolders = folders.filter(folder => folder.parentId === null);
  
  // Get conversations without folders (in root), sorted by last modified
  const rootConversations = conversations
    .filter(conv => conv.folderId === null && !conv.pinned)
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  
  // Get pinned conversations, sorted by last modified
  const pinnedConversations = conversations
    .filter(conv => conv.pinned)
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  
  // Function to get subfolders for a folder
  const getSubfolders = (folderId: string) => {
    return folders.filter(folder => folder.parentId === folderId);
  };
  
  // Function to get conversations in a folder, sorted by last modified
  const getConversationsInFolder = (folderId: string) => {
    return conversations
      .filter(conv => conv.folderId === folderId && !conv.pinned)
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  };
  
  // Handle creating a new folder
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderParentId);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };
  
  // Handle updating a folder name
  const handleUpdateFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      onRenameFolder(editingFolderId, editingFolderName.trim());
      setEditingFolderId(null);
    }
  };
  
  // Handle updating a conversation title
  const handleUpdateConversation = () => {
    if (editingConversationId && editingConversationTitle.trim()) {
      onRenameConversation(editingConversationId, editingConversationTitle.trim());
      setEditingConversationId(null);
    }
  };
  
  // Handle context menu for conversation
  const handleConversationContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      id,
      type: 'conversation'
    });
  };
  
  // Handle context menu for folder
  const handleFolderContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      id,
      type: 'folder'
    });
  };
  
  // Draggable and droppable folder component
  const DraggableFolderItem = ({ folder }: { folder: Folder }) => {
    const isExpanded = folder.expanded;
    const subfolders = getSubfolders(folder.id);
    const folderConversations = getConversationsInFolder(folder.id);
    
    // Setup drag
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: ItemTypes.FOLDER,
      item: { id: folder.id, type: 'folder' },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }));
    
    // Setup drop for other folders
    const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
      accept: [ItemTypes.FOLDER, ItemTypes.CONVERSATION],
      drop: (item: { id: string, type: string }, monitor) => {
        // Handle different item types
        if (item.type === 'folder' || monitor.getItemType() === ItemTypes.FOLDER) {
          if (item.id !== folder.id) { // Prevent dropping on itself
            onMoveFolder(item.id, folder.id);
          }
        } else {
          onMoveConversation(item.id, folder.id);
        }
      },
      canDrop: (item) => {
        // Prevent dropping a folder on itself or its descendants
        if (item.type === 'folder') {
          if (item.id === folder.id) return false;
          
          // Check if this would create a circular reference
          const wouldCreateCircular = (parentId: string | null): boolean => {
            if (parentId === item.id) return true;
            if (parentId === null) return false;
            
            const parent = folders.find(f => f.id === parentId);
            return parent ? wouldCreateCircular(parent.parentId) : false;
          };
          
          return !wouldCreateCircular(folder.id);
        }
        return true;
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      })
    }));
    
    // Combine refs for both drag and drop
    const combinedRef = (node: HTMLDivElement) => {
      dragRef(node);
      dropRef(node);
    };
    
    return (
      <div 
        ref={combinedRef}
        className={`mb-1 ${isDragging ? 'opacity-50' : 'opacity-100'} ${
          isOver && canDrop ? 'bg-blue-50 border border-blue-200 rounded-md' : ''
        }`}
      >
        <div className="flex items-center group">
          <button 
            onClick={() => onToggleFolderExpanded(folder.id)}
            className="mr-1 p-1 text-gray-500 hover:text-gray-700"
            aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {editingFolderId === folder.id ? (
            <div className="flex-1 flex">
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateFolder();
                  if (e.key === 'Escape') setEditingFolderId(null);
                }}
                onBlur={handleUpdateFolder}
                autoFocus
                className="flex-1 py-1 px-2 border border-blue-300 rounded-md text-sm"
              />
            </div>
          ) : (
            <div 
              className={`flex-1 flex items-center gap-2 py-1 px-2 rounded-md text-sm hover:bg-gray-200 ${
                folder.color ? `border-l-4 border-${folder.color}-500` : ''
              }`}
              onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
            >
              <FolderIcon className="w-4 h-4 text-gray-500" />
              <span className="flex-1 truncate">{folder.name}</span>
              
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <button
                  onClick={() => {
                    setEditingFolderId(folder.id);
                    setEditingFolderName(folder.name);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  aria-label="Rename folder"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteFolder(folder.id)}
                  className="p-1 text-gray-500 hover:text-red-600"
                  aria-label="Delete folder"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onCreateConversation(folder.id)}
                  className="p-1 text-gray-500 hover:text-blue-600"
                  aria-label="New conversation in this folder"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className="pl-6 mt-1">
            {folderConversations.map(conv => renderConversation(conv))}
            
            {subfolders.map(subfolder => renderFolder(subfolder))}
            
            {newFolderParentId === folder.id && isCreatingFolder && (
              <div className="flex items-center ml-5 mt-1">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New folder name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setIsCreatingFolder(false);
                  }}
                  autoFocus
                  className="flex-1 py-1 px-2 border border-blue-300 rounded-md text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render a folder and its contents recursively
  const renderFolder = (folder: Folder) => {
    return (
      <DraggableFolderItem key={folder.id} folder={folder} />
    );
  };
  
  // Drag item types
  const ItemTypes = {
    CONVERSATION: 'conversation',
    FOLDER: 'folder'
  };
  
  // Handle system prompt update
  const handleUpdateSystemPrompt = () => {
    if (editingSystemPrompt) {
      onUpdateSystemPrompt(editingSystemPrompt.id, editingSystemPrompt.prompt);
      setEditingSystemPrompt(null);
    }
  };
  
  // Simplified draggable conversation component
  const DraggableConversation = ({ conversation, isActive, hasMessages }: { 
    conversation: Conversation, 
    isActive: boolean, 
    hasMessages: boolean 
  }) => {
    const dragRef = useRef(null);
    
    // Setup drag with ref
    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.CONVERSATION,
      item: { id: conversation.id, type: 'conversation' },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    });
    
    // Connect the drag ref
    drag(dragRef);
    
    return (
      <div 
        ref={dragRef}
        className={`flex items-center py-2 px-3 rounded-md text-sm mb-1 cursor-grab border border-transparent ${
          isDragging ? 'opacity-60 border-blue-300 bg-blue-50' : 
          isActive ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
        }`}
        onClick={() => onSelectConversation(conversation.id)}
        onContextMenu={(e) => handleConversationContextMenu(e, conversation.id)}
      >
        <div className="flex items-center flex-1 min-w-0">
          <MessageSquare className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
          
          {editingConversationId === conversation.id ? (
            <input
              type="text"
              value={editingConversationTitle}
              onChange={(e) => setEditingConversationTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateConversation();
                if (e.key === 'Escape') setEditingConversationId(null);
              }}
              onBlur={handleUpdateConversation}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="flex-1 py-0 px-1 border border-blue-300 rounded-md text-sm min-w-0"
            />
          ) : (
            <span className="truncate flex-1">
              {conversation.title}
              {!hasMessages && <span className="text-gray-400 ml-1">(empty)</span>}
            </span>
          )}
        </div>
        
        <div className="flex ml-2 gap-1 flex-shrink-0">
          {conversation.pinned && (
            <Star className="w-3 h-3 text-yellow-500" />
          )}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingConversationId(conversation.id);
                setEditingConversationTitle(conversation.title);
              }}
              className="p-1 text-gray-400 hover:text-blue-600"
              aria-label="Rename conversation"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this conversation?")) {
                  onDeleteConversation(conversation.id);
                }
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Improved droppable folder component
  const DroppableFolder = ({ folder, children }: { folder: Folder, children: React.ReactNode }) => {
    const dropRef = useRef(null);
    
    // Setup drop with ref
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: [ItemTypes.CONVERSATION, ItemTypes.FOLDER],
      drop: (item: { id: string, type: string }, monitor) => {
        if (!monitor.didDrop()) {
          if (item.type === 'conversation') {
            onMoveConversation(item.id, folder.id);
          } else if (item.type === 'folder' && item.id !== folder.id) {
            onMoveFolder(item.id, folder.id);
          }
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      })
    });
    
    // Connect the drop ref
    drop(dropRef);
    
    return (
      <div 
        ref={dropRef}
        className={`${isOver && canDrop ? 'bg-blue-50 border border-blue-200 rounded-md' : ''}`}
      >
        {children}
      </div>
    );
  };
  
  // Render a single conversation item
  const renderConversation = (conversation: Conversation) => {
    const isActive = conversation.id === activeConversationId;
    const hasMessages = conversation.messages.length > 0;
    
    return (
      <DraggableConversation 
        key={conversation.id}
        conversation={conversation}
        isActive={isActive}
        hasMessages={hasMessages}
      />
    );
  };

  // Improved root drop area for unsorted conversations and folders
  const RootDropArea = ({ children }: { children: React.ReactNode }) => {
    const dropRef = useRef(null);
    
    // Setup drop with ref
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: [ItemTypes.CONVERSATION, ItemTypes.FOLDER],
      drop: (item: { id: string, type: string }, monitor) => {
        if (!monitor.didDrop()) {
          if (item.type === 'folder') {
            onMoveFolder(item.id, null);
          } else {
            onMoveConversation(item.id, null);
          }
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      })
    });
    
    // Connect the drop ref
    drop(dropRef);
    
    return (
      <div 
        ref={dropRef}
        className={`${isOver && canDrop ? 'bg-blue-50 border border-blue-200 rounded-md p-2' : 'p-2'}`}
      >
        {children}
      </div>
    );
  };
  
  // Move to folder modal dialog
  const renderMoveToFolderDialog = () => {
    if (!contextMenu || contextMenu.type !== 'conversation') return null;
    
    const conversationId = contextMenu.id;
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return null;
    
    const folderOptions = [
      { id: 'root', name: '(No folder)' },
      ...folders.map(f => ({ id: f.id, name: f.name }))
    ];
    
    const handleMove = (folderId: string | null) => {
      onMoveConversation(conversationId, folderId);
      setContextMenu(null);
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 w-80">
          <h3 className="text-lg font-medium mb-3">Move to folder</h3>
          <div className="max-h-60 overflow-y-auto mb-3">
            {folderOptions.map(folder => (
              <button
                key={folder.id}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center ${
                  conversation.folderId === (folder.id === 'root' ? null : folder.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleMove(folder.id === 'root' ? null : folder.id)}
              >
                {folder.id === 'root' ? (
                  <Hash className="w-4 h-4 mr-2 text-gray-500" />
                ) : (
                  <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
                )}
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
              onClick={() => setContextMenu(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-64 h-full bg-white border-r border-gray-200 p-3 overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium">Conversations</h2>
          <button
            onClick={() => onCreateConversation(null)}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label="New conversation"
          >
            <Plus className="w-4 h-4 text-blue-600" />
          </button>
        </div>
        
        {/* Pinned conversations section */}
        {pinnedConversations.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <Star className="w-3 h-3 mr-1" />
              <span>PINNED</span>
            </div>
            <div className="space-y-1">
              {pinnedConversations.map(conv => renderConversation(conv))}
            </div>
          </div>
        )}
        
        {/* Root folders */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <div className="flex items-center">
              <FolderIcon className="w-3 h-3 mr-1" />
              <span>FOLDERS</span>
            </div>
            <button
              onClick={() => {
                setNewFolderParentId(null);
                setIsCreatingFolder(true);
                setNewFolderName('');
              }}
              className="p-1 hover:text-blue-600"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          {newFolderParentId === null && isCreatingFolder && (
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setIsCreatingFolder(false);
                }}
                autoFocus
                className="flex-1 py-1 px-2 border border-blue-300 rounded-md text-sm"
              />
            </div>
          )}
          
          <RootDropArea>
            {rootFolders.map(folder => renderFolder(folder))}
          </RootDropArea>
        </div>
        
        {/* Conversations without folders */}
        {rootConversations.length > 0 && (
          <div>
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <Hash className="w-3 h-3 mr-1" />
              <span>UNSORTED</span>
            </div>
            <RootDropArea>
              <div className="space-y-1">
                {rootConversations.map(conv => renderConversation(conv))}
              </div>
            </RootDropArea>
          </div>
        )}
        
        {/* Context menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            options={
              contextMenu.type === 'conversation'
                ? createConversationContextMenu(
                    contextMenu.id,
                    !!conversations.find(c => c.id === contextMenu.id)?.pinned,
                    (id) => {
                      const conv = conversations.find(c => c.id === id);
                      if (conv) {
                        setEditingConversationId(id);
                        setEditingConversationTitle(conv.title);
                      }
                      setContextMenu(null);
                    },
                    (id) => {
                      onDeleteConversation(id);
                      setContextMenu(null);
                    },
                    onPinConversation,
                    (id) => {
                      // Show move dialog instead of immediately moving
                      // We keep the context menu open for this
                    },
                    (id) => {
                      // Tag conversation logic (would need to add to App.tsx)
                      setContextMenu(null);
                    },
                    (id) => {
                      const conversation = conversations.find(c => c.id === id);
                      if (conversation) {
                        setEditingSystemPrompt({
                          id,
                          prompt: conversation.systemPrompt || ''
                        });
                      }
                      setContextMenu(null);
                    }
                  )
                : []
            }
          />
        )}
        
        {/* Modal dialogs */}
        {contextMenu && contextMenu.type === 'conversation' && (
          renderMoveToFolderDialog()
        )}
        
        {/* System Prompt Editor Modal */}
        {editingSystemPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-4 w-[500px] max-w-full max-h-[90vh] flex flex-col">
              <h3 className="text-lg font-medium mb-3">
                System Prompt for "{conversations.find(c => c.id === editingSystemPrompt.id)?.title || 'Conversation'}"
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Set a system prompt that will guide the assistant's behavior in this conversation.
              </p>
              <textarea
                value={editingSystemPrompt.prompt}
                onChange={(e) => setEditingSystemPrompt({
                  ...editingSystemPrompt,
                  prompt: e.target.value
                })}
                placeholder="Enter system instructions here. For example: 'You are a helpful assistant that...' "
                className="flex-1 min-h-[200px] p-3 border border-gray-200 rounded-md resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
                  onClick={() => setEditingSystemPrompt(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  onClick={handleUpdateSystemPrompt}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}