'use client';

import { useState, useEffect } from 'react';
import { FileList } from '@/components/FileList';
import { JsonEditor } from '@/components/JsonEditor';
import { Header } from '@/components/Header';

interface JsonFile {
  filename: string;
  data: any;
  isArray: boolean;
}

export default function Home() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<JsonFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const result = await response.json();
      setFiles(result.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`);
      const fileData = await response.json();
      setSelectedFile(fileData);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const saveFile = async (data: any) => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/files/${encodeURIComponent(selectedFile.filename)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        setSelectedFile({ ...selectedFile, data });
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading JSON files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r border-border">
          <FileList 
            files={files} 
            selectedFile={selectedFile?.filename}
            onFileSelect={loadFile}
          />
        </div>
        <div className="flex-1">
          {selectedFile ? (
            <JsonEditor 
              file={selectedFile}
              onSave={saveFile}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🧩</div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to JsonBoard</h2>
                <p className="text-muted-foreground">
                  Select a JSON file from the sidebar to start editing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
