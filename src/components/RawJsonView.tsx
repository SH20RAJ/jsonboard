import { useState } from 'react';

interface RawJsonViewProps {
  data: any;
  onSave: (data: any) => void;
}

export function RawJsonView({ data, onSave }: RawJsonViewProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setError(null);
      onSave(parsed);
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const handleTextChange = (value: string) => {
    setJsonText(value);
    try {
      JSON.parse(value);
      setError(null);
    } catch {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSave}
            disabled={!!error}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 Save Changes
          </button>
          {error && (
            <span className="text-sm text-destructive">{error}</span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Auto-formatting enabled
        </div>
      </div>
      
      <div className="flex-1 relative">
        <textarea
          value={jsonText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none bg-background"
          placeholder="Enter valid JSON..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
