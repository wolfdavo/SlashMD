import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { mathToMarkdown } from 'mdast-util-math';
import type { Root } from 'mdast';

export interface StringifyOptions {
  wrapWidth?: number;
  bulletStyle?: '-' | '*' | '+';
  fenceStyle?: '`' | '~';
}

export function stringifyMarkdown(root: Root, options: StringifyOptions = {}): string {
  let result = toMarkdown(root, {
    extensions: [gfmToMarkdown(), mathToMarkdown()],
    bullet: options.bulletStyle || '-',
    fence: options.fenceStyle || '`',
    listItemIndent: 'one',
    rule: '-',
  });

  // Post-process: convert escaped spaces back to regular spaces
  // mdast-util-to-markdown escapes leading/trailing spaces at paragraph
  // boundaries as &#x20; which looks ugly in raw markdown
  result = result.replace(/&#x20;/g, ' ');

  return result;
}
