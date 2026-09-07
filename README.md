# ShareX API Uploader

Upload the active text document to your [ShareX API](https://github.com/busheezy/sharex-api) server and copy its paste link to the clipboard.

## Use

Requires VS Code 1.101 or later.

1. Set `share.apiUrl` to your paste upload endpoint, for example `https://share.example.com/p`.
2. Set `share.responseUrl` to your paste viewer base URL, for example `https://paste.example.com`.
3. Run **Share: Set Secret** from the Command Palette to save your API key.
4. Open a document and run **Share: Upload**.

The command uploads the entire current document, including unsaved edits. It sends the `paste` multipart field and `X-API-Key` header used by the API. Secrets use VS Code's SecretStorage and are masked during entry. Cancelling the secret prompt cancels the upload.

Uploads time out after 30 seconds. Redirects are rejected to avoid forwarding an API key to another origin; configure the final upload URL. Success is reported after the link reaches the clipboard.

## Development

Use Node.js 24.19+ within 24.x and pnpm 10.34.5.

```sh
nvm use
npm install --global pnpm@10.34.5
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm package
```

Press F5 to open an Extension Development Host. The repository recommends Oxc, EditorConfig, and GitHub Actions extensions. Use `pnpm format` and `pnpm lint:fix` for local formatting and fixes.

```sh
pnpm test
```

On headless Linux, use `xvfb-run -a pnpm test`. The existing test suite downloads a VS Code host and contains a starter assertion; it does not exercise real uploads. CI runs it, validates the build, and uploads a `.vsix` artifact. Packaging requires no global `vsce` installation. The extension has no runtime npm dependencies.

The Node version above is for development and packaging. The installed extension uses VS Code's own Node runtime.

## License

See [LICENSE.txt](LICENSE.txt).
