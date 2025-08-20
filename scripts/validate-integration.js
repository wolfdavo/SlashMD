#!/usr/bin/env node
/**
 * Integration Validation Script for SlashMD
 * Validates that all components are properly integrated and working together
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SlashMD Integration Validation');
console.log('================================');

let passed = 0;
let failed = 0;

function check(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    failed++;
  }
}

function fileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  check(description, exists);
  return exists;
}

function fileContains(filePath, searchText, description) {
  if (!fs.existsSync(filePath)) {
    check(description, false);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const contains = content.includes(searchText);
  check(description, contains);
  return contains;
}

// 1. Check core package builds exist
console.log('\n📦 Package Builds:');
fileExists(path.join(__dirname, '..', 'packages', 'md-mapper', 'dist', 'index.js'), 
  'md-mapper built successfully');
fileExists(path.join(__dirname, '..', 'packages', 'webview-ui', 'dist', 'assets'), 
  'webview-ui built successfully');

// 2. Check asset copying worked
console.log('\n🗂️  Asset Integration:');
fileExists(path.join(__dirname, '..', 'packages', 'extension-host', 'media', 'webview-bundle.js'), 
  'React bundle copied to extension media');
fileExists(path.join(__dirname, '..', 'packages', 'extension-host', 'media', 'webview-bundle.css'), 
  'React styles copied to extension media');

// 3. Check shared types integration
console.log('\n🔗 Shared Types Integration:');
fileContains(path.join(__dirname, '..', 'packages', 'extension-host', 'src', 'types.ts'), 
  'SHARED_TYPES', 'extension-host uses shared types');
fileExists(path.join(__dirname, '..', 'packages', 'webview-ui', 'src', 'types', 'shared.ts'), 
  'webview-ui has shared types copy');

// 4. Check sync engine integration
console.log('\n⚙️  Sync Engine Integration:');
fileExists(path.join(__dirname, '..', 'packages', 'extension-host', 'src', 'syncEngine.ts'), 
  'SyncEngine implementation exists');
fileContains(path.join(__dirname, '..', 'packages', 'extension-host', 'src', 'syncEngine.ts'), 
  '@slashmd/md-mapper', 'SyncEngine imports md-mapper');
fileContains(path.join(__dirname, '..', 'packages', 'extension-host', 'src', 'customEditor.ts'), 
  'IntegratedMessageHandler', 'CustomEditor uses integrated message handler');

// 5. Check webview manager updates
console.log('\n🌐 WebView Integration:');
fileContains(path.join(__dirname, '..', 'packages', 'extension-host', 'src', 'webviewManager.ts'), 
  'webview-bundle.js', 'WebViewManager loads React bundle');
fileContains(path.join(__dirname, '..', 'packages', 'extension-host', 'src', 'webviewManager.ts'), 
  'webview-bundle.css', 'WebViewManager loads React styles');

// 6. Check VS Code bridge
console.log('\n🌉 VS Code Bridge:');
fileExists(path.join(__dirname, '..', 'packages', 'webview-ui', 'src', 'integration', 'VSCodeBridge.tsx'), 
  'VS Code bridge component exists');
fileExists(path.join(__dirname, '..', 'packages', 'webview-ui', 'src', 'integration', 'BlockConverter.ts'), 
  'Block converter exists');
fileExists(path.join(__dirname, '..', 'packages', 'webview-ui', 'src', 'AppIntegrated.tsx'), 
  'Integrated app component exists');

// 7. Check package dependencies
console.log('\n📋 Package Dependencies:');
fileContains(path.join(__dirname, '..', 'packages', 'extension-host', 'package.json'), 
  '@slashmd/md-mapper', 'extension-host depends on md-mapper');

// 8. Check build scripts
console.log('\n🔨 Build Scripts:');
fileExists(path.join(__dirname, '..', 'scripts', 'copy-webview-assets.js'), 
  'Asset copy script exists');
fileExists(path.join(__dirname, '..', 'package.json'), 
  'Root package.json exists');
fileContains(path.join(__dirname, '..', 'package.json'), 
  'build:integration', 'Root package has integration build script');

// Summary
console.log('\n📊 Validation Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All integration checks passed!');
  console.log('The SlashMD components are properly integrated and ready for testing.');
} else {
  console.log(`\n⚠️  ${failed} integration issues found.`);
  console.log('Please address these issues before proceeding with end-to-end testing.');
}

// Additional integration notes
console.log('\n📝 Integration Status:');
console.log('• Core packages: md-mapper, webview-ui, extension-host');
console.log('• Build pipeline: Asset copying and bundling configured');
console.log('• Data flow: Markdown ↔ Block[] ↔ Lexical ↔ VS Code');
console.log('• Messaging: Bidirectional WebView ↔ Extension communication');
console.log('• Types: Shared type definitions for consistency');

console.log('\n🚀 Next Steps:');
console.log('1. Build all packages: npm run build');
console.log('2. Test in VS Code: Open .md file with SlashMD extension');
console.log('3. Verify editing: Type, use slash commands, drag blocks');
console.log('4. Test assets: Paste images, verify file creation');
console.log('5. Test sync: Edit externally, verify UI updates');

process.exit(failed > 0 ? 1 : 0);