const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const base = process.env.UI_URL || 'http://127.0.0.1:8095';
const themes = ['dark', 'light', 'sage', 'eye'];
const routes = ['overview', 'foundations', 'components', 'layouts', 'icons', 'standards', 'start'];
const templates = ['dashboard', 'list', 'settings', 'detail', 'chat', 'login', 'mobile', 'starter'];

function lum(hex) {
  const values = hex.replace('#', '').match(/../g).slice(0, 3).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}
function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

async function main() {
  await fs.mkdir(path.join(__dirname, 'screenshots'), { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [], missing = [], external = [];
  page.on('pageerror', err => errors.push(err.stack || err.message));
  page.on('response', res => { if (res.status() >= 400) missing.push(res.url()); });
  page.on('request', req => { if (!req.url().startsWith(base) && !req.url().startsWith('file:') && !req.url().startsWith('data:')) external.push(req.url()); });
  let cases = 0;
  async function checkLayout(label) {
    const size = await page.evaluate(() => ({ total: document.documentElement.scrollWidth, view: innerWidth }));
    assert.ok(size.total <= size.view + 1, `${label}: whole-page overflow ${size.total}/${size.view}`);
    cases++;
  }
  try {
    // 120 combinations: every docs route and template, all colors, two form factors.
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + '/');
      for (const theme of themes) {
        await page.evaluate(t => AceUI.setTheme(t), theme);
        for (const route of routes) {
          await page.evaluate(r => { location.hash = r; }, route);
          await page.waitForFunction(r => !document.querySelector(`[data-page="${r}"]`).hidden, route);
          await checkLayout(`${route}/${theme}/${width}`);
          if (route === 'overview' && width === 1440) await page.screenshot({ path: path.join(__dirname, `screenshots/overview-${theme}.png`), fullPage: true });
        }
      }
      for (const template of templates) {
        await page.goto(`${base}/templates/${template}.html`);
        for (const theme of themes) {
          await page.evaluate(t => AceUI.setTheme(t), theme);
          await checkLayout(`${template}/${theme}/${width}`);
        }
        if (width === 390 && ['mobile', 'list', 'settings', 'login'].includes(template)) {
          await page.evaluate(() => AceUI.setTheme('dark'));
          await page.screenshot({ path: path.join(__dirname, `screenshots/${template}-390.png`), fullPage: true });
        }
      }
    }

    // Identical component geometry after each palette change.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + '/#components');
    const shapes = [];
    for (const theme of themes) {
      await page.evaluate(t => AceUI.setTheme(t), theme);
      shapes.push(await page.locator('#component-1 .ace-btn--primary').evaluate(el => { const c = getComputedStyle(el), b = el.getBoundingClientRect(); return [b.width, b.height, c.fontSize, c.borderRadius, c.padding]; }));
    }
    shapes.forEach(v => assert.deepEqual(v, shapes[0], 'Theme changed button geometry'));
    await page.evaluate(() => AceUI.setTheme('dark'));
    await page.screenshot({ path: path.join(__dirname, 'screenshots/components-dark.png'), fullPage: true });

    // Native dialog, field validation and keyboard behavior.
    const trigger = page.locator('#component-23 [data-ace-open]');
    await trigger.click();
    assert.equal(await page.locator('#example-dialog').evaluate(d => d.open), true);
    assert.equal(await page.locator('#example-dialog input').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#example-dialog').evaluate(d => d.open), false);
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    await trigger.click();
    await page.locator('#example-dialog input').fill('新的 ACE 项目');
    await page.locator('#example-dialog button[type=submit]').click();
    assert.equal(await page.locator('#example-dialog').evaluate(d => d.open), false);
    await page.getByText('工作空间已创建（本地演示）', { exact: true }).waitFor();
    await page.locator('#tab-1').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-2').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#panel-2').isVisible(), true);
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#tab-1').getAttribute('aria-selected'), 'true');
    await page.locator('#component-15 [data-page="next"]').click();
    assert.equal(await page.locator('#component-15 [aria-current=page]').textContent(), '2');
    await page.locator('#component-17 button').nth(1).click();
    assert.equal(await page.locator('#component-17 [aria-pressed=true]').textContent(), '过去 1 小时');
    await page.locator('#component-19 .ace-dropdown summary').click();
    assert.equal(await page.locator('#component-19 .ace-dropdown').evaluate(d => d.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#component-19 .ace-dropdown').evaluate(d => d.open), false);

    // Source copy and icon search/export.
    await page.goto(base + '/#icons');
    await page.locator('#icon-search').fill('server');
    assert.equal(await page.locator('[data-icon-name]:visible').count(), 1);
    await page.locator('[data-icon-name="server"]').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(copied.includes('<svg') && copied.includes('xmlns='));
    await page.locator('#icon-search').fill('no-match-for-this-icon');
    assert.equal(await page.locator('#icon-empty').isVisible(), true);

    // Real local list filtering and pagination.
    await page.goto(base + '/templates/list.html');
    assert.equal(await page.locator('tbody tr:visible').count(), 4);
    await page.locator('[data-table-page="2"]').click();
    await page.locator('tbody tr:visible').filter({ hasText: 'edge-router-05' }).waitFor();
    await page.locator('[data-demo-search]').fill('xyz-no-result');
    assert.equal(await page.locator('tbody tr:visible').count(), 0);
    assert.equal(await page.locator('[data-demo-no-results]').isVisible(), true);
    await page.locator('[data-demo-clear]').click();
    await page.locator('[data-filter="离线"]').click();
    assert.equal(await page.locator('tbody tr:visible').count(), 1);
    await page.locator('tbody tr:visible button').click();
    assert.equal(await page.locator('#drawer-resource').textContent(), 'edge-router-05');
    await page.keyboard.press('Escape');

    // Form validation, chat text safety and local file selection.
    await page.goto(base + '/templates/login.html');
    await page.locator('input[type=email]').fill('invalid');
    assert.equal(await page.locator('#login-form').evaluate(f => f.checkValidity()), false);
    await page.locator('input[type=email]').fill('hello@example.com');
    await page.locator('input[type=password]').fill('12345678');
    assert.equal(await page.locator('#login-form').evaluate(f => f.checkValidity()), true);
    await page.locator('#login-form button[type=submit]').click();
    await page.getByText('登录表单校验通过（未连接认证服务）', { exact: true }).waitFor();
    await page.goto(base + '/templates/chat.html');
    const payload = '<img src=x onerror="window.__unsafe=1">';
    await page.locator('#chat-input').fill(payload);
    await page.locator('[data-demo-chat] button[type=submit]').click();
    assert.equal(await page.locator('.ace-message--user .ace-message__body').textContent(), payload);
    assert.equal(await page.evaluate(() => window.__unsafe), undefined);
    await page.goto(base + '/#components');
    await page.locator('[data-demo-file]').setInputFiles({ name: 'config.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    assert.ok((await page.locator('[data-demo-file-output]').textContent()).includes('config.json'));

    // Mobile navigation: expand, focus boundary, Escape and route.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/');
    assert.equal(await page.locator('.ace-sidebar').evaluate(s => s.inert), true);
    await page.locator('[data-ace-nav-toggle]').click();
    assert.equal(await page.locator('[data-ace-nav-toggle]').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('.ace-sidebar').evaluate(s => s.inert), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-ace-nav-toggle]').getAttribute('aria-expanded'), 'false');
    await page.locator('[data-ace-nav-toggle]').click();
    await page.locator('.ace-nav a[href="#layouts"]').click();
    assert.equal(await page.locator('[data-ace-nav-toggle]').getAttribute('aria-expanded'), 'false');
    await page.waitForFunction(() => !document.querySelector('[data-page="layouts"]').hidden);
    await page.goto(base + '/');
    await page.evaluate(() => AceUI.setTheme('sage'));
    await page.reload();
    assert.equal(await page.evaluate(() => AceUI.getTheme()), 'sage');
    await page.evaluate(() => AceUI.setTheme('dark'));
    await page.screenshot({ path: path.join(__dirname, 'screenshots/overview-390.png'), fullPage: true });

    // Offline/double-click delivery and default theme without stored preferences.
    const offline = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const local = await offline.newPage();
    local.on('pageerror', err => errors.push('file: ' + (err.stack || err.message)));
    await local.goto(pathToFileURL(path.join(root, 'index.html')).href);
    assert.equal(await local.evaluate(() => AceUI.getTheme()), 'dark');
    await local.locator('.theme-card[data-ace-set-theme="light"]').first().click();
    assert.equal(await local.evaluate(() => AceUI.getTheme()), 'light');
    await local.goto(pathToFileURL(path.join(root, 'templates/list.html')).href);
    await local.locator('[data-demo-search]').fill('api-gateway');
    assert.equal(await local.locator('tbody tr:visible').count(), 1);
    await offline.close();

    // Contrast contracts for essential text, primary actions and input boundaries.
    const tokenData = JSON.parse(await fs.readFile(path.join(root, 'tokens/ace-tokens.json'), 'utf8'));
    const contrasts = {};
    for (const theme of themes) {
      const t = tokenData.themes[theme];
      contrasts[theme] = { text: contrast(t.text, t.surface), secondary: contrast(t['text-secondary'], t.surface), action: contrast(t.action, t['on-action']), inputBorder: contrast(t['border-strong'], t.field) };
      assert.ok(contrasts[theme].text >= 4.5 && contrasts[theme].secondary >= 4.5 && contrasts[theme].action >= 4.5, theme + ' text contrast');
      assert.ok(contrasts[theme].inputBorder >= 3, theme + ' input border contrast ' + contrasts[theme].inputBorder);
    }
    assert.deepEqual(errors, [], 'Browser script errors');
    assert.deepEqual(missing, [], 'Missing runtime assets');
    assert.deepEqual(external, [], 'Unexpected network dependency');
    const result = { status: 'passed', layoutCases: cases, themes, viewports: [1440, 390], routes: routes.length, templates: templates.length, icons: Object.keys(JSON.parse(await fs.readFile(path.join(root, 'icons/ace-icons.json'), 'utf8'))).length, interactions: ['dialog focus/escape/submit', 'keyboard tabs', 'icon search/copy', 'list filter/pagination/empty/drawer', 'form validation', 'chat safe text', 'file selection', 'mobile nav', 'theme persistence', 'offline file preview'], contrasts, scriptErrors: errors, missingAssets: missing, externalRequests: external };
    await fs.writeFile(path.join(__dirname, 'results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
