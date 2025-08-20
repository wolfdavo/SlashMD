#!/usr/bin/env node
/**
 * Copy webview-ui dist files to extension-host/media for bundling
 * This script is used during the build process to integrate the React app
 */

const fs = require('fs');
const path = require('path');

// Paths
const srcDir = path.join(__dirname, '..', 'packages', 'webview-ui', 'dist', 'assets');
const destDir = path.join(__dirname, '..', 'packages', 'extension-host', 'media');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

/**
 * Copy file from src to dest
 */
function copyFile(srcFile, destFile) {
  try {
    fs.copyFileSync(srcFile, destFile);
    console.log(`✓ Copied ${path.basename(srcFile)} -> ${path.basename(destFile)}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to copy ${srcFile}: ${error.message}`);
    return false;
  }
}

/**
 * Find the main JS and CSS files from Vite build
 */
function findBuildFiles(assetsDir) {
  if (!fs.existsSync(assetsDir)) {
    console.error(`Assets directory not found: ${assetsDir}`);
    console.error('Make sure to run "npm run build" in webview-ui package first');
    return { jsFile: null, cssFile: null };
  }

  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  const cssFile = files.find(f => f.startsWith('index-') && f.endsWith('.css'));

  if (!jsFile) {
    console.error('Could not find main JS file in assets directory');
  }
  
  if (!cssFile) {
    console.error('Could not find main CSS file in assets directory');
  }

  return { jsFile, cssFile };
}

console.log('🔧 Copying webview-ui assets to extension-host/media...');

// Find the built files
const { jsFile, cssFile } = findBuildFiles(srcDir);

let success = true;

// Copy JavaScript bundle
if (jsFile) {
  const srcJs = path.join(srcDir, jsFile);
  const destJs = path.join(destDir, 'webview-bundle.js');
  success = copyFile(srcJs, destJs) && success;
} else {
  success = false;
}

// Copy CSS bundle
if (cssFile) {
  const srcCss = path.join(srcDir, cssFile);
  const destCss = path.join(destDir, 'webview-bundle.css');
  success = copyFile(srcCss, destCss) && success;
} else {
  success = false;
}

if (success) {
  console.log('✅ Successfully copied all webview assets');
  console.log(`📁 Assets location: ${destDir}`);
} else {
  console.error('❌ Failed to copy some webview assets');
  process.exit(1);
}