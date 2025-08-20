/**
 * Tests specific to code block functionality
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src/index';
import type { CodeContent } from '../../src/types';

describe('Code Blocks', () => {
  describe('Parsing', () => {
    it('should parse fenced code blocks with language', () => {
      const markdown = '```javascript\nconsole.log("Hello, world!");\n```';

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code');
      
      const content = blocks[0].content as CodeContent;
      expect(content.language).toBe('javascript');
      expect(content.code).toBe('console.log("Hello, world!");');
      expect(content.showLineNumbers).toBe(false);
    });

    it('should parse fenced code blocks without language', () => {
      const markdown = '```\nsome code here\nwithout language\n```';

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code');
      
      const content = blocks[0].content as CodeContent;
      expect(content.language).toBe('');
      expect(content.code).toBe('some code here\nwithout language');
    });

    it('should handle empty code blocks', () => {
      const markdown = '```\n\n```';

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code');
      
      const content = blocks[0].content as CodeContent;
      expect(content.language).toBe('');
      expect(content.code).toBe('');
    });

    it('should parse code blocks with various languages', () => {
      const testCases = [
        { lang: 'python', code: 'print("Hello")' },
        { lang: 'typescript', code: 'const x: number = 42;' },
        { lang: 'bash', code: 'ls -la' },
        { lang: 'json', code: '{"key": "value"}' },
        { lang: 'markdown', code: '# Heading' },
      ];

      testCases.forEach(({ lang, code }) => {
        const markdown = `\`\`\`${lang}\n${code}\n\`\`\``;
        const blocks = parseMarkdown(markdown);
        
        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe('code');
        
        const content = blocks[0].content as CodeContent;
        expect(content.language).toBe(lang);
        expect(content.code).toBe(code);
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize code blocks with language correctly', () => {
      const markdown = '```javascript\nconsole.log("Hello, world!");\n```';

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should serialize code blocks without language correctly', () => {
      const markdown = '```\nsome code\n```';

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should handle multi-line code blocks', () => {
      const code = `function example() {
  console.log("Line 1");
  console.log("Line 2");
  return true;
}`;
      const markdown = `\`\`\`javascript\n${code}\n\`\`\``;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });
  });

  describe('Round-trip fidelity', () => {
    it('should maintain code block structure through round trips', () => {
      const original = `\`\`\`typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

function getUser(id: number): User | null {
  // Implementation here
  return null;
}
\`\`\``;

      let current = original;
      
      // 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      const finalBlocks = parseMarkdown(current);
      expect(finalBlocks).toHaveLength(1);
      expect(finalBlocks[0].type).toBe('code');
      
      const content = finalBlocks[0].content as CodeContent;
      expect(content.language).toBe('typescript');
      expect(content.code).toContain('interface User');
      expect(content.code).toContain('function getUser');
    });
  });

  describe('Mixed content scenarios', () => {
    it('should handle code blocks mixed with other content', () => {
      const markdown = `# Code Example

Here's how to use the function:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

That's it!`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(4);
      
      expect(blocks[0].type).toBe('heading');
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[2].type).toBe('code');
      expect(blocks[3].type).toBe('paragraph');
      
      const codeContent = blocks[2].content as CodeContent;
      expect(codeContent.language).toBe('javascript');
      expect(codeContent.code).toContain('function greet');
    });
  });

  describe('Edge cases', () => {
    it('should handle code blocks with special characters', () => {
      const code = `const special = "Hello $world! @#%^&*()";
const escaped = special.replace(/[\\$]/g, '\\\\$&');
console.log("Escaped: " + escaped);`;
      
      const markdown = `\`\`\`javascript\n${code}\n\`\`\``;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code');
      
      const content = blocks[0].content as CodeContent;
      expect(content.code).toContain('special =');
      expect(content.code).toContain('replace(');
      expect(content.code).toContain('console.log');
    });

    it('should handle code blocks with backticks inside', () => {
      const code = `console.log(\`Template literal with \${variable}\`);
const markdown = \`\\\`\\\`\\\`javascript
// Nested code block
\\\`\\\`\\\`\`;`;
      
      const markdown = `\`\`\`javascript\n${code}\n\`\`\``;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code');
      
      const content = blocks[0].content as CodeContent;
      expect(content.language).toBe('javascript');
      expect(content.code).toContain('Template literal');
      expect(content.code).toContain('Nested code block');
    });

    it('should handle code blocks with indentation', () => {
      const code = `function example() {
    if (condition) {
        console.log("Indented");
            console.log("More indented");
    }
}`;
      
      const markdown = `\`\`\`javascript\n${code}\n\`\`\``;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code');
      
      const content = blocks[0].content as CodeContent;
      expect(content.code).toBe(code);
      
      // Verify indentation is preserved
      expect(content.code).toContain('    if (condition)');
      expect(content.code).toContain('        console.log("Indented")');
      expect(content.code).toContain('            console.log("More indented")');
    });
  });
});