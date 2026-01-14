import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { math } from 'micromark-extension-math';
import { mathFromMarkdown } from 'mdast-util-math';
import { frontmatter } from 'micromark-extension-frontmatter';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { syntax as wikiLinkSyntax } from 'micromark-extension-wiki-link';
import * as wikiLinkMdast from 'mdast-util-wiki-link';
import type { Root, Content, PhrasingContent } from 'mdast';

export interface ParseOptions {
  mathEnabled?: boolean;
}

export interface ParseResult {
  root: Root;
}

// Wiki-link options: use | as the alias divider (Obsidian/Foam style)
const wikiLinkOptions = { aliasDivider: '|' };

/**
 * Normalize wiki-links with empty aliases: [[target|]] → [[target]]
 * The micromark parser doesn't handle empty aliases, so we pre-process them.
 */
function normalizeWikiLinks(text: string): string {
  // Match [[target|]] and convert to [[target]]
  return text.replace(/\[\[([^\]|]+)\|\]\]/g, '[[$1]]');
}

export function parseMarkdown(text: string, _options: ParseOptions = {}): ParseResult {
  // Pre-process to handle edge cases
  const normalizedText = normalizeWikiLinks(text);
  
  const root = fromMarkdown(normalizedText, {
    extensions: [gfm(), math(), frontmatter(['yaml']), wikiLinkSyntax(wikiLinkOptions)],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown(), frontmatterFromMarkdown(['yaml']), wikiLinkMdast.fromMarkdown(wikiLinkOptions)],
  });

  return { root };
}

// Type guards for mdast nodes
export function isParagraph(node: Content): node is Extract<Content, { type: 'paragraph' }> {
  return node.type === 'paragraph';
}

export function isHeading(node: Content): node is Extract<Content, { type: 'heading' }> {
  return node.type === 'heading';
}

export function isList(node: Content): node is Extract<Content, { type: 'list' }> {
  return node.type === 'list';
}

export function isListItem(node: Content): node is Extract<Content, { type: 'listItem' }> {
  return node.type === 'listItem';
}

export function isBlockquote(node: Content): node is Extract<Content, { type: 'blockquote' }> {
  return node.type === 'blockquote';
}

export function isCode(node: Content): node is Extract<Content, { type: 'code' }> {
  return node.type === 'code';
}

export function isThematicBreak(node: Content): node is Extract<Content, { type: 'thematicBreak' }> {
  return node.type === 'thematicBreak';
}

export function isTable(node: Content): node is Extract<Content, { type: 'table' }> {
  return node.type === 'table';
}

export function isImage(node: Content | PhrasingContent): node is Extract<Content, { type: 'image' }> {
  return node.type === 'image';
}

export function isLink(node: Content | PhrasingContent): node is Extract<Content, { type: 'link' }> {
  return node.type === 'link';
}

export function isHtml(node: Content): node is Extract<Content, { type: 'html' }> {
  return node.type === 'html';
}

export function isText(node: Content | PhrasingContent): node is Extract<PhrasingContent, { type: 'text' }> {
  return node.type === 'text';
}

export function isStrong(node: Content | PhrasingContent): node is Extract<PhrasingContent, { type: 'strong' }> {
  return node.type === 'strong';
}

export function isEmphasis(node: Content | PhrasingContent): node is Extract<PhrasingContent, { type: 'emphasis' }> {
  return node.type === 'emphasis';
}

export function isInlineCode(node: Content | PhrasingContent): node is Extract<PhrasingContent, { type: 'inlineCode' }> {
  return node.type === 'inlineCode';
}

export function isDelete(node: Content | PhrasingContent): node is Extract<PhrasingContent, { type: 'delete' }> {
  return node.type === 'delete';
}
