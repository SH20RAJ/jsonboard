#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { startServer } from './server.js';
import { detectJsonFiles } from './utils/file-detector.js';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Read version from package.json
const packageJsonPath = resolve(__dirname, '../package.json');
let version = '1.2.0'; // fallback
try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  version = packageJson.version;
} catch (error) {
  // Use fallback version if package.json can't be read
}

interface CliOptions {
  dir: string;
  port: string;
  open: boolean;
}

const program = new Command();

// Custom help display
const displayHeader = () => {
  console.log();
  console.log(chalk.blue.bold('🧩 JsonBoard Pro'));
  console.log(chalk.gray('A local-first visual database for your JSON files'));
  console.log(chalk.gray('Get a spreadsheet-like GUI to edit JSON data without leaving your project.'));
  console.log();
  console.log(chalk.cyan('🔗 Documentation: https://github.com/sh20raj/jsonboard'));
  console.log();
};

program
  .name('jsonboard')
  .description('A local-first visual database for your JSON files')
  .version(version)
  .helpOption('-h, --help', 'Display help information')
  .addHelpText('beforeAll', () => {
    displayHeader();
    return '';
  });

program
  .option('-d, --dir <directory>', 'Directory to scan for JSON files (default: current directory)', '.')
  .option('-p, --port <port>', 'Port to run the server on (default: 3000, auto-detects conflicts)', '3000')
  .option('--no-open', 'Don\'t automatically open the browser')
  .action(async (options: CliOptions) => {
    try {
      const targetDir = resolve(process.cwd(), options.dir);
      
      console.log(chalk.blue.bold('🧩 JsonBoard Pro - Visual JSON Database'));
      console.log(chalk.gray(`📁 Scanning directory: ${targetDir}`));
      console.log(chalk.gray(`🔗 GitHub: https://github.com/sh20raj/jsonboard`));
      console.log();
      
      const jsonFiles = await detectJsonFiles(targetDir);
      
      if (jsonFiles.length === 0) {
        console.log(chalk.yellow(`⚠️  No JSON files found in ${targetDir}`));
        console.log(chalk.gray('💡 Create some .json files and try again!'));
        console.log(chalk.gray('💡 Or specify a different directory with --dir <path>'));
        console.log();
        console.log(chalk.blue('📖 Need help? Visit: https://github.com/sh20raj/jsonboard'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✅ Found ${jsonFiles.length} JSON file(s):`));
      jsonFiles.forEach((file: string) => {
        const relativePath = file.replace(targetDir + '/', '').replace(targetDir, '.');
        console.log(chalk.gray(`   📄 ${relativePath}`));
      });
      console.log();
      
      await startServer({
        directory: targetDir,
        port: parseInt(options.port),
        openBrowser: options.open
      });
      
    } catch (error: any) {
      console.error(chalk.red.bold('❌ Error starting JsonBoard:'));
      console.error(chalk.red(`   ${error.message}`));
      console.log();
      console.log(chalk.yellow('💡 Common solutions:'));
      console.log(chalk.gray('   • Check if the directory exists'));
      console.log(chalk.gray('   • Ensure you have valid JSON files'));
      console.log(chalk.gray('   • Try a different port with --port <number>'));
      console.log();
      console.log(chalk.blue('📖 Get help: https://github.com/sh20raj/jsonboard/issues'));
      process.exit(1);
    }
  });

// Add help examples
program.addHelpText('after', () => {
  return `
${chalk.yellow.bold('Examples:')}
  ${chalk.gray('# Start JsonBoard in current directory')}
  ${chalk.cyan('jsonboard')}
  
  ${chalk.gray('# Specify a custom directory')}
  ${chalk.cyan('jsonboard --dir ./my-data')}
  
  ${chalk.gray('# Use a specific port')}
  ${chalk.cyan('jsonboard --port 8080')}
  
  ${chalk.gray('# Don\'t open browser automatically')}
  ${chalk.cyan('jsonboard --no-open')}

${chalk.yellow.bold('Features:')}
  ${chalk.gray('• 📊 Spreadsheet-like interface for JSON editing')}
  ${chalk.gray('• 🔍 Auto-detects and scans JSON files recursively')}
  ${chalk.gray('• 🚀 Automatic port conflict resolution')}
  ${chalk.gray('• 📝 Raw JSON editor with syntax highlighting')}
  ${chalk.gray('• 💾 Real-time saving and validation')}
  ${chalk.gray('• 🎯 Works with any JSON structure')}

${chalk.blue.bold('Learn more:')} https://github.com/sh20raj/jsonboard
`;
});

program.parse();
