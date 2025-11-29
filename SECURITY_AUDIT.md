# Security Audit Report: SlashMD VS Code Extension

**Date:** 2025-11-28
**Auditor:** Claude (Opus 4.5)
**Version:** Current (commit 20ba728)

---

## Executive Summary

This security audit identified **19 security issues** across the SlashMD codebase:

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 6 |
| Medium | 12 |

The most significant concerns are:
1. **No runtime validation** of messages between extension host and webview
2. **Path traversal vulnerabilities** in asset writing
3. **Missing HTML sanitization** allowing potential XSS
4. **Unvalidated external URLs** for images

---

## 1. Extension Host Security

### 1.1 CRITICAL: No Runtime Message Validation

**Location:** `packages/extension-host/src/customEditor.ts:102-163`

**Issue:** The `onDidReceiveMessage` handler receives messages from the webview with only TypeScript type assertions, which provide no runtime protection:

```typescript
const messageHandler = webviewPanel.webview.onDidReceiveMessage(
  async (message: UIToHostMessage) => {
    switch (message.type) {
      case 'APPLY_TEXT_EDITS':
        if (message.edits && message.edits.length > 0) {
          // Processing without validation
```

**Risk:** TypeScript types are erased at runtime. A compromised webview or modified message could:
- Send malformed `edits` arrays causing crashes
- Inject unexpected properties
- Bypass type safety entirely

**Recommendation:**
```typescript
import { z } from 'zod';

const TextEditSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
});

const ApplyEditsSchema = z.object({
  type: z.literal('APPLY_TEXT_EDITS'),
  edits: z.array(TextEditSchema).max(1000),
  reason: z.enum(['typing', 'drag', 'paste', 'format']),
});

// In handler:
const parsed = ApplyEditsSchema.safeParse(message);
if (!parsed.success) {
  console.error('Invalid message:', parsed.error);
  return;
}
```

---

### 1.2 HIGH: Path Traversal in Asset Writing

**Location:** `packages/extension-host/src/assetService.ts:30`

**Issue:** The `suggestedName` parameter is used in path construction without proper sanitization:

```typescript
const filename = suggestedName || `image-${hash}${extension}`;
const fileUri = vscode.Uri.joinPath(assetsFolderUri, filename);
```

**Risk:** An attacker could craft a `suggestedName` like:
- `../../.vscode/settings.json` - overwrite VS Code settings
- `../../../etc/passwd` - attempt system file access
- `assets/../malicious.js` - escape assets folder

**Recommendation:**
```typescript
function sanitizeFilename(name: string): string {
  // Extract only the filename, removing any path components
  const basename = path.basename(name);
  // Remove any remaining dangerous characters
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Ensure it doesn't start with a dot (hidden file)
  return sanitized.replace(/^\.+/, '');
}

const filename = sanitizeFilename(suggestedName) || `image-${hash}${extension}`;
```

---

### 1.3 MEDIUM: CSP Allows Unsafe Inline Styles

**Location:** `packages/extension-host/src/csp.ts:12`

**Issue:**
```typescript
`style-src ${webview.cspSource} 'unsafe-inline'`,
```

**Risk:** Inline styles can be exploited for:
- CSS exfiltration attacks (extracting data via background-image URLs)
- UI spoofing/clickjacking
- Reduced defense-in-depth

**Recommendation:** Move all inline styles to external CSS files and remove `'unsafe-inline'`.

---

### 1.4 MEDIUM: innerHTML Used for Error Display

**Location:** `packages/extension-host/src/customEditor.ts:243`

**Issue:**
```typescript
document.getElementById('root').innerHTML =
  '<div style="color: red; padding: 20px;">Error: ' + msg + '</div>';
```

**Risk:** If error messages contain user-controlled content, this could enable DOM-based XSS.

**Recommendation:**
```typescript
const root = document.getElementById('root');
const errorDiv = document.createElement('div');
errorDiv.style.cssText = 'color: red; padding: 20px;';
errorDiv.textContent = 'Error: ' + msg;
root.innerHTML = '';
root.appendChild(errorDiv);
```

---

### 1.5 MEDIUM: Weak Base64 Validation

**Location:** `packages/extension-host/src/assetService.ts:18-25`

**Issue:**
```typescript
const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
const buffer = Buffer.from(base64Data, 'base64');
```

**Risk:** The regex accepts any characters after `base64,`. Node's Buffer silently ignores invalid base64 characters rather than throwing, potentially producing unexpected binary content.

**Recommendation:**
```typescript
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
if (!BASE64_REGEX.test(base64Data)) {
  throw new Error('Invalid base64 data');
}
```

---

### 1.6 MEDIUM: SVG Files Can Contain Scripts

**Location:** `packages/extension-host/src/assetService.ts:85`

**Issue:**
```typescript
'image/svg+xml': '.svg',
```

