import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const manifest = JSON.parse(
  await readFile(new URL('../manifest.json', import.meta.url), 'utf8')
);

test('declares a Manifest V3 content script for X only', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.background, undefined);
  assert.deepEqual(manifest.content_scripts, [
    {
      matches: ['https://x.com/*', 'https://twitter.com/*'],
      js: ['content.js'],
      run_at: 'document_idle'
    }
  ]);
});

test('contains every declared local file', async () => {
  const files = [
    ...Object.values(manifest.icons),
    ...manifest.content_scripts.flatMap((script) => script.js)
  ];

  await Promise.all(
    files.map((file) => access(new URL(`../${file}`, import.meta.url)))
  );
});
