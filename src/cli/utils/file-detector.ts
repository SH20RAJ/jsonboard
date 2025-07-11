import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';

export function detectJsonFiles(directory: string): string[] {
  const files: string[] = [];
  
  try {
    const items = readdirSync(directory);
    
    for (const item of items) {
      const fullPath = join(directory, item);
      const stat = statSync(fullPath);
      
      if (stat.isFile() && extname(item) === '.json') {
        // Validate that it's actually valid JSON
        if (validateJsonFile(fullPath)) {
          files.push(fullPath);
        }
      } else if (stat.isDirectory() && !item.startsWith('.')) {
        // Recursively scan subdirectories
        files.push(...detectJsonFiles(fullPath));
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
