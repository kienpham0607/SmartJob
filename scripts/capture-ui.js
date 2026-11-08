import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('.local/screenshots', { recursive: true });
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'chrome',
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.locator('.job-card').first().waitFor();
  await page.screenshot({ path: '.local/screenshots/home-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.local/screenshots/home-mobile.png', fullPage: true });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Đã chụp giao diện desktop/mobile. Không có lỗi JavaScript runtime.');
} finally {
  await browser.close();
}
