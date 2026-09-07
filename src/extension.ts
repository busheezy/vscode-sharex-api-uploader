import { basename } from "node:path";
import { window, ExtensionContext, commands, workspace, env } from "vscode";
import AuthSettings from "./AuthSettings";

function getConfiguredUrl(key: string): URL {
  const configuration = workspace.getConfiguration("share");
  const value = configuration.get<string>(key);

  if (!value) {
    throw new Error(`Set share.${key} in Settings before uploading.`);
  }

  const url = new URL(value);
  const isHttp = url.protocol === "http:" || url.protocol === "https:";

  if (!isHttp || url.username || url.password) {
    throw new Error(`share.${key} must be an HTTP or HTTPS URL without credentials.`);
  }

  return url;
}

function getPasteId(response: unknown): string {
  if (!response || typeof response !== "object" || !("stringId" in response)) {
    throw new Error("The API returned an invalid paste response.");
  }

  const stringId = response.stringId;

  if (typeof stringId !== "string" || stringId.length === 0) {
    throw new Error("The API returned an invalid paste ID.");
  }

  return stringId;
}

async function copyPasteLink(url: string) {
  try {
    await env.clipboard.writeText(url);
  } catch {
    await window.showInputBox({
      title: "Paste uploaded",
      prompt: "Clipboard unavailable. Copy your uploaded paste link manually.",
      value: url,
      ignoreFocusOut: true,
    });
    return;
  }

  await window.showInformationMessage("Paste uploaded. Link copied to clipboard.");
}

async function uploadDocument() {
  const editor = window.activeTextEditor;

  if (!editor) {
    await window.showErrorMessage("No open text document to upload.");
    return;
  }

  const document = editor.document;
  const currentText = document.getText();
  const fileName = basename(document.fileName);

  try {
    const apiUrl = getConfiguredUrl("apiUrl");
    const responseUrl = getConfiguredUrl("responseUrl");
    const settings = AuthSettings.instance;
    const authSecret = await settings.getOrSetAuthSecret();

    if (!authSecret) {
      return;
    }

    const form = new FormData();
    const file = new Blob([currentText], { type: "text/plain" });
    form.append("paste", file, fileName);

    const headers = { "X-API-Key": authSecret };
    const signal = AbortSignal.timeout(30_000);
    const response = await fetch(apiUrl, {
      method: "POST",
      body: form,
      headers,
      signal,
      redirect: "error",
    });

    if (!response.ok) {
      throw new Error(`Upload failed (HTTP ${response.status}). Check your API URL and secret.`);
    }

    const paste: unknown = await response.json();
    const stringId = getPasteId(paste);
    const basePath = responseUrl.pathname.replace(/\/$/, "");
    const encodedId = encodeURIComponent(stringId);
    responseUrl.pathname = `${basePath}/${encodedId}`;
    const fullResponseUrl = responseUrl.toString();

    await copyPasteLink(fullResponseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    await window.showErrorMessage(message);
  }
}

async function setSecret() {
  const settings = AuthSettings.instance;
  const authSecret = await settings.inputAuthSecret();

  if (!authSecret) {
    return;
  }

  await window.showInformationMessage("Auth secret saved.");
}

export async function activate(context: ExtensionContext) {
  AuthSettings.init(context);
  const registerShare = commands.registerCommand("sharex-api-uploader.share", uploadDocument);
  const registerSecret = commands.registerCommand("sharex-api-uploader.setSecret", setSecret);
  context.subscriptions.push(registerShare, registerSecret);
}

export function deactivate() {}
