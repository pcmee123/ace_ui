const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const root = path.resolve(__dirname, '..');
  const results = [];
  try {
    for (const touch of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href + '#components');
      assert.equal(await page.evaluate(() => matchMedia('(pointer:coarse)').matches), touch);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const theme of ['dark', 'light', 'sage', 'eye']) {
          await page.evaluate(t => AceUI.setTheme(t), theme);
          const values = await page.locator('#component-8 .ace-switch').evaluateAll(items => items.map(el => {
            const box = el.getBoundingClientRect();
            const before = getComputedStyle(el, '::before');
            const transform = new DOMMatrixReadOnly(before.transform);
            const left = parseFloat(before.left) + transform.m41 + parseFloat(getComputedStyle(el).borderLeftWidth);
            return { width: box.width, height: box.height, knobWidth: parseFloat(before.width), knobLeft: left, checked: el.checked, disabled: el.disabled };
          }));
          assert.equal(values.length, 3);
          for (const value of values) {
            assert.equal(value.width, touch ? 42 : 34, `Track width ${theme}/${width}/${touch}`);
            assert.equal(value.height, touch ? 26 : 20, `Track height ${theme}/${width}/${touch}`);
            assert.ok(value.knobLeft >= 2 && value.knobLeft + value.knobWidth <= value.width - 2, 'Thumb must stay inside the track');
          }
          assert.equal(values[0].checked, true);
          assert.equal(values[1].checked, false);
          assert.equal(values[2].disabled, true);
          const plain = await page.locator('#component-7 input').evaluateAll(items => items.map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
          plain.forEach(value => assert.deepEqual(value, { width: 16, height: 16 }, 'Checkbox/radio sizing changed'));
          results.push({ theme, viewport: width, pointer: touch ? 'coarse' : 'fine', track: `${values[0].width}x${values[0].height}`, passed: true });
        }
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.evaluate(() => AceUI.setTheme('dark'));
      const first = page.locator('#component-8 .ace-switch').first();
      await first.click();
      assert.equal(await first.isChecked(), false);
      await first.focus();
      await page.keyboard.press('Space');
      assert.equal(await first.isChecked(), true);
      await page.locator('#component-8').screenshot({ path: path.join(__dirname, 'screenshots', touch ? 'switch-coarse.png' : 'switch-fine.png') });
      await page.goto(pathToFileURL(path.join(root, 'templates/settings.html')).href);
      const widths = await page.locator('.ace-switch').evaluateAll(items => items.map(el => el.getBoundingClientRect().width));
      assert.equal(widths.length, 2);
      widths.forEach(value => assert.equal(value, touch ? 42 : 34));
      await context.close();
    }
    await fs.writeFile(path.join(__dirname, 'switch-results.json'), JSON.stringify({ status: 'passed', cases: results.length, results, behaviors: ['pointer click', 'keyboard Space', 'disabled state', 'thumb containment', 'checkbox and radio unaffected', 'settings template'] }, null, 2) + '\n');
    console.log(`PASS: ${results.length} theme/viewport/pointer combinations; switch geometry, click, keyboard and settings verified.`);
  } finally { await browser.close(); }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
