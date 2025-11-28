import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import type { Root, Content, PhrasingContent } from 'mdast';

export interface ParseOptions {
  mathEnabled?: boolean;
}

export interface ParseResult {
  root: Root;
}

export function parseMarkdown(text: string, _options: ParseOptions = {}): ParseResult {
  const root = fromMarkdown(text, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
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
