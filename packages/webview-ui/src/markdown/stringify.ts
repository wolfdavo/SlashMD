import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { mathToMarkdown } from 'mdast-util-math';
import { frontmatterToMarkdown } from 'mdast-util-frontmatter';
import * as wikiLinkMdast from 'mdast-util-wiki-link';
import type { Root } from 'mdast';

export interface StringifyOptions {
  wrapWidth?: number;
  bulletStyle?: '-' | '*' | '+';
  fenceStyle?: '`' | '~';
}

// Wiki-link options: use | as the alias divider (Obsidian/Foam style)
const wikiLinkOptions = { aliasDivider: '|' };

export function stringifyMarkdown(root: Root, options: StringifyOptions = {}): string {
  let result = toMarkdown(root, {
    extensions: [gfmToMarkdown(), mathToMarkdown(), frontmatterToMarkdown(['yaml']), wikiLinkMdast.toMarkdown(wikiLinkOptions)],
    bullet: options.bulletStyle || '-',
    fence: options.fenceStyle || '`',
    listItemIndent: 'one',
    rule: '-',
  });

  // Post-process: convert escaped spaces back to regular spaces
  // mdast-util-to-markdown escapes leading/trailing spaces at paragraph
  // boundaries as &#x20; which looks ugly in raw markdown
  result = result.replace(/&#x20;/g, ' ');

  // Post-process: unescape wiki-link brackets that were escaped
  // mdast-util-to-markdown escapes [ to \[ to prevent link interpretation
  // Pattern: \[\[content]] or \[\[content\]\] → [[content]]
  result = result.replace(/\\\[\\\[([^\]\n]+?)\]\]/g, '[[$1]]');
  result = result.replace(/\\\[\\\[([^\]\n]+?)\\\]\\\]/g, '[[$1]]');

  return result;
}
