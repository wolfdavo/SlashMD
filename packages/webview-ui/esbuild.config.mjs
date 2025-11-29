import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const isWatch = process.argv.includes('--watch');

// Ensure output directory exists
const outdir = path.join(process.cwd(), '..', 'extension-host', 'dist');
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const buildOptions = {
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: path.join(outdir, 'webview.js'),
  platform: 'browser',
  format: 'iife',
  target: ['es2020'],
  sourcemap: true,
  minify: !isWatch,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'css',
  },
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
};

// Minify CSS by removing comments, extra whitespace, and newlines
function minifyCss(css) {
  if (isWatch) return css; // Skip minification in watch mode for faster builds
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around punctuation
    .replace(/;}/g, '}') // Remove trailing semicolons
    .trim();
}

// Copy CSS file to dist (minified in production)
async function copyCss() {
  const cssSource = path.join(process.cwd(), 'src', 'styles.css');
  const cssDest = path.join(outdir, 'webview.css');
  let css = fs.readFileSync(cssSource, 'utf8');
  css = minifyCss(css);
  fs.writeFileSync(cssDest, css);
}

async function build() {
  try {
    // Copy CSS
    copyCss();

    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();

      // Watch CSS file for changes
      fs.watch(path.join(process.cwd(), 'src', 'styles.css'), () => {
        copyCss();
        console.log('CSS updated');
      });

      console.log('Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('Build complete');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
