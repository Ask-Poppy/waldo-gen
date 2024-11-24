type Message = {
  role: string;
  content: string;
};

type Conversation = {
  messages: Message[];
};

function convertToJSONL(conversations: { messages: Message[] }[]): string {
  return conversations
    .map(conv => ({
      messages: conv.messages.map(({ role, content }) => ({ role, content }))
    }))
    .map(conv => JSON.stringify(conv))
    .join('\n');
}

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'save') {
    try {
      const { conversations, fileHandle } = data;
      
      if (!fileHandle) {
        throw new Error('No file handle provided');
      }

      console.log('Worker: Converting to JSONL');
      const content = convertToJSONL(conversations);
      
      console.log('Worker: Creating writable');
      const writable = await fileHandle.createWritable();
      
      console.log('Worker: Writing content');
      await writable.write(new TextEncoder().encode(content));
      
      console.log('Worker: Closing writable');
      await writable.close();
      
      console.log('Worker: Save completed');
      self.postMessage({ type: 'save_success' });
    } catch (error) {
      console.error('Worker error:', error);
      self.postMessage({ 
        type: 'save_error', 
        error: error.message || 'Unknown error in worker'
      });
    }
  }
};

export {};
