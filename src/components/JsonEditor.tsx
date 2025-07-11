import { useState } from 'react';
import { TableView } from './TableView';
import { RawJsonView } from './RawJsonView';

interface JsonFile {
  filename: string;
  data: any;
  isArray: boolean;
}

interface JsonEditorProps {
  file: JsonFile;
  onSave: (data: any) => void;
}

export function JsonEditor({ file, onSave }: JsonEditorProps) {
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [data, setData] = useState(file.data);

  const handleSave = (newData: any) => {
    setData(newData);
    onSave(newData);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{file.filename}</h2>
            <p className="text-sm text-muted-foreground">
              {file.isArray ? `Array with ${data.length} items` : 'JSON Object'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📊 Table
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'raw' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📝 Raw JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'table' && file.isArray ? (
          <TableView data={data} onSave={handleSave} />
        ) : (
          <RawJsonView data={data} onSave={handleSave} />
        )}
      </div>
    </div>
  );
}
