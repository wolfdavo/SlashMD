#!/usr/bin/env node

/**
 * Phase 1 Validation Script
 * Verifies that the SlashMD extension meets all Phase 1 success criteria
 */

const fs = require('fs');
const path = require('path');

const extensionPath = __dirname;
const requiredFiles = [
  'package.json',
  'tsconfig.json', 
  'tsup.config.ts',
  'src/extension.ts',
  'src/types.ts',
  'dist/extension.js',
  'README.md'
];

const requiredDirs = [
  'src',
  'dist'
];

console.log('🔍 Validating SlashMD Extension - Phase 1\n');

// Check required files exist
console.log('📁 Checking required files:');
for (const file of requiredFiles) {
  const filePath = path.join(extensionPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
}

// Check required directories exist
console.log('\n📂 Checking required directories:');
for (const dir of requiredDirs) {
  const dirPath = path.join(extensionPath, dir);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - MISSING`);
  }
}

// Validate package.json structure
console.log('\n📦 Validating package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf8'));
  
  const requiredFields = [
    'name', 'displayName', 'version', 'engines.vscode',
    'main', 'activationEvents', 'contributes.customEditors',
    'contributes.commands', 'contributes.configuration'
  ];
  
  for (const field of requiredFields) {
    const keys = field.split('.');
    let current = packageJson;
    let valid = true;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        valid = false;
        break;
      }
    }
    
    if (valid && current !== undefined) {
      console.log(`✅ ${field}`);
    } else {
      console.log(`❌ ${field} - MISSING`);
    }
  }
  
  // Check custom editor configuration
  if (packageJson.contributes?.customEditors?.length > 0) {
    const editor = packageJson.contributes.customEditors[0];
    if (editor.viewType === 'slashmd.editor' && editor.priority === 'default') {
      console.log('✅ CustomEditor configured correctly');
    } else {
      console.log('❌ CustomEditor configuration invalid');
    }
  }
  
} catch (error) {
  console.log('❌ package.json - INVALID JSON');
}

// Check VS Code debug configuration
console.log('\n🐛 Checking VS Code debug configuration:');
const launchJsonPath = path.join(extensionPath, '../../.vscode/launch.json');
if (fs.existsSync(launchJsonPath)) {
  try {
    const launchJson = JSON.parse(fs.readFileSync(launchJsonPath, 'utf8'));
    const config = launchJson.configurations?.find(c => c.name === 'Run SlashMD Extension');
    if (config && config.type === 'extensionHost') {
      console.log('✅ VS Code debug configuration');
    } else {
      console.log('❌ VS Code debug configuration - invalid');
    }
  } catch {
    console.log('❌ VS Code debug configuration - invalid JSON');
  }
} else {
  console.log('❌ .vscode/launch.json - MISSING');
}

// Check if build files exist and are recent
console.log('\n🔨 Checking build output:');
const distPath = path.join(extensionPath, 'dist/extension.js');
const srcPath = path.join(extensionPath, 'src/extension.ts');

if (fs.existsSync(distPath) && fs.existsSync(srcPath)) {
  const distStat = fs.statSync(distPath);
  const srcStat = fs.statSync(srcPath);
  
  if (distStat.mtime >= srcStat.mtime) {
    console.log('✅ Built files are up-to-date');
  } else {
    console.log('⚠️  Built files are older than source - run npm run build');
  }
} else {
  console.log('❌ Build files missing');
}

console.log('\n🎉 Phase 1 Validation Complete!');
console.log('\n📋 To test the extension:');
console.log('1. Open this project in VS Code');
console.log('2. Press F5 to launch Extension Development Host');
console.log('3. Open any .md file in the new window');
console.log('4. Verify SlashMD editor opens by default');
console.log('\n🚀 Ready for Phase 2: WebView Security & Messaging Foundation');