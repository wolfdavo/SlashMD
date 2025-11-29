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

This creates `slashmd-0.0.1.vsix` in `packages/extension-host/`.

### Publish to Marketplace

```bash
# From packages/extension-host directory
cd packages/extension-host
npx vsce publish
```

Or publish a specific version:

```bash
npx vsce publish 0.1.0  # Sets version and publishes
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

## Pre-Publish Checklist

- [ ] Version number updated in `packages/extension-host/package.json`
- [ ] All changes committed and pushed
- [ ] Tests pass: `npm run test`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Extension works in Extension Development Host (F5)
- [ ] README.md is up to date
- [ ] CHANGELOG.md updated (if applicable)

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
