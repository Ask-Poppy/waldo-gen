import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { ConversationHeader } from './components/ConversationHeader';
import { Sidebar } from './components/Sidebar';
import type { Message, Conversation, MessageRole, Folder, AppSettings } from './types';
import { loadFromLocalStorage, saveToLocalStorage, downloadWorkspace, downloadJSONL } from './utils/fileIO';

function App() {
  // Load initial state from localStorage or use default
  const [appState, setAppState] = useState(() => {
    const initialState = loadFromLocalStorage();
    
    // If no conversations exist, create a default one
    if (initialState.conversations.length === 0) {
      const defaultConversation: Conversation = {
        id: crypto.randomUUID(),
        title: 'New Conversation',
        messages: [],
        lastModified: new Date().toISOString(),
        folderId: null,
      };
      
      initialState.conversations = [defaultConversation];
    }
    
    return initialState;
  });
  
  const { conversations, folders, settings } = appState;
  
  const [activeConversationId, setActiveConversationId] = useState<string>(
    conversations.length > 0 ? conversations[0].id : ''
  );
  const [nextRole, setNextRole] = useState<MessageRole>('user');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [editingSystemPrompt, setEditingSystemPrompt] = useState<{id: string, prompt: string} | null>(null);
  
  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToLocalStorage(conversations, folders, settings);
  }, [conversations, folders, settings]);
  
  // CONVERSATION MANAGEMENT
  
  const addMessage = (content: string, role: MessageRole) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, {
              id: crypto.randomUUID(),
              content,
              role,
              timestamp: new Date().toISOString()
            }],
            lastModified: new Date().toISOString()
          };
        }
        return conv;
      });
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
    
    setNextRole(role === 'user' ? 'assistant' : 'user');
  };

  const editMessage = (messageId: string, newContent: string) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: conv.messages.map(msg => 
              msg.id === messageId ? { ...msg, content: newContent } : msg
            ),
            lastModified: new Date().toISOString()
          };
        }
        return conv;
      });
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
  };

  const deleteMessage = (messageId: string) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: conv.messages.filter(msg => msg.id !== messageId),
            lastModified: new Date().toISOString()
          };
        }
        return conv;
      });
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
  };

  const reorderMessages = (newMessages: Message[]) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: newMessages,
            lastModified: new Date().toISOString()
          };
        }
        return conv;
      });
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
  };

  const createConversation = (folderId: string | null = null) => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: `New Conversation`,
      messages: [],
      lastModified: new Date().toISOString(),
      folderId,
      tags: [],
      systemPrompt: ''
    };
    
    setAppState(prev => ({
      ...prev,
      conversations: [...prev.conversations, newConv]
    }));
    
    setActiveConversationId(newConv.id);
    setNextRole('user');
  };

  const renameConversation = (id: string, newTitle: string) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.map(conv => 
        conv.id === id ? { ...conv, title: newTitle, lastModified: new Date().toISOString() } : conv
      );
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
  };
  
  const updateSystemPrompt = (id: string, systemPrompt: string) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.map(conv => 
        conv.id === id ? { ...conv, systemPrompt, lastModified: new Date().toISOString() } : conv
      );
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
  };
  
  const pinConversation = (id: string, pinned: boolean) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.map(conv => 
        conv.id === id ? { ...conv, pinned } : conv
      );
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
  };
  
  const moveConversation = (conversationId: string, folderId: string | null) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.map(conv => 
        conv.id === conversationId ? { ...conv, folderId, lastModified: new Date().toISOString() } : conv
      );
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
  };
  
  const moveFolder = (folderId: string, newParentId: string | null) => {
    // Prevent folder from becoming its own parent or child
    if (folderId === newParentId) return;
    
    // Check if this would create a circular reference
    const wouldCreateCircular = (parentId: string | null): boolean => {
      if (parentId === folderId) return true;
      if (parentId === null) return false;
      
      const parent = folders.find(f => f.id === parentId);
      return parent ? wouldCreateCircular(parent.parentId) : false;
    };
    
    if (newParentId !== null && wouldCreateCircular(newParentId)) return;
    
    setAppState(prev => {
      const updatedFolders = prev.folders.map(folder => 
        folder.id === folderId ? { ...folder, parentId: newParentId } : folder
      );
      
      return {
        ...prev,
        folders: updatedFolders
      };
    });
  };
  
  const deleteConversation = (conversationId: string) => {
    setAppState(prev => {
      const updatedConversations = prev.conversations.filter(conv => conv.id !== conversationId);
      
      // If we're deleting the active conversation, select another one
      if (conversationId === activeConversationId && updatedConversations.length > 0) {
        setActiveConversationId(updatedConversations[0].id);
      }
      
      return {
        ...prev,
        conversations: updatedConversations
      };
    });
  };
  
  // FOLDER MANAGEMENT
  
  const createFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      parentId,
      expanded: true
    };
    
    setAppState(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder]
    }));
  };
  
  const renameFolder = (id: string, name: string) => {
    setAppState(prev => {
      const updatedFolders = prev.folders.map(folder => 
        folder.id === id ? { ...folder, name } : folder
      );
      
      return {
        ...prev,
        folders: updatedFolders
      };
    });
  };
  
  const deleteFolder = (id: string) => {
    setAppState(prev => {
      // First, move all conversations in this folder to no folder
      const updatedConversations = prev.conversations.map(conv => 
        conv.folderId === id ? { ...conv, folderId: null } : conv
      );
      
      // Remove this folder and any children
      const deleteIds = [id];
      
      // Find all child folders recursively
      const findChildFolders = (parentId: string) => {
        prev.folders.forEach(folder => {
          if (folder.parentId === parentId) {
            deleteIds.push(folder.id);
            findChildFolders(folder.id);
          }
        });
      };
      
      findChildFolders(id);
      
      const updatedFolders = prev.folders.filter(folder => !deleteIds.includes(folder.id));
      
      return {
        ...prev,
        folders: updatedFolders,
        conversations: updatedConversations
      };
    });
  };
  
  const toggleFolderExpanded = (id: string) => {
    setAppState(prev => {
      const updatedFolders = prev.folders.map(folder => 
        folder.id === id ? { ...folder, expanded: !folder.expanded } : folder
      );
      
      return {
        ...prev,
        folders: updatedFolders
      };
    });
  };
  
  // IMPORT/EXPORT
  
  const handleImport = (importedConversations: Conversation[]) => {
    setAppState(prev => ({
      ...prev,
      conversations: [...prev.conversations, ...importedConversations]
    }));
    
    if (importedConversations.length > 0) {
      setActiveConversationId(importedConversations[0].id);
    }
  };
  
  const exportWorkspace = () => {
    downloadWorkspace(conversations, folders);
  };
  
  const exportConversations = () => {
    downloadJSONL(conversations);
  };
  
  // Find the current conversation
  const currentConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <ConversationHeader 
        onNewConversation={() => createConversation()}
        onImport={handleImport}
        conversations={conversations}
        folders={folders}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-width duration-300 ease-in-out overflow-hidden`}>
          {isSidebarOpen && (
            <Sidebar 
              folders={folders}
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onCreateFolder={createFolder}
              onRenameFolder={renameFolder}
              onDeleteFolder={deleteFolder}
              onToggleFolderExpanded={toggleFolderExpanded}
              onCreateConversation={createConversation}
              onMoveConversation={moveConversation}
              onMoveFolder={moveFolder}
              onPinConversation={pinConversation}
              onDeleteConversation={deleteConversation}
              onRenameConversation={renameConversation}
              onUpdateSystemPrompt={updateSystemPrompt}
            />
          )}
        </div>
        
        {/* Toggle sidebar button */}
        <button 
          className="border-r border-gray-200 px-1 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex-shrink-0"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {isSidebarOpen ? '◀' : '▶'}
        </button>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col w-full h-full overflow-hidden">
            {/* Fixed header with title and system prompt */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-medium text-gray-800 truncate max-w-[70%]">
                  {currentConversation.title}
                </h2>
                
                <div className="text-xs text-gray-500">
                  {currentConversation.messages.length} messages
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 whitespace-nowrap">System:</label>
                <input 
                  type="text"
                  value={currentConversation.systemPrompt || ''} 
                  onChange={(e) => updateSystemPrompt(currentConversation.id, e.target.value)}
                  placeholder="Enter system instructions to guide the assistant's behavior..."
                  className="flex-1 text-xs py-1 px-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Scrollable message area that fills available space */}
            <div className="flex-1 overflow-y-auto bg-white px-1 min-h-0">
              <MessageList
                messages={currentConversation?.messages || []}
                onReorder={reorderMessages}
                onEdit={editMessage}
                onDelete={deleteMessage}
              />
            </div>
            
            {/* Fixed message input at the bottom */}
            <div className="border-t border-gray-200 px-4 py-3 bg-white flex-shrink-0 sticky bottom-0 mt-auto">
              <MessageInput onSend={addMessage} currentRole={nextRole} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;