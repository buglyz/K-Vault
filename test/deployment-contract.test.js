const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('deployment entrypoint contract', function () {
  const root = path.resolve(__dirname, '..');

  it('keeps Cloudflare Pages deployment rooted at repository static pages', function () {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

    assert.match(pkg.scripts.build, /No build step required/);
    assert.doesNotMatch(pkg.scripts.build, /frontend|vite|dist/);
    assert.strictEqual(pkg.scripts['pages:deploy'], 'npx wrangler pages deploy .');
  });

  it('does not keep old frontend build assets as deployable UI', function () {
    const removedPaths = [
      'frontend/index.html',
      'frontend/landing',
      'frontend/src',
      'frontend/package.json',
      'frontend/vite.config.js',
      '_nuxt',
    ];

    for (const relativePath of removedPaths) {
      assert.strictEqual(fs.existsSync(path.join(root, relativePath)), false, `${relativePath} should not exist`);
    }
  });

  it('serves Docker from the same root static pages and proxies share routes', function () {
    const dockerfile = fs.readFileSync(path.join(root, 'frontend', 'Dockerfile'), 'utf8');
    const nginx = fs.readFileSync(path.join(root, 'frontend', 'nginx.conf'), 'utf8');

    assert.match(dockerfile, /COPY index\.html \/usr\/share\/nginx\/html\//);
    assert.match(dockerfile, /COPY admin\.html \/usr\/share\/nginx\/html\//);
    assert.doesNotMatch(dockerfile, /_nuxt|frontend\/dist|frontend\/landing/);
    assert.match(nginx, /location\s+\/s\//);
    assert.match(nginx, /GET \/upload renders/);
  });
});
