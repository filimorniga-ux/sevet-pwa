import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function getHtmlFiles() {
  const root = process.cwd();
  const pagesDir = join(root, 'pages');
  const pageFiles = readdirSync(pagesDir)
    .filter((file) => file.endsWith('.html'))
    .map((file) => join(pagesDir, file));

  return [join(root, 'index.html'), ...pageFiles];
}

describe('navigation links', () => {
  it('no incluye enlaces legacy de tienda online', () => {
    const htmlFiles = getHtmlFiles();

    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      expect(html).not.toContain('nav-shopify-link');
      expect(html).not.toContain('href="/pages/tienda.html"');
    }
  });
});
