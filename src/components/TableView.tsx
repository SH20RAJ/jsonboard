interface TableViewProps {
  data: any[];
  onSave: (data: any[]) => void;
}

export function TableView({ data, onSave }: TableViewProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No data to display</h3>
          <p className="text-muted-foreground">
            This JSON file doesn't contain an array or is empty.
          </p>
        </div>
      </div>
    );
  }

  // Get all possible keys from all objects
  const allKeys = Array.from(
    new Set(
      data.flatMap(item => 
        typeof item === 'object' && item !== null ? Object.keys(item) : []
      )
    )
  );

  const addRow = () => {
    const newRow: any = {};
    allKeys.forEach(key => {
      newRow[key] = '';
    });
    onSave([...data, newRow]);
  };

  const updateCell = (rowIndex: number, key: string, value: any) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    onSave(newData);
  };

  const deleteRow = (rowIndex: number) => {
    const newData = data.filter((_, index) => index !== rowIndex);
    onSave(newData);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <button
          onClick={addRow}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          ➕ Add Row
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-2 text-left font-medium">#</th>
              {allKeys.map(key => (
                <th key={key} className="p-2 text-left font-medium min-w-32">
                  {key}
                </th>
              ))}
              <th className="p-2 text-left font-medium w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border hover:bg-accent/50">
                <td className="p-2 text-muted-foreground">{rowIndex + 1}</td>
                {allKeys.map(key => (
                  <td key={key} className="p-2">
                    <input
                      type="text"
                      value={typeof row[key] === 'object' ? JSON.stringify(row[key]) : (row[key] ?? '')}
                      onChange={(e) => {
                        let value: any = e.target.value;
                        try {
                          // Try to parse as JSON for objects/arrays
                          if (value.startsWith('{') || value.startsWith('[')) {
                            value = JSON.parse(value);
                          }
                        } catch {
                          // Keep as string if not valid JSON
                        }
                        updateCell(rowIndex, key, value);
                      }}
                      className="w-full px-2 py-1 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                ))}
                <td className="p-2">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="text-destructive hover:text-destructive/80 p-1"
                    title="Delete row"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
