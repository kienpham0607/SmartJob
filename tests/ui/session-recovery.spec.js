import { test, expect } from '@playwright/test';

test('lỗi mạng khi khôi phục phiên không xóa JWT; thử lại bằng API thật và loại JWT sai', async ({
  page,
}) => {
  await page.goto(`${process.env.SMARTJOB_UI_URL}/register`);
  await page.getByLabel('Họ và tên').fill('Ứng viên khôi phục phiên');
  await page.getByLabel('Địa chỉ email').fill('recovery@browser.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Recovery-Strong42!');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  const token = await page.evaluate(() => sessionStorage.getItem('smartjob-token'));
  expect(token).toBeTruthy();

  // Inject only a transport failure. No API response or product data is fabricated.
  let disconnected = true;
  await page.route('**/api/users/me', (route) =>
    disconnected ? route.abort('failed') : route.continue(),
  );
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Không thể kết nối máy chủ');
  expect(await page.evaluate(() => sessionStorage.getItem('smartjob-token'))).toBe(token);
  await expect(page).toHaveURL(/\/profile$/);

  disconnected = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hồ sơ nghề nghiệp.' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('smartjob-token'))).toBe(token);

  await page.evaluate(() => sessionStorage.setItem('smartjob-token', 'invalid-jwt'));
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem('smartjob-token'))).toBeNull();
});
