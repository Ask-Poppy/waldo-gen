import { Upload, FileJson, AlertTriangle, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { openFile } from '../utils/fileIO';
import type { Conversation } from '../types';

interface FileControlsProps {
  onImport: (conversations: Conversation[]) => void;
  conversations: Conversation[];
}

export function FileControls({ onImport, conversations }: FileControlsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => setIsSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileUpload = async () => {
    try {
      setError(null);
      setIsImporting(true);
      
      const result = await openFile();
      if (result.length > 0) {
        onImport(result);
        setIsSuccess(true);
      }
    } catch (e) {
      console.error('Error opening file:', e);
      setError('Error opening file. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex items-center">
      <div className="relative">
        <button
          onClick={handleFileUpload}
          disabled={isImporting}
          className="btn btn-secondary flex items-center gap-2"
          title="Import JSONL conversations"
        >
          {isImporting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="text-red-600 text-sm flex items-center gap-1 bg-red-50 px-3 py-2 rounded-lg animate-fadeIn ml-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {isSuccess && !error && (
        <div className="text-green-600 text-sm flex items-center gap-1 bg-green-50 px-3 py-2 rounded-lg animate-fadeIn ml-2">
          <Save className="w-4 h-4" />
          Import successful
        </div>
      )}
    </div>
  );
}