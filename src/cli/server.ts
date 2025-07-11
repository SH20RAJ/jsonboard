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
  app.use(express.static(join(__dirname, '../app')));

  // API Routes
  app.get('/api/files', (req, res) => {
    try {
      const { detectJsonFiles } = require('./utils/file-detector');
      const files = detectJsonFiles(options.directory);
      res.json({ files });
    } catch (error) {
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

  // Catch all handler for Next.js
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../app/index.html'));
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
