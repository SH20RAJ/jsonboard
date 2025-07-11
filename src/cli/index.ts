#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { startServer } from './server.js';
import { detectJsonFiles } from './utils/file-detector.js';
import { JsonSchemaGenerator } from './utils/schema-generator.js';
import { resolve, basename } from 'path';
import { readFileSync, existsSync } from 'fs';

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
  file?: string; // Single file mode
  validate?: boolean; // Schema validation
  generateSchema?: boolean; // Generate schema files
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
  .option('-o, --file <filename>', 'Open specific JSON file (single file mode)')
  .option('-p, --port <port>', 'Port to run the server on (default: 3000, auto-detects conflicts)', '3000')
  .option('--no-open', 'Don\'t automatically open the browser')
  .option('--validate', 'Validate JSON files with auto-generated schemas')
  .option('--generate-schema', 'Generate .schema.json files for all JSON files')
  .action(async (options: CliOptions) => {
    try {
      // Single file mode
      if (options.file) {
        const filePath = resolve(process.cwd(), options.file);
        
        if (!existsSync(filePath)) {
          console.log(chalk.red(`❌ File not found: ${options.file}`));
          process.exit(1);
        }

        console.log(chalk.blue.bold('🧩 JsonBoard Pro - Single File Mode'));
        console.log(chalk.gray(`📄 Opening file: ${basename(filePath)}`));
        console.log(chalk.gray(`🔗 GitHub: https://github.com/sh20raj/jsonboard`));
        console.log();

        // Validate single file if requested
        if (options.validate) {
          console.log(chalk.yellow('🔍 Validating JSON schema...'));
          const validation = JsonSchemaGenerator.validateJson(filePath);
          
          if (validation.isValid) {
            console.log(chalk.green('✅ JSON validation passed'));
          } else {
            console.log(chalk.red('❌ JSON validation failed:'));
            validation.errors.forEach(error => 
              console.log(chalk.red(`   • ${error}`))
            );
          }
          console.log();
        }

        await startServer({
          directory: resolve(filePath, '..'),
          port: parseInt(options.port),
          openBrowser: options.open,
          singleFile: filePath
        });
        return;
      }

      // Multi-file mode (default)
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
        console.log(chalk.gray('💡 Or open a specific file with --file <filename.json>'));
        console.log();
        console.log(chalk.blue('📖 Need help? Visit: https://github.com/sh20raj/jsonboard'));
        process.exit(1);
      }

      // Schema validation
      if (options.validate) {
        console.log(chalk.yellow('🔍 Validating JSON schemas...'));
        let validFiles = 0;
        let invalidFiles = 0;

        for (const file of jsonFiles) {
          const validation = JsonSchemaGenerator.validateJson(file);
          const fileName = file.replace(targetDir + '/', '').replace(targetDir, '.');
          
          if (validation.isValid) {
            console.log(chalk.green(`   ✅ ${fileName}`));
            validFiles++;
          } else {
            console.log(chalk.red(`   ❌ ${fileName}`));
            validation.errors.forEach(error => 
              console.log(chalk.red(`      • ${error}`))
            );
            invalidFiles++;
          }
        }

        console.log();
        console.log(chalk.blue(`📊 Validation Summary: ${validFiles} valid, ${invalidFiles} invalid`));
        console.log();
      }

      // Schema generation
      if (options.generateSchema) {
        console.log(chalk.yellow('📝 Generating schema files...'));
        
        for (const file of jsonFiles) {
          try {
            const { schemaPath } = JsonSchemaGenerator.generateAndSaveSchema(file);
            const fileName = file.replace(targetDir + '/', '').replace(targetDir, '.');
            const schemaName = schemaPath.replace(targetDir + '/', '').replace(targetDir, '.');
            console.log(chalk.green(`   ✅ ${fileName} → ${schemaName}`));
          } catch (error) {
            const fileName = file.replace(targetDir + '/', '').replace(targetDir, '.');
            console.log(chalk.red(`   ❌ ${fileName} (invalid JSON)`));
          }
        }
        console.log();
      }
      
      console.log(chalk.green(`✅ Found ${jsonFiles.length} JSON file(s):`));
      jsonFiles.forEach((file: string) => {
        const relativePath = file.replace(targetDir + '/', '').replace(targetDir, '.');
        
        // Check file health
        const health = JsonSchemaGenerator.checkJsonHealth(file);
        const healthIcon = health.hasIssues ? chalk.yellow('⚠️ ') : chalk.green('📄 ');
        
        console.log(chalk.gray(`   ${healthIcon}${relativePath}`));
        
        if (health.hasIssues && options.validate) {
          health.issues.forEach(issue => 
            console.log(chalk.yellow(`      ⚠️  ${issue}`))
          );
        }
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
      console.log(chalk.gray('   • Check if the directory/file exists'));
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
  
  ${chalk.gray('# Open a specific JSON file')}
  ${chalk.cyan('jsonboard --file data.json')}
  ${chalk.cyan('jsonboard -o ./config/settings.json')}
  
  ${chalk.gray('# Specify a custom directory')}
  ${chalk.cyan('jsonboard --dir ./my-data')}
  
  ${chalk.gray('# Use a specific port')}
  ${chalk.cyan('jsonboard --port 8080')}
  
  ${chalk.gray('# Validate JSON files with auto-generated schemas')}
  ${chalk.cyan('jsonboard --validate')}
  
  ${chalk.gray('# Generate .schema.json files for all JSON files')}
  ${chalk.cyan('jsonboard --generate-schema')}
  
  ${chalk.gray('# Don\'t open browser automatically')}
  ${chalk.cyan('jsonboard --no-open')}

${chalk.yellow.bold('Features:')}
  ${chalk.gray('• 📊 Spreadsheet-like interface for JSON editing')}
  ${chalk.gray('• 🔍 Auto-detects and scans JSON files recursively')}
  ${chalk.gray('• 🚀 Automatic port conflict resolution')}
  ${chalk.gray('• 📝 Raw JSON editor with syntax highlighting')}
  ${chalk.gray('• 💾 Real-time saving and validation')}
  ${chalk.gray('• 🎯 Works with any JSON structure')}
  ${chalk.gray('• ✅ Auto-generated Zod schema validation')}
  ${chalk.gray('• 📄 Single file mode for focused editing')}
  ${chalk.gray('• 🛡️ Smart filtering of config files')}

${chalk.blue.bold('Learn more:')} https://github.com/sh20raj/jsonboard
`;
});

program.parse();
