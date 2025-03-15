import type { 
  Conversation, 
  JSONLConversation, 
  Message, 
  MessageRole,
  Folder,
  AppSettings
} from '../types';

// Default app settings
const DEFAULT_SETTINGS: AppSettings = {
  sidebarWidth: 260,
  displayMode: 'list',
  showSystemMessages: true,
  theme: 'light',
  defaultFolderId: null
};

/**
 * Converts conversations to JSONL format with the structure:
 * {"messages":[{"role":"system","content":""},{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
 */
function convertToJSONL(conversations: Conversation[]): string {
  return conversations
    .filter(conv => conv.messages.length > 0) // Only include conversations with messages
    .map(conv => {
      // Ensure system message is first in the array
      const messages = [];
      
      // Add system message first (if exists, otherwise add empty one)
      const systemMessage = conv.systemPrompt || "";
      messages.push({ role: "system", content: systemMessage });
      
      // Add all regular messages
      conv.messages.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
      
      // Return only the messages array in the required format
      return { messages };
    })
    .map(conv => JSON.stringify(conv))
    .join('\n');
}

/**
 * Validates if a role is a valid MessageRole
 */
function isValidRole(role: string): role is MessageRole {
  return ['user', 'assistant', 'system'].includes(role);
}

/**
 * Parses JSONL content into conversations
 */
