import express from 'express';
import { createServer } from 'http';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import open from 'open';

interface ServerOptions {
  directory: string;
  port: number;
  openBrowser: boolean;
}

export async function startServer(options: ServerOptions): Promise<void> {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  
  // Serve Next.js static files if built, otherwise serve a simple HTML page
  const nextStaticPath = join(__dirname, '../../.next/static');
  if (existsSync(nextStaticPath)) {
    app.use('/_next/static', express.static(nextStaticPath));
  }

  // API Routes
  app.get('/api/files', (req, res) => {
    try {
      const { detectJsonFiles } = require('./utils/file-detector');
      const files: string[] = detectJsonFiles(options.directory);
      const relativeFiles = files.map((file: string) => file.replace(options.directory + '/', ''));
      res.json({ files: relativeFiles });
    } catch (error) {
      console.error('Error scanning files:', error);
      res.status(500).json({ error: 'Failed to scan directory' });
    }
  });

  app.get('/api/files/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = join(options.directory, filename);
      
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      res.json({ 
        filename,
        data,
        isArray: Array.isArray(data)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to read file' });
    }
  });

  app.put('/api/files/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = join(options.directory, filename);
      const { data } = req.body;

      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save file' });
    }
  });

  // Catch all handler - serve a simple HTML page for development
  app.get('*', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JsonBoard - Visual JSON Database</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .sidebar { width: 300px; background: white; border-radius: 12px; padding: 24px; margin-right: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .main { flex: 1; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .content { display: flex; }
        .file-item { padding: 12px; margin: 8px 0; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
        .file-item:hover { background: #e2e8f0; }
        .file-item.active { background: #3b82f6; color: white; }
        .editor { width: 100%; height: 400px; font-family: 'Monaco', 'Consolas', monospace; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
        .btn { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin: 8px 8px 8px 0; }
        .btn:hover { background: #2563eb; }
        .btn.secondary { background: #6b7280; }
        .btn.secondary:hover { background: #4b5563; }
        .loading { text-align: center; padding: 40px; color: #6b7280; }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">Loading JsonBoard...</div>
    </div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        function App() {
            const [files, setFiles] = useState([]);
            const [selectedFile, setSelectedFile] = useState(null);
            const [jsonData, setJsonData] = useState('');
            const [viewMode, setViewMode] = useState('raw');
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                fetchFiles();
            }, []);

            const fetchFiles = async () => {
                try {
                    const response = await fetch('/api/files');
                    const result = await response.json();
                    setFiles(result.files || []);
                    setLoading(false);
                } catch (error) {
                    console.error('Failed to fetch files:', error);
                    setLoading(false);
                }
            };

            const loadFile = async (filename) => {
                try {
                    const response = await fetch('/api/files/' + encodeURIComponent(filename));
                    const fileData = await response.json();
                    setSelectedFile(fileData);
                    setJsonData(JSON.stringify(fileData.data, null, 2));
                } catch (error) {
                    console.error('Failed to load file:', error);
                }
            };

            const saveFile = async () => {
                if (!selectedFile) return;
                try {
                    const data = JSON.parse(jsonData);
                    const response = await fetch('/api/files/' + encodeURIComponent(selectedFile.filename), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data })
                    });
                    if (response.ok) {
                        alert('File saved successfully!');
                    }
                } catch (error) {
                    alert('Error saving file: ' + error.message);
                }
            };

            if (loading) {
                return <div className="loading">Loading JSON files...</div>;
            }

            return (
                <div className="container">
                    <div className="header">
                        <h1 style={{fontSize: '32px', marginBottom: '8px'}}>🧩 JsonBoard</h1>
                        <p style={{color: '#6b7280'}}>Visual JSON Database - Local Development Server</p>
                    </div>
                    
                    <div className="content">
                        <div className="sidebar">
                            <h2 style={{marginBottom: '16px'}}>JSON Files ({files.length})</h2>
                            {files.length === 0 ? (
                                <p style={{color: '#6b7280'}}>No JSON files found in directory</p>
                            ) : (
                                files.map(file => (
                                    <div 
                                        key={file}
                                        className={'file-item' + (selectedFile?.filename === file ? ' active' : '')}
                                        onClick={() => loadFile(file)}
                                    >
                                        📄 {file}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="main">
                            {selectedFile ? (
                                <>
                                    <div style={{marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <h2>{selectedFile.filename}</h2>
                                        <div>
                                            <button className="btn" onClick={saveFile}>💾 Save</button>
                                        </div>
                                    </div>
                                    <textarea
                                        className="editor"
                                        value={jsonData}
                                        onChange={(e) => setJsonData(e.target.value)}
                                        placeholder="JSON content will appear here..."
                                    />
                                </>
                            ) : (
                                <div style={{textAlign: 'center', padding: '40px'}}>
                                    <div style={{fontSize: '48px', marginBottom: '16px'}}>🧩</div>
                                    <h2>Welcome to JsonBoard</h2>
                                    <p style={{color: '#6b7280', marginTop: '8px'}}>
                                        Select a JSON file from the sidebar to start editing
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
    res.send(html);
  });

  server.listen(options.port, () => {
    const url = `http://localhost:${options.port}`;
    console.log();
    console.log(chalk.green('🚀 JsonBoard is running!'));
    console.log(chalk.blue(`   Local: ${url}`));
    console.log();
    console.log(chalk.gray('Press Ctrl+C to stop'));

    if (options.openBrowser) {
      open(url);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down JsonBoard...'));
    server.close(() => {
      process.exit(0);
    });
  });
}
