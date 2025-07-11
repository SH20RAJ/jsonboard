#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { startServer } from './server.js';
import { detectJsonFiles } from './utils/file-detector.js';
import { resolve } from 'path';

interface CliOptions {
  dir: string;
  port: string;
  open: boolean;
}

const program = new Command();

program
  .name('jsonboard')
  .description('A local-first visual database for your JSON files')
  .version('1.0.0');

program
  .option('-d, --dir <directory>', 'Directory to scan for JSON files', 'data')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('--no-open', 'Don\'t automatically open the browser')
  .action(async (options: CliOptions) => {
    try {
      const targetDir = resolve(process.cwd(), options.dir);
      
      console.log(chalk.blue('🧩 JsonBoard - Visual JSON Database'));
      console.log(chalk.gray(`Scanning directory: ${targetDir}`));
      
      const jsonFiles = await detectJsonFiles(targetDir);
      
      if (jsonFiles.length === 0) {
        console.log(chalk.yellow(`⚠️  No JSON files found in ${targetDir}`));
        console.log(chalk.gray('Create some .json files and try again!'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✅ Found ${jsonFiles.length} JSON file(s)`));
      jsonFiles.forEach((file: string) => {
        console.log(chalk.gray(`   • ${file.replace(targetDir + '/', '')}`));
      });
      
      await startServer({
        directory: targetDir,
        port: parseInt(options.port),
        openBrowser: options.open
      });
      
    } catch (error: any) {
      console.error(chalk.red('❌ Error starting JsonBoard:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program.parse();