export function parseJSONL(content: string): Conversation[] {
  const conversations: Conversation[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  const errors: string[] = [];

  lines.forEach((line, index) => {
    try {
      // Parse JSON
      const parsed = JSON.parse(line);
      
      // Validate structure
      if (!parsed.messages || !Array.isArray(parsed.messages)) {
        errors.push(`Line ${index + 1}: Missing or invalid 'messages' array`);
        return;
      }
      
      // Validate messages
      const validMessages: Message[] = [];
      
      for (const msg of parsed.messages) {
        // Skip invalid messages but collect errors
        if (!msg.role || !isValidRole(msg.role)) {
          errors.push(`Line ${index + 1}: Invalid or missing role in message`);
          continue;
        }
        
        if (typeof msg.content !== 'string') {
          errors.push(`Line ${index + 1}: Missing or invalid content in message`);
          continue;
        }
        
        // Add valid message
        validMessages.push({
          id: crypto.randomUUID(),
          role: msg.role as MessageRole,
          content: msg.content,
          timestamp: new Date().toISOString()
        });
      }
      
      // Only add conversation if it has valid messages
      if (validMessages.length > 0) {
        conversations.push({
          id: crypto.randomUUID(),
          title: parsed.title || `Conversation ${index + 1}`,
          messages: validMessages,
          lastModified: new Date().toISOString(),
          folderId: null,
          tags: parsed.tags || [],
          description: parsed.description || ""
        });
      }
    } catch (e) {
      console.error('Error parsing JSONL line:', e);
      errors.push(`Line ${index + 1}: Invalid JSON`);
    }
  });

  // Log errors if any
  if (errors.length > 0) {
    console.warn('JSONL parsing warnings:', errors);
  }

  return conversations;
}

/**
 * Downloads conversations as a JSONL file
 */
export function downloadJSONL(conversations: Conversation[]) {
  const content = convertToJSONL(conversations);
  if (!content.trim()) {
    throw new Error('No valid conversations to export');
  }
  
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_').replace('T', '_').slice(0, 19);
  const filename = `waldo_conversations_${timestamp}.jsonl`;
  
  const blob = new Blob([content], { type: 'application/x-jsonlines' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { filename, lineCount: content.split('\n').length };
}

/**
 * Downloads an entire workspace (conversations + folders) as JSON
 */
export function downloadWorkspace(conversations: Conversation[], folders: Folder[]) {
  const workspace = {
    conversations,
    folders,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const content = JSON.stringify(workspace, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_').replace('T', '_').slice(0, 19);
  const filename = `waldo_workspace_${timestamp}.json`;
  
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { filename };
}

interface AppStorage {
  conversations: Conversation[];
  folders: Folder[];
  settings: AppSettings;
  lastSaved?: string;
}

/**
 * Saves the entire application state to localStorage
 */
export function saveToLocalStorage(conversations: Conversation[], folders: Folder[], settings: AppSettings = DEFAULT_SETTINGS) {
  try {
    const appData: AppStorage = {
      conversations,
      folders,
      settings,
      lastSaved: new Date().toISOString()
    };
    
    // Only store up to a reasonable limit to avoid quota issues
    const serialized = JSON.stringify(appData);
    
    // Check if we're approaching localStorage limits (typically ~5MB)
    if (serialized.length > 4000000) { // ~4MB warning
      console.warn('LocalStorage is nearly full. Consider exporting your data.');
    }
    
    localStorage.setItem('waldo_app_data', serialized);
    return true;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return false;
  }
}

/**
 * Loads the entire application state from localStorage
 */
export function loadFromLocalStorage(): AppStorage {
  const defaultReturn: AppStorage = {
    conversations: [],
    folders: [],
    settings: DEFAULT_SETTINGS
  };
  
  try {
    const content = localStorage.getItem('waldo_app_data');
    if (!content) {
      // Check for legacy data
      const legacyContent = localStorage.getItem('waldo_conversations') || localStorage.getItem('currentJSONL');
      if (legacyContent) {
        try {
          // Migrate legacy data
          const legacyConversations: Conversation[] = JSON.parse(legacyContent)
            .map((conv: any) => ({
              ...conv,
              folderId: null,
              tags: conv.tags || []
            }));
          
          return {
            conversations: legacyConversations,
            folders: [],
            settings: DEFAULT_SETTINGS
          };
        } catch (e) {
          console.error('Error migrating legacy data:', e);
        }
      }
      
      return defaultReturn;
    }
    
    const appData = JSON.parse(content) as AppStorage;
    
    // Ensure all required fields exist
    if (!appData.conversations) appData.conversations = [];
    if (!appData.folders) appData.folders = [];
    if (!appData.settings) appData.settings = DEFAULT_SETTINGS;
    
    return appData;
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    
    // Attempt to recover corrupted data
    try {
      localStorage.removeItem('waldo_app_data');
    } catch (e) {
      console.error('Failed to remove corrupted data:', e);
    }
    
    return defaultReturn;
  }
}

/**
 * Opens a JSONL file and parses its content
 */
export async function openFile(): Promise<Conversation[]> {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [
      {
        description: 'JSONL files',
        accept: { 'application/x-jsonlines': ['.jsonl'] }
      },
      {
        description: 'JSON files',
        accept: { 'application/json': ['.json'] }
      }
    ],
    multiple: false
  });
  
  const file = await fileHandle.getFile();
  
  // Check file size
  if (file.size > 15 * 1024 * 1024) { // 15MB limit
    throw new Error('File too large. Please choose a file smaller than 15MB.');
  }
  
  const content = await file.text();
  
  if (!content.trim()) {
    throw new Error('File is empty.');
  }
  
  let conversations: Conversation[] = [];
  let folders: Folder[] = [];
  
  // Check if it's a workspace file (JSON) or conversations only (JSONL)
  if (file.name.endsWith('.json')) {
    try {
      const workspace = JSON.parse(content);
      
      if (workspace.conversations && Array.isArray(workspace.conversations)) {
        conversations = workspace.conversations;
        
        // Ensure all conversations have the required fields
        conversations = conversations.map(conv => ({
          ...conv,
          id: conv.id || crypto.randomUUID(),
          folderId: conv.folderId || null,
          tags: conv.tags || [],
          lastModified: conv.lastModified || new Date().toISOString()
        }));
      }
      
      if (workspace.folders && Array.isArray(workspace.folders)) {
        folders = workspace.folders;
        
        // Ensure all folders have the required fields
        folders = folders.map(folder => ({
          ...folder,
          id: folder.id || crypto.randomUUID(),
          parentId: folder.parentId || null,
          expanded: folder.expanded !== undefined ? folder.expanded : true
        }));
      }
      
      // Update localStorage with the imported workspace
      saveToLocalStorage(conversations, folders);
      
      return conversations;
    } catch (e) {
      console.error('Error parsing workspace file:', e);
      throw new Error('Invalid workspace file format.');
    }
  } else {
    // Process as JSONL
    conversations = parseJSONL(content);
    
    if (conversations.length === 0) {
      throw new Error('No valid conversations found in file.');
    }
    
    // Get existing folders
    const { folders: existingFolders } = loadFromLocalStorage();
    
    // Save to localStorage with existing folders
    saveToLocalStorage(conversations, existingFolders);
  }
  
  return conversations;
}