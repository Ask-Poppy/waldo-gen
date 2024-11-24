import type { Conversation, JSONLConversation, Message } from '../types';

function convertToJSONL(conversations: Conversation[]): string {
  return conversations
    .map(conv => ({
      messages: conv.messages.map(({ role, content }) => ({ role, content }))
    }))
    .map(conv => JSON.stringify(conv))
    .join('\n');
}

export function parseJSONL(content: string): Conversation[] {
  const conversations: Conversation[] = [];
  const lines = content.split('\n').filter(line => line.trim());

  lines.forEach((line, index) => {
    try {
      const jsonlConv: JSONLConversation = JSON.parse(line);
      const messages: Message[] = jsonlConv.messages.map(msg => ({
        id: crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date().toISOString()
      }));

      conversations.push({
        id: crypto.randomUUID(),
        title: `c_${index + 1}`,
        messages,
        lastModified: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error parsing JSONL line:', e);
    }
  });

  return conversations;
}

export function downloadJSONL(conversations: Conversation[]) {
  const content = convertToJSONL(conversations);
  const blob = new Blob([content], { type: 'application/x-jsonlines' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'conversations.jsonl';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function saveToLocalStorage(conversations: Conversation[]) {
  try {
    // Save full conversation objects (including titles) to localStorage
    localStorage.setItem('currentJSONL', JSON.stringify(conversations));
    return true;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return false;
  }
}

export function loadFromLocalStorage(): Conversation[] {
  try {
    const content = localStorage.getItem('currentJSONL');
    if (!content) {
      return [];
    }
    // Parse full conversation objects from localStorage
    return JSON.parse(content);
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    return [];
  }
}

export async function openFile(): Promise<Conversation[]> {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSONL files',
        accept: { 'application/x-jsonlines': ['.jsonl'] }
      }],
      multiple: false
    });
    
    const file = await fileHandle.getFile();
    const content = await file.text();
    const conversations = parseJSONL(content);
    
    // Save to localStorage immediately after opening
    saveToLocalStorage(conversations);
    
    return conversations;
  } catch (e) {
    console.error('Error opening file:', e);
    return [];
  }
}