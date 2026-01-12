# Bug Report: Custom Editors Fail to Open AI-Created Files Until Opened in Text Editor First (Cursor assertion error)

## Summary

Custom editors (including custom editor providers via the VS Code API `CustomTextEditorProvider`, and other Markdown preview editors) cannot open files that were created by Cursor's AI until those files have been opened at least once in the standard text editor. The operation fails with "Assertion Failed: Argument is 'undefined' or 'null'".

**Key finding**: Simply opening the file once in the text editor is enough to fix it - you don't need to accept the diff, make changes, or save. This suggests Cursor is lazily initializing document state (for diff tracking), and custom editors bypass that initialization.

## Environment

- **Cursor Version**: \[your version]
- **OS**: macOS (darwin 25.1.0)
- **Extension**: SlashMD (custom Markdown editor using `CustomTextEditorProvider`)

## Steps to Reproduce

1. Install any extension that provides a custom editor for `.md` files (e.g., SlashMD via `CustomTextEditorProvider`, or Markdown preview editors)
2. Ask Cursor's AI to create a new Markdown file (e.g., "Create a file called test.md with some content")
3. The AI creates the file and Cursor shows the diff view
4. Try to open the newly created `.md` file using a custom editor (SlashMD, Markdown preview, etc.)
5. **Result**: Error dialog appears: "Unable to open 'test.md' - Assertion Failed: Argument is 'undefined' or 'null'"

## Expected Behavior

The custom editor should be able to open the file, regardless of whether there's a pending diff to review.

## Actual Behavior

The custom editor fails to open with an assertion error. The file cannot be opened in a custom editor until the user opens it once in the standard text editor first. No other action is required - just opening it once is enough.

## Workaround

Simply open the file **once** in the plain text editor first (right-click → "Open With..." → "Text Editor"). You don't need to:

- Accept the diff
- Make any changes
- Save the file

Just opening it once in the text editor is enough. After that, the custom editor works fine for that file.

## Analysis / Evidence

The issue appears to be in how Cursor initializes document state for AI-created files (likely tied to diff tracking):

1. When AI creates a file, Cursor tracks it for diff display but may not fully initialize the `TextDocument` state
2. Custom editors are invoked through Cursor's custom editor open pipeline, which fails before the provider is even called (assertion is thrown before `resolveCustomTextEditor` runs)
3. Opening in the standard text editor triggers proper document initialization
4. After that, custom editors work fine

**Key observation A**: The same newly created file also fails to open in other custom editors (e.g., Markdown preview editors) with the same assertion error. This suggests it's not extension-specific.

**Key observation B**: Extension-level debugging shows the extension activates normally, but when the crash happens there is no call into the custom editor provider (no `resolveCustomTextEditor`), indicating the failure occurs inside Cursor before extension code can run.

**Key observation C**: Opening the file once in the built-in text editor resolves the issue without accepting the diff or saving, suggesting the text editor path is the one that initializes Cursor's diff/document state.

**Key observation D**: If you click "Keep" on the AI-created file (accepting it), then restart the Extension Host, the file opens in custom editors without issue. This confirms the bug is specifically in Cursor's **"keep" state tracking** — the document state is only fully initialized when the file is "kept" or when the text editor forces initialization as a side effect.

### Log Evidence (Renderer)

From Cursor's `renderer.log`, when attempting to open an AI-created markdown file in a custom editor:

```
[error] Unable to retrieve document from URI 'file:///.../test/quick-reference.md'
  at Wss.getDocument (.../extensionHostProcess.js:...)
  at Fss.$resolveCustomEditor (.../extensionHostProcess.js:...)
...
[error] Error: Assertion Failed: Argument is `undefined` or `null`.
  at .../workbench.desktop.main.js:...
```

This strongly suggests the failure happens in Cursor/VS Code core before any custom editor provider is invoked.

## Impact

This significantly impacts workflows where AI frequently creates or modifies files that have custom editor providers. Users must manually open each AI-created file in the text editor first before their preferred custom editor will work. This adds friction to AI-assisted workflows and defeats the purpose of having a default custom editor.

## Suggested Fix

The "keep" state tracking for AI-created files appears to lazily initialize document state. This initialization should happen eagerly (when the file is created) or on-demand for any editor type, not just the text editor.

Specifically:

1. When AI creates a file, initialize `TextDocument` state immediately — don't wait for "keep" or text editor open
2. Alternatively, ensure the initialization that happens when opening in text editor also runs for custom editors
3. The custom editor open path (`$resolveCustomEditor`) should not assume document state is already initialized — it should trigger the same initialization the text editor path does

## Minimal Reproduction Extension

If needed, I can provide a minimal VS Code extension that reproduces this issue - it would just register a `CustomTextEditorProvider` for `.md` files and try to read `document.getText()`.

---

**Related**: This may be related to other "phantom modifications" issues reported on the forum.