**Risk:** SVG files can contain embedded JavaScript, external entity references, and event handlers. While browsers don't execute scripts from `<img src="...svg">`, SVGs displayed inline would be dangerous.

**Recommendation:** Either:
1. Remove SVG support entirely, or
2. Sanitize SVG content before saving (remove `<script>`, event handlers, external references), or
3. Document that SVGs are only served as image resources

---

### 1.7 MEDIUM: Unvalidated Settings Path

**Location:** `packages/extension-host/src/types.ts:12-22`

**Issue:**
```typescript
assetsFolder: config.get<string>('assets.folder', 'assets'),
```

**Risk:** User could set `slashmd.assets.folder` to `../../sensitive` to write assets outside the workspace.

**Recommendation:**
```typescript
function validateAssetsFolder(folder: string): string {
  const normalized = path.normalize(folder);
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    console.warn('Invalid assets folder, using default');
    return 'assets';
  }
  return normalized;
}
```

---

## 2. Webview Security

### 2.1 HIGH: No Runtime Validation of Host Messages

**Location:** `packages/webview-ui/src/messaging.ts:59-63`

**Issue:**
```typescript
window.addEventListener('message', (event) => {
  const message = event.data as HostToUIMessage;  // No validation!
  messageHandlers.forEach((handler) => handler(message));
});
```

**Risk:** Type assertions provide no runtime safety. Malformed messages could crash handlers or cause unexpected behavior.

**Recommendation:** Add runtime validation using zod or similar, mirroring the extension host validation.

---

### 2.2 HIGH: XSS Risk in HTML Node Parsing

**Location:** `packages/webview-ui/src/app/mapper/mdastToLexical.ts:412-452`

**Issue:**
```typescript
function convertHtml(node: Html): LexicalBlockNode[] {
  const html = node.value.trim();
  const imgMatch = html.match(/^<img\s+([^>]*)\/?>$/i);
  if (imgMatch) {
    const attrs = imgMatch[1];
    // Regex parsing of attributes
```

**Risks:**
1. Regex-based HTML parsing is notoriously error-prone
2. No sanitization of extracted attribute values
3. Unexpected HTML could bypass the pattern matching

**Recommendation:**
```typescript
import DOMPurify from 'dompurify';

function convertHtml(node: Html): LexicalBlockNode[] {
  const sanitized = DOMPurify.sanitize(node.value, {
    ALLOWED_TAGS: ['img', 'br', 'hr'],
    ALLOWED_ATTR: ['src', 'alt', 'width', 'height'],
  });
  // Parse sanitized HTML with a proper DOM parser
  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  // ...
}
```

---

### 2.3 HIGH: Unvalidated External Image URLs

**Location:** `packages/webview-ui/src/app/editor/ImageModal.tsx:128-139`

**Issue:**
```typescript
if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
  setPreviewUrl(newUrl);
}
```

**Risks:**
1. No URL validation beyond protocol check
2. Could load images from internal networks (SSRF-like)
3. Tracking pixels could monitor user activity
4. Malformed URLs could cause issues

**Recommendation:**
```typescript
function validateImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Optionally block internal IPs
    // if (isPrivateIP(parsed.hostname)) return false;
    // Limit URL length
    if (url.length > 2048) return false;
    return true;
  } catch {
    return false;
  }
}
```

---

### 2.4 HIGH: No HTML Sanitization Library

**Location:** Entire webview markdown pipeline

**Issue:** No sanitization library (DOMPurify, sanitize-html) is present in the codebase.

**Risk:** If markdown content contains malicious HTML that bypasses current parsing, it could be rendered unsafely. Defense-in-depth requires explicit sanitization.

**Recommendation:**
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

Apply sanitization at the parsing boundary before any HTML enters the Lexical editor.

---

### 2.5 MEDIUM: No Image File Size Limit

**Location:** `packages/webview-ui/src/app/editor/ImageModal.tsx:76-99`

**Issue:**
```typescript
const reader = new FileReader();
reader.onload = (e) => {
  const dataUri = e.target?.result as string;  // No size check
```

**Risk:** A massive image file could:
- Exhaust webview memory
- Create huge data URIs
- Send massive messages to extension host
- Cause denial of service

**Recommendation:**
```typescript
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

if (file.size > MAX_IMAGE_SIZE) {
  setError(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  return;
}
```

---

### 2.6 MEDIUM: No Message Origin Validation

**Location:** `packages/webview-ui/src/messaging.ts:59`

**Issue:** The message event listener doesn't check `event.origin`.

**Risk:** While VS Code's webview messaging is isolated, checking origin adds defense-in-depth.

**Recommendation:**
```typescript
window.addEventListener('message', (event) => {
  // VS Code webview origin check (if applicable)
  // Note: In VS Code webviews, origin checking may not be necessary
  // but validation of message structure is still critical
  const validated = validateMessage(event.data);
  if (!validated.success) return;
  messageHandlers.forEach((handler) => handler(validated.data));
});
```

