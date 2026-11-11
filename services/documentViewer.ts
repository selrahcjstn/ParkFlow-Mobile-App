import { api } from './axios';
import * as WebBrowser from "expo-web-browser";
import { API_URL, SERVER_BASE_URL, getApiConfigurationError } from "./apiConfig";

export function formatDocumentUrl(value?: string | null): string {
  const url = value?.trim() ?? "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/?uploads\//i.test(url)) return `${SERVER_BASE_URL}/${url.replace(/^\//, "")}`;
  return "";
}

/** Works out what a stored document is without opening anything, so a screen can show it inline. */
export async function resolveDocument(value: string): Promise<{ kind: "image" | "pdf"; url: string }> {
  const configurationError = getApiConfigurationError();
  if (configurationError) throw new Error(configurationError);
  if (value.startsWith('private-uploads/')) {
    const result = await api.get('/files/document/url', { params: { url: value } }) as unknown as { url: string };
    if (!result.url) throw new Error('Could not open this private document. Please try again.');
    value = /^https?:/.test(result.url) ? result.url : `${SERVER_BASE_URL}${result.url}`;
  }
  if (!formatDocumentUrl(value))
    throw new Error("This document link is unavailable. Please upload the document again or contact campus administration.");

  // Use ParkFlow's existing local-file/authenticated Cloudinary endpoint.
  // Never send a private document to a third-party online PDF viewer.
  const identifier = value.trim().startsWith(`${SERVER_BASE_URL}/uploads/`)
    ? value.trim().slice(SERVER_BASE_URL.length + 1) : value.trim();
  let signedDocument = false;
  if (/^https?:/i.test(value)) {
    const candidate = new URL(value);
    if (candidate.pathname === "/api/files/document") {
      const authority = new URL(SERVER_BASE_URL);
      if (candidate.origin !== authority.origin || candidate.username || candidate.password)
        throw new Error("This private document link does not belong to the configured ParkFlow server.");
      signedDocument = true;
    }
  }
  const url = signedDocument ? value : `${API_URL}/files/document?url=${encodeURIComponent(identifier)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let contentType = "";
  try {
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    if (!response.ok) {
      if (response.status === 404)
        throw new Error("This document could not be retrieved. Please upload it again or contact campus administration.");
      throw new Error("ParkFlow could not open this document. Please try again.");
    }
    contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("Opening the document took too long. Please try again.");
    if (error instanceof TypeError)
      throw new Error("Could not reach ParkFlow to open the document. Please try again.");
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (contentType.startsWith("image/")) return { kind: "image", url };
  if (contentType.includes("application/pdf") || (contentType.includes("application/octet-stream") && /\.pdf(?:[?#]|$)/i.test(value))) return { kind: "pdf", url };
  throw new Error("This document is not a supported PDF or image. Please upload it again.");
}

export async function openPdf(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    throw new Error("Could not open the PDF viewer on this device. Please try again.");
  }
}

export async function previewDocument(value: string): Promise<{ imageUrl: string } | null> {
  const document = await resolveDocument(value);
  if (document.kind === "image") return { imageUrl: document.url };
  await openPdf(document.url);
  return null;
}
