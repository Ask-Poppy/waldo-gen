export type MessageRole = 'assistant' | 'user' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  expanded: boolean;
  color?: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  title: string;
  lastModified: string;
  folderId: string | null;
  tags?: string[];
  description?: string;
  pinned?: boolean;
  systemPrompt?: string;
}

export interface JSONLMessage {
  role: MessageRole;
  content: string;
}

export interface JSONLConversation {
  messages: JSONLMessage[];
  title?: string;
  description?: string;
  tags?: string[];
}

export type DisplayMode = 'grid' | 'list';

export interface AppSettings {
  sidebarWidth: number;
  displayMode: DisplayMode;
  showSystemMessages: boolean;
  theme: 'light' | 'dark' | 'system';
  defaultFolderId: string | null;
}

export interface FolderWithConversations extends Folder {
  conversations: Conversation[];
  subfolders: FolderWithConversations[];
}