# Publishing SlashMD

This guide covers how to publish the SlashMD extension to the VS Code Marketplace and make it available for Cursor users.

## Prerequisites

1. **Azure DevOps Account** - Required for VS Code Marketplace publishing
2. **Personal Access Token (PAT)** - For authenticating with the marketplace
3. **Publisher Account** - A registered publisher on the VS Code Marketplace

## One-Time Setup

### 1. Create an Azure DevOps Organization

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Sign in with your Microsoft account (or create one)
3. Create an organization if you don't have one

### 2. Create a Personal Access Token (PAT)

1. In Azure DevOps, click your profile icon → **Personal access tokens**
2. Click **New Token**
3. Configure:
   - **Name**: `vsce` (or any name you prefer)
   - **Organization**: Select "All accessible organizations"
   - **Expiration**: Set as needed (max 1 year)
   - **Scopes**: Select **Custom defined**, then:
     - Find **Marketplace** → Check **Manage**
4. Click **Create** and **copy the token immediately** (you won't see it again)

### 3. Create a Publisher

1. Go to the [VS Code Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Click **Create publisher**
3. Fill in:
   - **ID**: `slashmd` (must match `publisher` in package.json)
   - **Name**: Your display name
4. Click **Create**

### 4. Login with vsce

```bash
npx vsce login slashmd
```

Enter your PAT when prompted. This stores credentials locally.

## Publishing

### Build and Package

```bash
# From the repository root
npm install
npm run build
npm run package
```

This creates `slashmd.vsix` in `packages/extension-host/`.

**Note:** The package script uses a workaround for npm workspaces. It copies only the necessary files (package.json, LICENSE, dist/, media/) to a temporary directory before packaging, which avoids vsce including parent directory files from the monorepo. Source maps are also excluded to keep the package small (~350 KB).

### Publish to Marketplace

```bash
# From packages/extension-host directory
cd packages/extension-host
npx vsce publish --packagePath slashmd.vsix
```

Or build and publish in one step (bumps version automatically):

```bash
npx vsce publish minor  # Bumps minor version and publishes
npx vsce publish patch  # Bumps patch version and publishes
```

### Verify Publication

1. Visit your extension at: `https://marketplace.visualstudio.com/items?itemName=slashmd.slashmd`
2. It may take a few minutes to appear after publishing

## Updating the Extension

1. Update the version in `packages/extension-host/package.json`
2. Update CHANGELOG.md (if you have one)
3. Build and publish:

```bash
npm run build
cd packages/extension-host
npx vsce publish
```

## Cursor Compatibility

Cursor uses the Open VSX Registry by default but can also install from:

1. **VS Code Marketplace** - Cursor can install extensions directly from the VS Code Marketplace
2. **VSIX file** - Users can manually install your `.vsix` file

### Publishing to Open VSX (Optional)

For better Cursor discoverability, also publish to [Open VSX](https://open-vsx.org/):

1. Create an account at [open-vsx.org](https://open-vsx.org/)
2. Generate an access token in your account settings
3. Publish:

```bash
npx ovsx publish slashmd-0.0.1.vsix -p <your-token>
```

Or install ovsx globally:

```bash
npm install -g ovsx
ovsx publish slashmd-0.0.1.vsix -p <your-token>
```

## Marketing & Branding

Your extension's marketplace presence is important for discoverability. Configure these in `packages/extension-host/package.json`:

### Extension Icon (Required)

Create a **128x128 PNG** icon and add it to your package.json:

```json
{
  "icon": "media/icon.png"
}
```

The path is relative to the package.json file. Use a clear, recognizable icon that works at small sizes.

### Gallery Banner (Optional)

Customize the marketplace page header:

```json
{
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  }
}
```

Theme can be `"dark"` or `"light"` — choose based on your banner color for readable text.

### Categories

Choose appropriate categories for discoverability (max 5):

```json
{
  "categories": [
    "Other",
    "Formatters",
    "Visualization"
  ]
}
```

Available categories: `Programming Languages`, `Snippets`, `Linters`, `Themes`, `Debuggers`, `Formatters`, `Keymaps`, `SCM Providers`, `Other`, `Extension Packs`, `Language Packs`, `Data Science`, `Machine Learning`, `Visualization`, `Notebooks`, `Education`, `Testing`.

### Keywords

Add up to 5 keywords to improve search visibility:

```json
{
  "keywords": [
    "markdown",
    "wysiwyg",
    "notion",
    "block-editor",
    "md"
  ]
}
```

### Repository & Bugs

Link to your source code and issue tracker:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/slashmd"
  },
  "bugs": {
    "url": "https://github.com/your-org/slashmd/issues"
  },
  "homepage": "https://github.com/your-org/slashmd#readme"
}
```

### License

Specify your license:

```json
{
  "license": "MIT"
}
```

### Current SlashMD Configuration

The extension currently has:
- ✅ `displayName`: "SlashMD — Block-Based Markdown"
- ✅ `description`: "A Notion-like block-based WYSIWYG editor for Markdown files"
- ✅ `icon`: media/icon.png
- ✅ `categories`: Other, Formatters, Visualization
- ✅ `keywords`: markdown, wysiwyg, notion, block-editor, md
- ✅ `repository`: https://github.com/wolfdavo/SlashMD
- ✅ `galleryBanner`: Dark theme (#161617)
- ✅ `license`: MIT

## Pre-Publish Checklist

- [ ] Version number updated in `packages/extension-host/package.json`
- [ ] All changes committed and pushed
- [ ] Tests pass: `npm run test`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Extension works in Extension Development Host (F5)
- [ ] README.md is up to date
- [ ] CHANGELOG.md updated (if applicable)
- [ ] Extension icon added (128x128 PNG)
- [ ] Categories updated for discoverability
- [ ] Keywords added for search visibility
- [ ] Repository URL configured

## Troubleshooting

### "Publisher not found"

Ensure the `publisher` field in `package.json` matches your registered publisher ID exactly.

### "Invalid PAT"

- Token may have expired - create a new one
- Ensure "Marketplace > Manage" scope is selected
- Ensure "All accessible organizations" is selected

### Package fails to build

```bash
# Clean and rebuild
rm -rf packages/*/dist packages/*/node_modules
npm install
npm run build
npm run package
```

### Package includes parent directory files

This is a known issue with vsce in npm workspaces/monorepos. The package script works around this by copying files to a temporary directory before packaging. If you still see issues:

1. Ensure you're running `npm run package` (not `npx vsce package` directly)
2. Check that the package script in `packages/extension-host/package.json` includes the temp directory workaround
3. Verify the output shows only the expected files (~350 KB total)

### Extension not appearing in search

- New extensions may take 10-15 minutes to index
- Ensure your extension has a good `displayName`, `description`, and `categories` in package.json

## Useful Commands

```bash
# Show extension info without publishing
npx vsce show slashmd.slashmd

# Package without publishing (creates .vsix)
npx vsce package

# Unpublish (use with caution!)
npx vsce unpublish slashmd.slashmd
```

## Links

- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VS Code Marketplace](https://marketplace.visualstudio.com/)
- [Publisher Management](https://marketplace.visualstudio.com/manage)
- [Open VSX Registry](https://open-vsx.org/)
