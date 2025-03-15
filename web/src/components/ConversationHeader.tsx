import React, { useState } from 'react';
import { MessagesSquare, Save, FolderTree, Download } from 'lucide-react';
import { FileControls } from './FileControls';
import type { Conversation, Folder } from '../types';
import { downloadWorkspace, downloadJSONL } from '../utils/fileIO';

interface ConversationHeaderProps {
  onNewConversation: () => void;
  onImport: (conversations: Conversation[]) => void;
  conversations: Conversation[];
  folders?: Folder[];
}

export function ConversationHeader({ 
  onImport, 
  conversations,
  folders = []
}: ConversationHeaderProps) {
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const handleExportWorkspace = () => {
    downloadWorkspace(conversations, folders);
    setShowExportOptions(false);
  };
  
  const handleExportConversations = () => {
    downloadJSONL(conversations);
    setShowExportOptions(false);
  };
  
  return (
    <header className="flex flex-col bg-white border-b border-gray-200">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <MessagesSquare className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Waldo</h1>
            <p className="text-sm text-gray-500">Synthetic Conversation Generator</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="btn btn-secondary flex items-center gap-2"
              aria-label="Export options"
            >
              <Save className="w-4 h-4" />
              Export
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 animate-fadeIn">
                <div className="p-2">
                  <button
                    onClick={handleExportWorkspace}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-gray-100 rounded"
                  >
                    <FolderTree className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Export Workspace</div>
                      <div className="text-xs text-gray-500">Include folders and settings</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleExportConversations}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-gray-100 rounded"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Export as JSONL</div>
                      <div className="text-xs text-gray-500">For AI fine-tuning</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <FileControls onImport={onImport} conversations={conversations} />
        </div>
      </div>
    </header>
  );
}