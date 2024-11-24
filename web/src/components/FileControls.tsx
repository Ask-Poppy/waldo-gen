import { Download, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { downloadJSONL, openFile, saveToLocalStorage } from '../utils/fileIO';
import type { Conversation } from '../types';

interface FileControlsProps {
  onImport: (conversations: Conversation[]) => void;
  conversations: Conversation[];
}

export function FileControls({ onImport, conversations }: FileControlsProps) {
  const [error, setError] = useState<string | null>(null);

  // Always save to localStorage when conversations change
  useEffect(() => {
    saveToLocalStorage(conversations);
  }, [conversations]);

  const handleFileUpload = async () => {
    try {
      setError(null);
      const result = await openFile();
      if (result.length > 0) {
        onImport(result);
      }
    } catch (e) {
      console.error('Error opening file:', e);
      setError('Error opening file. Please try again.');
    }
  };

  const handleDownload = () => {
    try {
      downloadJSONL(conversations);
    } catch (e) {
      console.error('Error downloading file:', e);
      setError('Error downloading file. Please try again.');
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={handleFileUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        Open JSONL
      </button>
      <button
        onClick={handleDownload}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download
      </button>
      {error && (
        <div className="text-red-500 text-sm flex items-center bg-red-50 px-3 py-1 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}