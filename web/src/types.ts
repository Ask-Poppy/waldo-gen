export type MessageRole = 'assistant' | 'user' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  title: string;
  lastModified: string;
}

export interface JSONLMessage {
  role: MessageRole;
  content: string;
}

export interface JSONLConversation {
  messages: JSONLMessage[];
}