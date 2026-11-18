const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const screenshotDir = path.join(root, 'docs', 'screenshots');
const themes = ['dark', 'light', 'sage', 'eye'];
const platforms = ['windows', 'mobile'];
const products = { assistant: ['chat', 'history', 'tools'], workbench: ['overview', 'tasks', 'activity'] };

function previewUrl(relative) {
  const base = process.env.UI_URL;
  return base ? new URL(relative, base + '/').href : pathToFileURL(path.join(root, relative)).href;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
  });
  const scriptErrors = [];
  let cases = 0;
  try {
    const gallery = await browser.newPage();
    await gallery.goto(previewUrl('index.html') + '#layouts');
    assert.equal(await gallery.locator('.app-gallery a:visible').count(), 4);
    await gallery.getByRole('link', { name: /Windows AI 助手/ }).click();
    await gallery.waitForURL('**/templates/windows-assistant.html');
    assert.equal(await gallery.locator('[data-view-title]').textContent(), '智能对话');
    await gallery.close();

    for (const platform of platforms) {
      const mobile = platform === 'mobile';
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 },
        isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      page.on('pageerror', error => scriptErrors.push(error.message));
      for (const [product, views] of Object.entries(products)) {
        const slug = platform + '-' + product;
        const url = previewUrl('templates/' + slug + '.html');
        await page.goto(url);
        for (const width of mobile ? [390, 320] : [1440, 760]) {
          await page.setViewportSize({ width, height: mobile ? 844 : 960 });
          for (const theme of themes) {
            await page.evaluate(t => AceUI.setTheme(t), theme);
            for (const view of views) {
              await page.evaluate(id => AceApp.navigate(id), view);
              assert.ok(await page.locator('[data-app-view="' + view + '"]').isVisible());
              assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
              cases++;
            }
          }
        }
        await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 });
        await page.goto(url);
        await page.evaluate(() => AceUI.setTheme('dark'));
        if (process.env.ACE_APP_SCREENSHOTS === '1') {
          await page.screenshot({ path: path.join(screenshotDir, slug + '.png') });
        }

        if (!mobile) {
          const frame = page.locator('.ace-app-frame');
          await page.getByRole('button', { name: '最大化窗口预览' }).click();
          assert.equal(await frame.getAttribute('data-window-state'), 'maximized');
          await page.getByRole('button', { name: '最小化窗口预览' }).click();
          assert.equal(await frame.getAttribute('data-window-state'), 'minimized');
          await page.getByRole('button', { name: '还原窗口预览' }).click();
          assert.equal(await frame.getAttribute('data-window-state'), 'maximized');
          await page.getByRole('button', { name: '关闭窗口预览' }).click();
          assert.equal(await frame.isVisible(), false);
          await page.getByRole('button', { name: '重新打开窗口' }).click();
          assert.equal(await frame.getAttribute('data-window-state'), 'normal');
        }

        await page.locator('.ace-app-topbar').getByRole('button', { name: '外观与模板' }).click();
        await page.getByLabel('界面皮肤').selectOption('sage');
        assert.equal(await page.evaluate(() => AceUI.getTheme()), 'sage');
        assert.equal(await page.locator('#app-settings').isVisible(), true);
        await page.locator('#app-settings').getByRole('button', { name: '关闭面板' }).click();

        const nav = page.locator(mobile ? '.ace-app-mobile-nav' : '.ace-app-sidebar .ace-nav');
        if (product === 'assistant') {
          await nav.getByRole('link', { name: '工具', exact: true }).click();
          await page.getByRole('button', { name: /制定项目计划/ }).click();
          assert.match(await page.getByLabel('发给 ACE 助手').inputValue(), /启动计划/);
          await page.locator('.ace-app-topbar').getByRole('button', { name: '模型与上下文' }).click();
          await page.getByLabel('演示模型', { exact: true }).selectOption('analysis');
          assert.equal(await page.locator('[data-current-model]').textContent(), 'ACE 分析');
          await page.locator('#app-context').getByRole('button', { name: '关闭面板' }).click();
          await page.getByRole('button', { name: '发送', exact: true }).click();
          assert.equal(await page.locator('#app-messages article').count(), 2);
          assert.match(await page.locator('#app-messages').textContent(), /ACE 分析/);
          await nav.getByRole('link', { name: '历史', exact: true }).click();
          await page.locator('[data-app-view="history"]').getByRole('button', { name: '项目启动计划', exact: true }).click();
          assert.match(await page.locator('#app-messages').textContent(), /本周的项目启动/);
          await page.reload();
          assert.match(await page.locator('#app-messages').textContent(), /本周的项目启动/);
        } else {
          await page.getByRole('button', { name: '新建任务', exact: true }).click();
          await page.getByLabel('任务名称').fill('验证双端布局');
          await page.getByLabel('负责人', { exact: true }).fill('陈安');
          await page.getByRole('button', { name: '创建任务', exact: true }).click();
          await page.getByLabel('搜索任务').fill('验证双端');
          assert.equal(await page.locator('[data-task-count]').textContent(), '1 项任务');
          await page.locator('[data-task-id]:visible').click();
          await page.getByLabel('任务状态', { exact: true }).selectOption('done');
          await page.getByRole('button', { name: '保存状态' }).click();
          await page.getByLabel('任务状态筛选').selectOption('doing');
          assert.equal(await page.locator('[data-empty-tasks]').isVisible(), true);
          await page.getByRole('button', { name: '清除筛选' }).click();
          assert.equal(await page.locator('[data-task-count]').textContent(), '5 项任务');
          await nav.getByRole('link', { name: '动态', exact: true }).click();
          assert.match(await page.locator('[data-activity-list="40"]').textContent(), /更新为已完成/);
          await page.reload();
          assert.match(await page.locator('[data-activity-list="40"]').textContent(), /验证双端布局/);
        }
      }
      await context.close();
    }
    assert.deepEqual(scriptErrors, []);
    console.log('PASS: ' + cases + ' app layout combinations, window controls, theme switching, chat history and task workflows.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
