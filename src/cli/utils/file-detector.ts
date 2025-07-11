import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';

export function detectJsonFiles(directory: string): string[] {
  const files: string[] = [];
  
  // Folders and files to ignore (gitignore-style)
  const ignoredItems = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '.nuxt',
    '.output',
    'coverage',
    '.nyc_output',
    '.tmp',
    '.temp',
    '.cache',
    '.vscode',
    '.idea',
    '*.log'
  ];
  
  try {
    const items = readdirSync(directory);
    
    for (const item of items) {
      // Skip ignored items
      if (ignoredItems.some(ignored => 
        ignored.includes('*') ? item.includes(ignored.replace('*', '')) : item === ignored
      )) {
        continue;
      }
      
      const fullPath = join(directory, item);
      const stat = statSync(fullPath);
      
      if (stat.isFile() && extname(item) === '.json') {
        // Validate that it's actually valid JSON
        if (validateJsonFile(fullPath)) {
          files.push(fullPath);
        }
      } else if (stat.isDirectory() && !item.startsWith('.')) {
        // Recursively scan subdirectories (but not too deep to avoid performance issues)
        const depth = fullPath.split('/').length - directory.split('/').length;
        if (depth < 3) { // Limit recursion depth
          files.push(...detectJsonFiles(fullPath));
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${directory}`);
  }
  
  return files;
}

export function validateJsonFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}
