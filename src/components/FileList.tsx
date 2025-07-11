import { useState } from 'react';

interface FileListProps {
  files: string[];
  selectedFile?: string;
  onFileSelect: (filename: string) => void;
}

export function FileList({ files, selectedFile, onFileSelect }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = files.filter(file =>
    file.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  const getFileDirectory = (filePath: string) => {
    const parts = filePath.split('/');
    return parts.slice(0, -1).join('/');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold mb-3">JSON Files</h2>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? 'No files match your search' : 'No JSON files found'}
          </div>
        ) : (
          <div className="p-2">
            {filteredFiles.map((file) => {
              const fileName = getFileName(file);
              const directory = getFileDirectory(file);
              const isSelected = selectedFile === fileName;
              
              return (
                <button
                  key={file}
                  onClick={() => onFileSelect(fileName)}
                  className={`w-full text-left p-3 rounded-md mb-1 transition-colors hover:bg-accent ${
                    isSelected ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <div className="font-medium truncate">{fileName}</div>
                  {directory && (
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {directory}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        {filteredFiles.length} file(s) found
      </div>
    </div>
  );
}
