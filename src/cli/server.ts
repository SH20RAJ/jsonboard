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
  singleFile?: string;
}

async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    function tryPort(port: number) {
      const testServer = createServer();
      
      testServer.listen(port, () => {
        testServer.close(() => {
          resolve(port);
        });
      });
      
      testServer.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          if (port < startPort + 100) { // Try up to 100 ports ahead
            tryPort(port + 1);
          } else {
            reject(new Error(`No available ports found after trying ${port - startPort + 1} ports`));
          }
        } else {
          reject(err);
        }
      });
    }
    
    tryPort(startPort);
  });
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
      
      const filesWithMetadata = files.map((file: string) => {
        const relativePath = file.replace(options.directory + '/', '');
        const stats = require('fs').statSync(file);
        
        try {
          const content = readFileSync(file, 'utf-8');
          const data = JSON.parse(content);
          const recordCount = Array.isArray(data) ? data.length : 1;
          
          return {
            filename: relativePath,
            relativePath,
            metadata: {
              size: stats.size,
              recordCount,
              lastModified: stats.mtime,
              created: stats.birthtime,
              isArray: Array.isArray(data)
            }
          };
        } catch (error) {
          return {
            filename: relativePath,
            relativePath,
            metadata: {
              size: stats.size,
              recordCount: 0,
              lastModified: stats.mtime,
              created: stats.birthtime,
              isArray: false,
              error: 'Invalid JSON'
            }
          };
        }
      });
      
      res.json({ files: filesWithMetadata });
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
      const stats = require('fs').statSync(filePath);
      const relativePath = filename; // Already relative from the API endpoint
      
      res.json({ 
        filename,
        relativePath,
        data,
        isArray: Array.isArray(data),
        metadata: {
          size: stats.size,
          recordCount: Array.isArray(data) ? data.length : 1,
          lastModified: stats.mtime,
          created: stats.birthtime
        }
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

  // Create new JSON file
  app.post('/api/files', (req, res) => {
    try {
      const { filename, data } = req.body;
      const filePath = join(options.directory, filename);
      
      if (existsSync(filePath)) {
        return res.status(409).json({ error: 'File already exists' });
      }

      writeFileSync(filePath, JSON.stringify(data || [], null, 2), 'utf-8');
      
      res.json({ success: true, filename });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create file' });
    }
  });

  // Delete JSON file
  app.delete('/api/files/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = join(options.directory, filename);
      
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      require('fs').unlinkSync(filePath);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  // Add new record to array
  app.post('/api/files/:filename/records', (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = join(options.directory, filename);
      const record = req.body; // Accept the record data directly from body
      
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'File is not an array' });
      }

      // Auto-generate ID if not provided
      if (record && typeof record === 'object' && !record.id) {
        const maxId = data.length > 0 ? Math.max(...data.map(item => item.id || 0)) : 0;
        record.id = maxId + 1;
      }

      data.push(record);
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      
      res.json({ success: true, record });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add record' });
    }
  });

  // Update record by index (for arrays without consistent IDs)
  app.put('/api/files/:filename/records/index/:index', (req, res) => {
    try {
      const filename = req.params.filename;
      const recordIndex = parseInt(req.params.index);
      const filePath = join(options.directory, filename);
      const updatedRecord = req.body;
      
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'File is not an array' });
      }

      if (recordIndex < 0 || recordIndex >= data.length) {
        return res.status(404).json({ error: 'Record index out of bounds' });
      }

      data[recordIndex] = { ...data[recordIndex], ...updatedRecord };
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      
      res.json({ success: true, record: data[recordIndex] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update record' });
    }
  });

  // Update specific record by ID
  app.put('/api/files/:filename/records/:id', (req, res) => {
    try {
      const filename = req.params.filename;
      const recordId = parseInt(req.params.id);
      const filePath = join(options.directory, filename);
      const updatedRecord = req.body; // Accept the record data directly from body
      
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'File is not an array' });
      }

      const index = data.findIndex(item => item.id === recordId);
      if (index === -1) {
        return res.status(404).json({ error: 'Record not found' });
      }

      data[index] = { ...data[index], ...updatedRecord, id: recordId };
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      
      res.json({ success: true, record: data[index] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update record' });
    }
  });

  // Delete specific record by ID
  app.delete('/api/files/:filename/records/:id', (req, res) => {
    try {
      const filename = req.params.filename;
      const recordId = parseInt(req.params.id);
      const filePath = join(options.directory, filename);
      
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'File is not an array' });
      }

      const index = data.findIndex(item => item.id === recordId);
      if (index === -1) {
        return res.status(404).json({ error: 'Record not found' });
      }

      const deletedRecord = data.splice(index, 1)[0];
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      
      res.json({ success: true, deletedRecord });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete record' });
    }
  });

  // Catch all handler - serve a modern, feature-rich HTML interface
  app.get('*', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JsonBoard Pro - Visual JSON Database</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
          --primary: #3b82f6;
          --primary-dark: #2563eb;
          --secondary: #6366f1;
          --success: #10b981;
          --danger: #ef4444;
          --warning: #f59e0b;
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --bg-tertiary: #f1f5f9;
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --text-tertiary: #94a3b8;
          --border: #e2e8f0;
          --border-light: #f1f5f9;
          --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --radius: 8px;
          --radius-lg: 12px;
        }
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          background: var(--bg-secondary);
          color: var(--text-primary);
          line-height: 1.5;
        }
        
        .app { height: 100vh; display: flex; flex-direction: column; }
        
        /* Header */
        .header { 
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: between;
          box-shadow: var(--shadow);
        }
        
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
        
        .logo { display: flex; align-items: center; gap: 8px; }
        .logo-icon { font-size: 24px; }
        .logo-text { font-weight: 700; font-size: 18px; color: var(--primary); }
        .logo-version { font-size: 11px; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
        
        .search-box { 
          position: relative; 
          display: flex; 
          align-items: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 6px 12px;
          min-width: 300px;
        }
        .search-box i { color: var(--text-tertiary); margin-right: 8px; }
        .search-box input { 
          border: none; 
          background: none; 
          outline: none; 
          flex: 1;
          font-size: 14px;
        }
        
        /* Main Content */
        .main { flex: 1; display: flex; }
        
        /* Sidebar */
        .sidebar { 
          width: 320px; 
          background: var(--bg-primary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-header { 
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: between;
        }
        
        .sidebar-title { font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.025em; color: var(--text-secondary); }
        
        .btn { 
          border: none;
          border-radius: var(--radius);
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
        
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { background: var(--primary-dark); }
        .btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); }
        .btn-secondary:hover { background: var(--bg-tertiary); }
        .btn-success { background: var(--success); color: white; }
        .btn-danger { background: var(--danger); color: white; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .btn-xs { padding: 4px 8px; font-size: 11px; }
        
        .file-list { flex: 1; overflow-y: auto; }
        
        .file-item { 
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-light);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: between;
        }
        .file-item:hover { background: var(--bg-secondary); }
        .file-item.active { background: var(--primary); color: white; }
        
        .file-info { flex: 1; }
        .file-name { font-weight: 500; margin-bottom: 2px; }
        .file-meta { font-size: 12px; color: var(--text-tertiary); }
        .file-item.active .file-meta { color: rgba(255,255,255,0.8); }
        
        .file-actions { opacity: 0; transition: opacity 0.2s; }
        .file-item:hover .file-actions { opacity: 1; }
        .file-item.active .file-actions { opacity: 1; }
        
        /* Content Area */
        .content { flex: 1; background: var(--bg-primary); display: flex; flex-direction: column; }
        
        .content-header { 
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: between;
        }
        
        .content-title { font-size: 20px; font-weight: 600; }
        .content-subtitle { font-size: 14px; color: var(--text-secondary); margin-top: 2px; }
        
        .content-actions { display: flex; align-items: center; gap: 8px; }
        
        .view-toggle { 
          display: flex;
          background: var(--bg-secondary);
          border-radius: var(--radius);
          padding: 2px;
        }
        .view-toggle button {
          padding: 6px 12px;
          border: none;
          background: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .view-toggle button.active { background: white; box-shadow: var(--shadow); }
        
        .content-body { flex: 1; overflow: hidden; position: relative; }
        
        /* Table View */
        .table-container { height: 100%; overflow: auto; padding: 20px; }
        .table { width: 100%; border-collapse: collapse; background: white; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow); }
        .table th, .table td { 
          padding: 12px 16px; 
          text-align: left; 
          border-bottom: 1px solid var(--border-light);
        }
        .table th { 
          background: var(--bg-secondary); 
          font-weight: 600; 
          font-size: 12px; 
          text-transform: uppercase; 
          letter-spacing: 0.025em;
          color: var(--text-secondary);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .table tbody tr:hover { background: var(--bg-secondary); }
        
        .table input { 
          border: 1px solid transparent;
          background: transparent;
          padding: 4px 8px;
          border-radius: 4px;
          width: 100%;
          font-size: 14px;
        }
        .table input:focus { 
          outline: none;
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        /* JSON Editor */
        .json-editor { 
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .editor-toolbar {
          padding: 12px 20px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .editor-textarea { 
          flex: 1;
          border: none;
          padding: 20px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          outline: none;
          background: var(--bg-primary);
        }
        
        /* Empty State */
        .empty-state { 
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 40px;
        }
        .empty-icon { font-size: 48px; margin-bottom: 16px; color: var(--text-tertiary); }
        .empty-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .empty-description { color: var(--text-secondary); margin-bottom: 20px; }
        
        /* Modal */
        .modal-overlay { 
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          background: rgba(0,0,0,0.5); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          z-index: 1000;
        }
        .modal { 
          background: white; 
          border-radius: var(--radius-lg); 
          padding: 24px; 
          min-width: 400px; 
          max-width: 500px;
          box-shadow: var(--shadow-lg);
        }
        .modal-header { margin-bottom: 16px; }
        .modal-title { font-size: 18px; font-weight: 600; }
        .modal-body { margin-bottom: 20px; }
        .modal-footer { display: flex; gap: 8px; justify-content: flex-end; }
        
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; }
        .form-input { 
          width: 100%; 
          padding: 8px 12px; 
          border: 1px solid var(--border); 
          border-radius: var(--radius); 
          font-size: 14px;
        }
        .form-input:focus { 
          outline: none; 
          border-color: var(--primary); 
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        /* Status indicators */
        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .status-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .status-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .status-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        
        /* Loading */
        .loading { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          padding: 40px;
          color: var(--text-secondary);
        }
        .spinner { 
          width: 20px; 
          height: 20px; 
          border: 2px solid var(--border); 
          border-top: 2px solid var(--primary); 
          border-radius: 50%; 
          animation: spin 1s linear infinite; 
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Responsive */
        @media (max-width: 768px) {
          .sidebar { width: 280px; }
          .search-box { min-width: 200px; }
          .content-header { padding: 16px 20px; }
          .table-container { padding: 16px; }
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">
            <div class="spinner"></div>
            Loading JsonBoard Pro...
        </div>
    </div>

    <script type="text/babel">
        const { useState, useEffect, useCallback } = React;

        // Main App Component
        function App() {
            const [files, setFiles] = useState([]);
            const [selectedFile, setSelectedFile] = useState(null);
            const [jsonData, setJsonData] = useState('');
            const [viewMode, setViewMode] = useState('table');
            const [loading, setLoading] = useState(true);
            const [searchTerm, setSearchTerm] = useState('');
            const [showCreateModal, setShowCreateModal] = useState(false);
            const [notification, setNotification] = useState(null);

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
                    showNotification('Failed to load file', 'error');
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
                        showNotification('File saved successfully!', 'success');
                    }
                } catch (error) {
                    showNotification('Error saving file: ' + error.message, 'error');
                }
            };

            const createFile = async (filename, initialData = []) => {
                try {
                    const response = await fetch('/api/files', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename, data: initialData })
                    });
                    if (response.ok) {
                        await fetchFiles();
                        showNotification('File created successfully!', 'success');
                        setShowCreateModal(false);
                    } else {
                        const error = await response.json();
                        showNotification(error.error, 'error');
                    }
                } catch (error) {
                    showNotification('Failed to create file', 'error');
                }
            };

            const deleteFile = async (filename) => {
                if (!confirm('Are you sure you want to delete this file?')) return;
                try {
                    const response = await fetch('/api/files/' + encodeURIComponent(filename), {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await fetchFiles();
                        if (selectedFile?.filename === filename) {
                            setSelectedFile(null);
                        }
                        showNotification('File deleted successfully!', 'success');
                    }
                } catch (error) {
                    showNotification('Failed to delete file', 'error');
                }
            };

            const addRecord = async (record) => {
                if (!selectedFile) return;
                try {
                    const response = await fetch('/api/files/' + encodeURIComponent(selectedFile.filename) + '/records', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ record })
                    });
                    if (response.ok) {
                        await loadFile(selectedFile.filename);
                        showNotification('Record added successfully!', 'success');
                    }
                } catch (error) {
                    showNotification('Failed to add record', 'error');
                }
            };

            const updateRecordByIndex = async (index, record) => {
                if (!selectedFile) return;
                try {
                    const response = await fetch('/api/files/' + encodeURIComponent(selectedFile.filename) + '/records/index/' + index, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(record)
                    });
                    if (response.ok) {
                        await loadFile(selectedFile.filename);
                        showNotification('Record updated successfully!', 'success');
                    }
                } catch (error) {
                    showNotification('Failed to update record', 'error');
                }
            };

            const updateRecord = async (id, record) => {
                if (!selectedFile) return;
                try {
                    const response = await fetch('/api/files/' + encodeURIComponent(selectedFile.filename) + '/records/' + id, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(record) // Send record directly, not wrapped in { record }
                    });
                    if (response.ok) {
                        await loadFile(selectedFile.filename);
                        showNotification('Record updated successfully!', 'success');
                    }
                } catch (error) {
                    showNotification('Failed to update record', 'error');
                }
            };

            const deleteRecord = async (id) => {
                if (!selectedFile) return;
                if (!confirm('Are you sure you want to delete this record?')) return;
                try {
                    const response = await fetch('/api/files/' + encodeURIComponent(selectedFile.filename) + '/records/' + id, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await loadFile(selectedFile.filename);
                        showNotification('Record deleted successfully!', 'success');
                    }
                } catch (error) {
                    showNotification('Failed to delete record', 'error');
                }
            };

            const showNotification = (message, type = 'info') => {
                setNotification({ message, type });
                setTimeout(() => setNotification(null), 3000);
            };

            const filteredFiles = files.filter(file =>
                (typeof file === 'string' ? file : file.filename)
                    .toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (loading) {
                return (
                    <div className="loading">
                        <div className="spinner"></div>
                        Loading JSON files...
                    </div>
                );
            }

            return (
                <div className="app">
                    <Header 
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onCreateFile={() => setShowCreateModal(true)}
                    />
                    
                    <div className="main">
                        <Sidebar 
                            files={filteredFiles}
                            selectedFile={selectedFile?.filename}
                            onFileSelect={loadFile}
                            onDeleteFile={deleteFile}
                            onCreateFile={() => setShowCreateModal(true)}
                        />
                        
                        <div className="content">
                            {selectedFile ? (
                                <>
                                    <ContentHeader 
                                        file={selectedFile}
                                        viewMode={viewMode}
                                        onViewModeChange={setViewMode}
                                        onSave={saveFile}
                                    />
                                    <div className="content-body">
                                        {viewMode === 'table' && selectedFile.isArray ? (
                                            <TableView 
                                                data={selectedFile.data}
                                                onAddRecord={addRecord}
                                                onUpdateRecord={updateRecord}
                                                onDeleteRecord={deleteRecord}
                                            />
                                        ) : (
                                            <JsonEditor 
                                                data={jsonData}
                                                onChange={setJsonData}
                                                onSave={saveFile}
                                            />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <EmptyState onCreateFile={() => setShowCreateModal(true)} />
                            )}
                        </div>
                    </div>

                    {showCreateModal && (
                        <CreateFileModal 
                            onClose={() => setShowCreateModal(false)}
                            onCreate={createFile}
                        />
                    )}

                    {notification && (
                        <Notification 
                            message={notification.message}
                            type={notification.type}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            );
        }

        // Header Component
        function Header({ searchTerm, onSearchChange, onCreateFile }) {
            return (
                <div className="header">
                    <div className="header-left">
                        <div className="logo">
                            <div className="logo-icon">🧩</div>
                            <div className="logo-text">JsonBoard</div>
                            <div className="logo-version">PRO</div>
                        </div>
                        
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text"
                                placeholder="Search files..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="header-right">
                        <button className="btn btn-primary" onClick={onCreateFile}>
                            <i className="fas fa-plus"></i>
                            New File
                        </button>
                    </div>
                </div>
            );
        }

        // Sidebar Component
        function Sidebar({ files, selectedFile, onFileSelect, onDeleteFile, onCreateFile }) {
            const formatFileSize = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            const formatDate = (dateString) => {
                try {
                    return new Date(dateString).toLocaleDateString();
                } catch {
                    return 'Unknown';
                }
            };

            return (
                <div className="sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-title">JSON Files ({files.length})</div>
                        <button className="btn btn-secondary btn-sm" onClick={onCreateFile}>
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <div className="file-list">
                        {files.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                No JSON files found
                            </div>
                        ) : (
                            files.map(file => {
                                const fileData = typeof file === 'string' ? { filename: file, metadata: {} } : file;
                                const isSelected = selectedFile === fileData.filename;
                                
                                return (
                                    <div 
                                        key={fileData.filename}
                                        className={'file-item' + (isSelected ? ' active' : '')}
                                        onClick={() => onFileSelect(fileData.filename)}
                                    >
                                        <div className="file-info">
                                            <div className="file-name">
                                                <i className={"fas " + (fileData.metadata?.isArray ? "fa-table" : "fa-file-code")} 
                                                   style={{ marginRight: '8px', color: fileData.metadata?.isArray ? 'var(--success)' : 'var(--primary)' }}></i>
                                                {fileData.filename}
                                            </div>
                                            <div className="file-meta">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                                                    <span>📁 {fileData.relativePath || fileData.filename}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                                                    {fileData.metadata?.recordCount !== undefined && (
                                                        <span title="Records">
                                                            <i className="fas fa-database" style={{ fontSize: '10px', marginRight: '3px' }}></i>
                                                            {fileData.metadata.recordCount}
                                                        </span>
                                                    )}
                                                    {fileData.metadata?.size && (
                                                        <span title="File Size">
                                                            <i className="fas fa-weight-hanging" style={{ fontSize: '10px', marginRight: '3px' }}></i>
                                                            {formatFileSize(fileData.metadata.size)}
                                                        </span>
                                                    )}
                                                    {fileData.metadata?.lastModified && (
                                                        <span title="Last Modified">
                                                            <i className="fas fa-clock" style={{ fontSize: '10px', marginRight: '3px' }}></i>
                                                            {formatDate(fileData.metadata.lastModified)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="file-actions">
                                            <button 
                                                className="btn btn-danger btn-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteFile(fileData.filename);
                                                }}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            );
        }

        // Content Header Component
        function ContentHeader({ file, viewMode, onViewModeChange, onSave }) {
            const formatFileSize = (bytes) => {
                if (!bytes) return '';
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            return (
                <div className="content-header">
                    <div>
                        <div className="content-title">
                            <i className={"fas " + (file.isArray ? "fa-table" : "fa-file-code")} 
                               style={{ marginRight: '8px', color: file.isArray ? 'var(--success)' : 'var(--primary)' }}></i>
                            {file.filename}
                        </div>
                        <div className="content-subtitle">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                                <span>📁 {file.relativePath || file.filename}</span>
                                {file.metadata?.size && (
                                    <span>📊 {formatFileSize(file.metadata.size)}</span>
                                )}
                                <span>
                                    {file.isArray ? 
                                        ("🗂️ Array with " + file.data.length + " records") : 
                                        '📄 JSON Object'
                                    }
                                </span>
                                {file.metadata?.lastModified && (
                                    <span>🕒 Modified {new Date(file.metadata.lastModified).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="content-actions">
                        {file.isArray && (
                            <div className="view-toggle">
                                <button 
                                    className={viewMode === 'table' ? 'active' : ''}
                                    onClick={() => onViewModeChange('table')}
                                >
                                    <i className="fas fa-table"></i> Table
                                </button>
                                <button 
                                    className={viewMode === 'json' ? 'active' : ''}
                                    onClick={() => onViewModeChange('json')}
                                >
                                    <i className="fas fa-code"></i> JSON
                                </button>
                            </div>
                        )}
                        
                        <button className="btn btn-primary" onClick={onSave}>
                            <i className="fas fa-save"></i>
                            Save
                        </button>
                    </div>
                </div>
            );
        }

        // Table View Component
        function TableView({ data, onAddRecord, onUpdateRecord, onDeleteRecord }) {
            const [editingCell, setEditingCell] = useState(null);
            const [showAddModal, setShowAddModal] = useState(false);

            // Local update function that handles both ID-based and index-based updates
            const handleCellEdit = async (rowIndex, column, value) => {
                const record = data[rowIndex];
                const updatedRecord = { ...record, [column]: value };
                
                try {
                    // If the record has an id, use the ID-based update API
                    if (record.id !== undefined) {
                        await onUpdateRecord(record.id, updatedRecord);
                    } else {
                        // If no id, use index-based update
                        if (!selectedFile) return;
                        const response = await fetch('/api/files/' + encodeURIComponent(selectedFile.filename) + '/records/index/' + rowIndex, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updatedRecord)
                        });
                        if (response.ok) {
                            await loadFile(selectedFile.filename);
                            showNotification('Record updated successfully!', 'success');
                        }
                    }
                } catch (error) {
                    showNotification('Failed to update record', 'error');
                    console.error('Update error:', error);
                }
            };

            if (!Array.isArray(data) || data.length === 0) {
                return (
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <div className="empty-title">No Data</div>
                        <div className="empty-description">This array is empty. Add some records to get started.</div>
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <i className="fas fa-plus"></i>
                            Add First Record
                        </button>
                        {showAddModal && (
                            <AddRecordModal 
                                columns={[]}
                                onClose={() => setShowAddModal(false)}
                                onAdd={onAddRecord}
                            />
                        )}
                    </div>
                );
            }

            // Get all possible columns
            const columns = Array.from(
                new Set(
                    data.flatMap(item => 
                        typeof item === 'object' && item !== null ? Object.keys(item) : []
                    )
                )
            );

            return (
                <div className="table-container">
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong>{data.length}</strong> records
                        </div>
                        <button className="btn btn-success btn-sm" onClick={() => setShowAddModal(true)}>
                            <i className="fas fa-plus"></i>
                            Add Record
                        </button>
                    </div>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                {columns.map(column => (
                                    <th key={column}>{column}</th>
                                ))}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{rowIndex + 1}</td>
                                    {columns.map(column => (
                                        <td key={column}>
                                            <input
                                                type="text"
                                                value={typeof row[column] === 'object' ? JSON.stringify(row[column]) : (row[column] ?? '')}
                                                onChange={(e) => {
                                                    let value = e.target.value;
                                                    try {
                                                        if (value.startsWith('{') || value.startsWith('[')) {
                                                            value = JSON.parse(value);
                                                        }
                                                    } catch {}
                                                    handleCellEdit(rowIndex, column, value);
                                                }}
                                            />
                                        </td>
                                    ))}
                                    <td>
                                        <button
                                            className="btn btn-danger btn-xs"
                                            onClick={() => onDeleteRecord(row.id)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {showAddModal && (
                        <AddRecordModal 
                            columns={columns}
                            onClose={() => setShowAddModal(false)}
                            onAdd={onAddRecord}
                        />
                    )}
                </div>
            );
        }

        // JSON Editor Component
        function JsonEditor({ data, onChange, onSave }) {
            const [error, setError] = useState(null);

            const handleChange = (value) => {
                onChange(value);
                try {
                    JSON.parse(value);
                    setError(null);
                } catch (err) {
                    setError('Invalid JSON format');
                }
            };

            return (
                <div className="json-editor">
                    <div className="editor-toolbar">
                        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={!!error}>
                            <i className="fas fa-save"></i>
                            Save Changes
                        </button>
                        {error && (
                            <span style={{ color: 'var(--danger)', fontSize: '12px' }}>
                                <i className="fas fa-exclamation-triangle"></i>
                                {error}
                            </span>
                        )}
                        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            <i className="fas fa-info-circle"></i>
                            Auto-formatting enabled
                        </div>
                    </div>
                    
                    <textarea
                        className="editor-textarea"
                        value={data}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder="Enter valid JSON..."
                        spellCheck={false}
                    />
                </div>
            );
        }

        // Empty State Component
        function EmptyState({ onCreateFile }) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">🧩</div>
                    <div className="empty-title">Welcome to JsonBoard Pro</div>
                    <div className="empty-description">
                        Select a JSON file from the sidebar to start editing, or create a new one to get started.
                    </div>
                    <button className="btn btn-primary" onClick={onCreateFile}>
                        <i className="fas fa-plus"></i>
                        Create New File
                    </button>
                </div>
            );
        }

        // Create File Modal Component
        function CreateFileModal({ onClose, onCreate }) {
            const [filename, setFilename] = useState('');
            const [template, setTemplate] = useState('array');

            const handleSubmit = (e) => {
                e.preventDefault();
                if (!filename.trim()) return;
                
                const finalFilename = filename.endsWith('.json') ? filename : filename + '.json';
                const initialData = template === 'array' ? [] : {};
                
                onCreate(finalFilename, initialData);
            };

            return (
                <div className="modal-overlay" onClick={onClose}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">Create New JSON File</div>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Filename</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={filename}
                                        onChange={(e) => setFilename(e.target.value)}
                                        placeholder="my-data.json"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Template</label>
                                    <select 
                                        className="form-input"
                                        value={template}
                                        onChange={(e) => setTemplate(e.target.value)}
                                    >
                                        <option value="array">Array (Table view)</option>
                                        <option value="object">Object (JSON view)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-plus"></i>
                                    Create File
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        // Add Record Modal Component
        function AddRecordModal({ columns, onClose, onAdd }) {
            const [record, setRecord] = useState({});

            const handleSubmit = (e) => {
                e.preventDefault();
                onAdd(record);
                onClose();
            };

            return (
                <div className="modal-overlay" onClick={onClose}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">Add New Record</div>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {columns.map(column => (
                                    <div key={column} className="form-group">
                                        <label className="form-label">{column}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={record[column] || ''}
                                            onChange={(e) => setRecord({...record, [column]: e.target.value})}
                                            placeholder={\`Enter \${column}\`}
                                        />
                                    </div>
                                ))}
                                
                                {columns.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        Add your first record to define the structure
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    <i className="fas fa-plus"></i>
                                    Add Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        // Notification Component
        function Notification({ message, type, onClose }) {
            useEffect(() => {
                const timer = setTimeout(onClose, 3000);
                return () => clearTimeout(timer);
            }, [onClose]);

            const getIcon = () => {
                switch(type) {
                    case 'success': return 'fas fa-check-circle';
                    case 'error': return 'fas fa-exclamation-circle';
                    case 'warning': return 'fas fa-exclamation-triangle';
                    default: return 'fas fa-info-circle';
                }
            };

            const getColor = () => {
                switch(type) {
                    case 'success': return 'var(--success)';
                    case 'error': return 'var(--danger)';
                    case 'warning': return 'var(--warning)';
                    default: return 'var(--primary)';
                }
            };

            return (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'white',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                    borderLeft: \`4px solid \${getColor()}\`,
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '300px'
                }}>
                    <i className={getIcon()} style={{ color: getColor() }}></i>
                    <span style={{ flex: 1 }}>{message}</span>
                    <button 
                        onClick={onClose}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
    res.send(html);
  });

  // Find available port if the requested port is in use
  let availablePort: number;
  try {
    availablePort = await findAvailablePort(options.port);
    
    if (availablePort !== options.port) {
      console.log(chalk.yellow(`⚠️  Port ${options.port} is already in use, using port ${availablePort} instead`));
    }
  } catch (error: any) {
    console.error(chalk.red(`❌ ${error.message}`));
    console.error(chalk.gray('Try specifying a different port with --port <number>'));
    process.exit(1);
  }

  server.listen(availablePort, () => {
    const url = `http://localhost:${availablePort}`;
    console.log();
    console.log(chalk.green('🚀 JsonBoard is running!'));
    console.log(chalk.blue(`   Local: ${url}`));
    console.log();
    console.log(chalk.gray('Press Ctrl+C to stop'));

    if (options.openBrowser) {
      open(url);
    }
  });

  // Handle server errors
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(chalk.red(`❌ Port ${availablePort} is already in use`));
      console.error(chalk.gray('Try specifying a different port with --port <number>'));
    } else {
      console.error(chalk.red('❌ Server error:'), err.message);
    }
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down JsonBoard...'));
    server.close(() => {
      process.exit(0);
    });
  });
}
