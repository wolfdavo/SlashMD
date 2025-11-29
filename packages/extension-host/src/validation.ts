// Runtime validation schemas for extension host
import { z } from 'zod';

// Text edit schema with validation
export const TextEditSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  newText: z.string().max(10_000_000), // 10MB limit for text content
});

// UI → Host message schemas
export const ApplyTextEditsMessageSchema = z.object({
  type: z.literal('APPLY_TEXT_EDITS'),
  edits: z.array(TextEditSchema).max(10000),
  reason: z.enum(['typing', 'drag', 'paste', 'format']),
});

export const WriteAssetMessageSchema = z.object({
  type: z.literal('WRITE_ASSET'),
  dataUri: z.string().max(50_000_000), // 50MB limit for data URIs
  suggestedName: z.string().max(256).optional(),
});

export const RequestInitMessageSchema = z.object({
  type: z.literal('REQUEST_INIT'),
});

export const RequestSettingsMessageSchema = z.object({
  type: z.literal('REQUEST_SETTINGS'),
});

export const UIToHostMessageSchema = z.discriminatedUnion('type', [
  ApplyTextEditsMessageSchema,
  WriteAssetMessageSchema,
  RequestInitMessageSchema,
  RequestSettingsMessageSchema,
]);

// Type exports
export type TextEdit = z.infer<typeof TextEditSchema>;
export type UIToHostMessage = z.infer<typeof UIToHostMessageSchema>;
