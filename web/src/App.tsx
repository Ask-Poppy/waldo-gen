import React from 'react';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { ConversationHeader } from './components/ConversationHeader';
import { ConversationTabs } from './components/ConversationTabs';
import type { Message, Conversation, MessageRole } from './types';
import { loadFromLocalStorage } from './utils/fileIO';

function App() {
  // Load initial state from localStorage or use default
  const [conversations, setConversations] = React.useState<Conversation[]>(() => {
    const saved = loadFromLocalStorage();
    return saved.length > 0 ? saved : [{
      id: '1',
      title: 'c_1',
      messages: [],
      lastModified: new Date().toISOString()
    }];
  });
  const [activeConversation, setActiveConversation] = React.useState<string>('1');
  const [nextRole, setNextRole] = React.useState<MessageRole>('user');

  const addMessage = (content: string, role: MessageRole) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversation) {
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
    }));
    setNextRole(role === 'user' ? 'assistant' : 'user');
  };

  const editMessage = (messageId: string, newContent: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          messages: conv.messages.map(msg => 
            msg.id === messageId ? { ...msg, content: newContent } : msg
          ),
          lastModified: new Date().toISOString()
        };
      }
      return conv;
    }));
  };

  const deleteMessage = (messageId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          messages: conv.messages.filter(msg => msg.id !== messageId),
          lastModified: new Date().toISOString()
        };
      }
      return conv;
    }));
  };

  const reorderMessages = (newMessages: Message[]) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          messages: newMessages,
          lastModified: new Date().toISOString()
        };
      }
      return conv;
    }));
  };

  const addNewConversation = () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: `c_${conversations.length + 1}`,
      messages: [],
      lastModified: new Date().toISOString()
    };
    setConversations(prev => [...prev, newConv]);
    setActiveConversation(newConv.id);
    setNextRole('user');
  };

  const handleImport = (importedConversations: Conversation[]) => {
    setConversations(prev => [...prev, ...importedConversations]);
    if (importedConversations.length > 0) {
      setActiveConversation(importedConversations[0].id);
    }
  };

  const renameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, title: newTitle } : conv
    ));
  };

  const currentConversation = conversations.find(c => c.id === activeConversation);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <ConversationHeader 
          onNewConversation={addNewConversation}
          onImport={handleImport}
          conversations={conversations}
        />
        
        <ConversationTabs 
          conversations={conversations}
          activeId={activeConversation}
          onSelect={setActiveConversation}
          onRename={renameConversation}
        />

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 min-h-[300px] max-h-[600px] overflow-y-auto">
            <MessageList
              messages={currentConversation?.messages || []}
              onReorder={reorderMessages}
              onEdit={editMessage}
              onDelete={deleteMessage}
            />
          </div>
          <div className="border-t">
            <MessageInput onSend={addMessage} currentRole={nextRole} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;