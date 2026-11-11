import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../services/documentViewer.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function viewer({ status = 200, mime = 'application/pdf', networkError, browserError, timeout = false, server = 'http://54.90.173.98:5000', privateUrl } = {}) {
  const requests = [];
  const opened = [];
  const privateRequests = [];
  let onTimeout;
  let cleared = false;
  const exports = {};
  vm.runInNewContext(code, {
    exports, AbortController, Error, TypeError, URL,
    setTimeout(callback, delay) { assert.equal(delay, 30_000); onTimeout = callback; return 1; },
    clearTimeout() { cleared = true; },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (timeout) { onTimeout(); throw Error('Aborted'); }
      if (networkError) throw new TypeError('Network request failed');
      return { ok: status >= 200 && status < 300, status, headers: { get: () => mime } };
    },
    require(name) {
      if (name === './axios') return { api: { get: async (...args) => { privateRequests.push(args); return { url: privateUrl }; } } };
      if (name === './apiConfig') return { API_URL: server + '/api', SERVER_BASE_URL: server, getApiConfigurationError: () => null };
      if (name === 'expo-web-browser') return { openBrowserAsync: async url => {
        opened.push(url);
        if (browserError) throw Error('Browser not available');
      } };
      throw Error('Unexpected dependency: ' + name);
    },
  });
  return { ...exports, requests, opened, privateRequests, get cleared() { return cleared; } };
}

for (const path of ['uploads/parkflow/cor/file.pdf', '/uploads/parkflow/orcr/file.pdf',
  'https://res.cloudinary.com/parkflow/raw/upload/v123/parkflow/cor/file.pdf']) {
  test(`PDF uses the checked ParkFlow document endpoint: ${path}`, async () => {
    const v = viewer();
    assert.equal(await v.previewDocument(path), null);
    assert.equal(v.requests[0].options.method, 'HEAD');
    assert.equal(v.requests[0].url, `http://54.90.173.98:5000/api/files/document?url=${encodeURIComponent(path)}`);
    assert.equal(v.opened[0], v.requests[0].url);
    assert.equal(v.cleared, true);
  });
}

test('absolute server-storage URLs use the relative identifier supported by the backend', async () => {
  const v = viewer();
  await v.previewDocument('http://54.90.173.98:5000/uploads/parkflow/cor/file.pdf');
  assert.match(v.requests[0].url, /url=uploads%2Fparkflow%2Fcor%2Ffile.pdf$/);
});

test('local development document requests stay on the configured local API', async () => {
  const v = viewer({ server: 'http://192.168.100.13:5044' });
  await v.previewDocument('uploads/parkflow/cor/file.pdf');
  assert.match(v.opened[0], /^http:\/\/192\.168\.100\.13:5044\/api\/files\/document/);
});

test('image documents stay in the image preview instead of opening a PDF browser', async () => {
  const v = viewer({ mime: 'image/jpeg' });
  const result = await v.previewDocument('uploads/parkflow/orcr/image.jpg');
  assert.equal(result.imageUrl, v.requests[0].url);
  assert.equal(v.opened.length, 0);
});

test('PDFs delivered as binary files are not mistaken for images', async () => {
  const v = viewer({ mime: 'application/octet-stream' });
  assert.equal(await v.previewDocument('uploads/parkflow/orcr/file.pdf'), null);
  assert.equal(v.opened.length, 1);
});

for (const [options, message] of [
  [{ status: 404 }, /could not be retrieved/],
  [{ status: 403 }, /could not open/],
  [{ status: 500 }, /could not open/],
  [{ mime: 'text/html' }, /not a supported PDF or image/],
  [{ networkError: true }, /Could not reach ParkFlow/],
  [{ timeout: true }, /took too long/],
]) {
  test(`unavailable document gives an error without opening a blank browser: ${JSON.stringify(options)}`, async () => {
    const v = viewer(options);
    await assert.rejects(v.previewDocument('uploads/parkflow/cor/file.pdf'), message);
    assert.equal(v.opened.length, 0);
    assert.equal(v.cleared, true);
  });
}

test('device browser failures have a readable message', async () => {
  const v = viewer({ browserError: true });
  await assert.rejects(v.previewDocument('uploads/parkflow/cor/file.pdf'), /PDF viewer on this device/);
});

test('placeholder and device-only document links are not treated as remote server documents', async () => {
  const v = viewer();
  for (const value of ['', 'pending', 'file:///old-phone/document.pdf', 'content://document/42', 'javascript:alert(1)']) {
    assert.equal(v.formatDocumentUrl(value), '');
    await assert.rejects(v.previewDocument(value), /link is unavailable/);
  }
  assert.equal(v.requests.length, 0);
});

test('profile shows each document inline through the checked viewer, with no View buttons', () => {
  const profile = readFileSync(new URL('../features/account/pages/ProfilePage.tsx', import.meta.url), 'utf8');
  const card = readFileSync(new URL('../features/account/components/DocumentPreviewCard.tsx', import.meta.url), 'utf8');
  assert.equal([...profile.matchAll(/<DocumentPreviewCard/g)].length, 4);
  assert.doesNotMatch(profile, /handleViewDocument|>\s*View\s*</);
  assert.doesNotMatch(profile, /Linking\.openURL/);
  assert.match(card, /resolveDocument\(url\)/);
  assert.match(card, /accessibilityRole="alert"/);
  assert.match(card, /Tap to try again/);
});

test('resolveDocument identifies images and PDFs without opening a browser', async () => {
  const image = viewer({ mime: 'image/png' });
  assert.deepEqual({ ...await image.resolveDocument('uploads/parkflow/orcr/a.png') }, { kind: 'image', url: image.requests[0].url });
  const pdf = viewer({ mime: 'application/pdf' });
  const resolved = await pdf.resolveDocument('uploads/parkflow/cor/a.pdf');
  assert.equal(resolved.kind, 'pdf'); assert.equal(pdf.opened.length, 0);
  const binary = viewer({ mime: 'application/octet-stream' });
  assert.equal((await binary.resolveDocument('uploads/parkflow/orcr/file.pdf')).kind, 'pdf');
});

test('private documents require an authenticated signed URL before browser preview', async () => {
  const signed = '/api/files/document?token=signed-link';
  const v = viewer({ privateUrl: signed });
  await v.previewDocument('private-uploads/licenses/driver.pdf');
  assert.equal(v.privateRequests[0][0], '/files/document/url');
  assert.equal(v.privateRequests[0][1].params.url, 'private-uploads/licenses/driver.pdf');
  assert.equal(v.opened[0], 'http://54.90.173.98:5000' + signed);
  const denied = viewer();
  await assert.rejects(denied.previewDocument('private-uploads/licenses/driver.pdf'), /private document/);
  assert.equal(denied.requests.length, 0);
  assert.equal(denied.opened.length, 0);
});

for (const link of ['http://api.example.invalid/api/files/document?ticket=synthetic', 'https://other.example.invalid/api/files/document?ticket=synthetic', 'https://user:synthetic@api.example.invalid/api/files/document?ticket=synthetic']) {
  test(`signed document authority is enforced before network access: ${new URL(link).origin}`, async () => {
    const v = viewer({ server: 'https://api.example.invalid', privateUrl: link });
    await assert.rejects(v.previewDocument('private-uploads/licenses/synthetic.pdf'), /does not belong/);
    assert.equal(v.requests.length, 0); assert.equal(v.opened.length, 0);
  });
}
