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
  it('el enlace nav-shopify-link apunta siempre a la tienda interna', () => {
    const htmlFiles = getHtmlFiles();

    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      const navShopifyLinks = html.match(/<a\b[^>]*class="[^"]*\bnav-shopify-link\b[^"]*"[^>]*>/g) || [];

      for (const linkTag of navShopifyLinks) {
        expect(linkTag).toContain('href="/pages/tienda.html"');
        expect(linkTag).not.toContain('href="#"');
        expect(linkTag).not.toContain('target="_blank"');
      }
    }
  });
});