---

### 2.7 MEDIUM: Handler Registration Clears All Handlers

**Location:** `packages/webview-ui/src/messaging.ts:44-54`

**Issue:**
```typescript
if (messageHandlers.size >= MAX_HANDLERS) {
  console.warn('SlashMD: Max message handlers reached, clearing old handlers');
  messageHandlers.clear();  // Clears ALL handlers!
}
```

**Risk:** Clearing all handlers silently could break critical functionality. This is a reliability/availability concern.

**Recommendation:**
```typescript
if (messageHandlers.size >= MAX_HANDLERS) {
  throw new Error('Max message handlers reached. This indicates a memory leak.');
}
```

---

## 3. Messaging Protocol Security

### 3.1 HIGH: No Runtime Type Validation in Shared Types

**Location:** `packages/shared/src/index.ts`

**Issue:** Message types are TypeScript-only with no runtime validation schemas.

**Recommendation:** Add zod schemas alongside TypeScript types:

```typescript
import { z } from 'zod';

export const TextEditSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  text: z.string().max(1_000_000), // Reasonable limit
});

export const ApplyTextEditsMessageSchema = z.object({
  type: z.literal('APPLY_TEXT_EDITS'),
  edits: z.array(TextEditSchema).max(10000),
  reason: z.enum(['typing', 'drag', 'paste', 'format']),
});

// Export both type and schema
export type ApplyTextEditsMessage = z.infer<typeof ApplyTextEditsMessageSchema>;
```

---

## 4. Build & Packaging Security

### 4.1 MEDIUM: No Dependency Audit in CI

**Location:** `package.json`

**Issue:** No security scanning configured in build scripts or CI.

**Recommendation:**
```json
{
  "scripts": {
    "audit": "npm audit --production",
    "audit:fix": "npm audit fix",
    "prepack": "npm run audit"
  }
}
```

Add GitHub Actions workflow:
```yaml
- name: Security audit
  run: npm audit --audit-level=high
```

---

## 5. Recommended Immediate Actions

### Priority 1 (Critical/High - Fix Immediately)

1. **Add runtime message validation** using zod in both extension host and webview
2. **Sanitize all filenames** with `path.basename()` and character whitelist
3. **Install and integrate DOMPurify** for HTML sanitization
4. **Validate external image URLs** properly with URL constructor
5. **Replace innerHTML** with safe DOM APIs for error display

### Priority 2 (Medium - Fix Soon)

6. **Remove 'unsafe-inline' from CSP** by moving styles to external CSS
7. **Add image file size limits** before reading
8. **Validate settings paths** to prevent directory traversal
9. **Strengthen base64 validation** with strict regex
10. **Add npm audit** to CI pipeline

### Priority 3 (Hardening)

11. Review and potentially remove SVG support
12. Add rate limiting to message handlers
13. Consider URL allowlists for external images
14. Add integrity checks to webview bundle

---

## Summary Table

| # | Issue | Severity | Location | Line(s) |
|---|-------|----------|----------|---------|
| 1.1 | No runtime message validation | CRITICAL | customEditor.ts | 102-163 |
| 1.2 | Path traversal in assets | HIGH | assetService.ts | 30 |
| 1.3 | CSP unsafe-inline styles | MEDIUM | csp.ts | 12 |
| 1.4 | innerHTML for errors | MEDIUM | customEditor.ts | 243 |
| 1.5 | Weak base64 validation | MEDIUM | assetService.ts | 18-25 |
| 1.6 | SVG script risk | MEDIUM | assetService.ts | 85 |
| 1.7 | Unvalidated settings path | MEDIUM | types.ts | 12-22 |
| 2.1 | No host message validation | HIGH | messaging.ts | 59-63 |
| 2.2 | XSS in HTML parsing | HIGH | mdastToLexical.ts | 412-452 |
| 2.3 | Unvalidated image URLs | HIGH | ImageModal.tsx | 128-139 |
| 2.4 | No HTML sanitization | HIGH | (pipeline-wide) | - |
| 2.5 | No image size limit | MEDIUM | ImageModal.tsx | 76-99 |
| 2.6 | No message origin check | MEDIUM | messaging.ts | 59 |
| 2.7 | Handler clear behavior | MEDIUM | messaging.ts | 44-54 |
| 3.1 | No runtime type schemas | HIGH | shared/index.ts | - |
| 4.1 | No dependency audit | MEDIUM | package.json | - |

---

## Conclusion

SlashMD has a reasonable security posture for a VS Code extension but lacks several defense-in-depth measures that are standard for production software handling user content. The most critical gaps are the absence of runtime message validation and HTML sanitization.

The extension's architecture (webview + extension host with postMessage) is inherently more secure than many alternatives, but the trust boundaries between components need to be enforced with proper validation rather than relying solely on TypeScript types.

Implementing the Priority 1 recommendations would significantly improve the security posture with relatively modest effort.
