import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import type { Root } from 'mdast';

export interface StringifyOptions {
  wrapWidth?: number;
  bulletStyle?: '-' | '*' | '+';
  fenceStyle?: '`' | '~';
}

export function stringifyMarkdown(root: Root, options: StringifyOptions = {}): string {
  const result = toMarkdown(root, {
    extensions: [gfmToMarkdown()],
    bullet: options.bulletStyle || '-',
    fence: options.fenceStyle || '`',
    listItemIndent: 'one',
    rule: '-',
  });

  return result;
}
