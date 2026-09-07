# Migration: September 7, 2026

This guide covers `ec944b1` (the last commit before September 7 in America/Chicago) through `e0f1a99`.

## Upgrade an existing installation

1. Upgrade VS Code to 1.136 or later; the old minimum was 1.69. Node 24 is required only for development/packaging, not as a separate installation for extension users.
2. Install the updated VSIX through **Extensions: Install from VSIX...** and reload VS Code. Obtain a VSIX from the selected revision's successful CI artifact, or build it using the commands below. A repository push does not publish a Marketplace update. The package version is still `0.1.0`, so check the artifact's source revision rather than relying on the version number to distinguish builds.
3. Keep the existing `share.apiUrl` and `share.responseUrl` setting names. Set `share.apiUrl` to the final paste upload endpoint, for example `https://share.example.com/p`. Set `share.responseUrl` to the viewer base, for example `https://paste.example.com`. Both must be HTTP/HTTPS URLs without embedded username/password credentials.
4. Remove any dependency on upload redirects. The new HTTP client rejects redirects; replace HTTP-to-HTTPS or old-domain URLs with their final destination in settings. Requests now time out after 30 seconds, so check slow upload paths and reverse-proxy behavior.
5. Keep your saved API key. SecretStorage still uses `API_SECRET_KEY`, so an in-place update under the same extension identity/profile needs no secret conversion. If the secret is unavailable in a new profile/host or the API key changed, run **Share: Set Secret**. The prompt is now masked, and cancelling it cancels the upload.

The command IDs remain `sharex-api-uploader.share` and `sharex-api-uploader.setSecret`; existing keybindings remain valid. Multipart field `paste`, header `X-API-Key`, and response field `stringId` are unchanged, so the API does not need to be upgraded at the same time.

## Verify and roll back

Open a disposable document and run **Share: Upload**. The command continues to upload the editor's current text, including unsaved changes. Verify the resulting paste matches what is in the editor. Check that your viewer URL opens correctly. If clipboard access fails after a successful upload, a selectable field shows the existing link; copy it manually instead of uploading again.

Save your prior VSIX and settings before upgrading. To roll back, reinstall that VSIX and reload VS Code, retaining the same settings and secret. No server data migration is involved. Uploads already created remain on the server.

## Building from source

Use the repository's `.nvmrc` (Node 24.19.0) and pnpm 12.3.4 instead of the old Node/package-manager setup. From the updated checkout:

```sh
nvm use
npm install --global pnpm@12.3.4
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

Keep the committed lockfile. Update custom CI jobs and editor integrations to use `pnpm check`, Oxlint, and Oxfmt instead of the removed ESLint/Prettier setup. Format with `pnpm format`.

Then package the extension:

```sh
pnpm package
```

Install the resulting `sharex-api-uploader-0.1.0.vsix`. Packaging now uses the local `@vscode/vsce` tool and `--no-dependencies`; no global `vsce` is needed. Custom pipelines should use pnpm instead of Yarn. Runtime `got` and `form-data` dependencies have been replaced by built-in fetch/FormData APIs; do not copy the old runtime dependency tree into the package.

The existing `pnpm test` suite requires a downloaded VS Code host (and `xvfb-run -a pnpm test` on headless Linux). It contains a starter assertion rather than upload coverage, so perform the manual upload check above.
