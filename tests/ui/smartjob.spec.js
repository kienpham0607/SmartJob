import { test, expect } from '@playwright/test';

const password = 'BrowserTest-Strong42!';
const jobTitle = 'Frontend Developer';
const visit = (page, path) => page.goto(`${process.env.SMARTJOB_UI_URL}${path}`);
async function register(page, role, email, name) {
  await visit(page, `/register?role=${role}`);
  await page.getByLabel('Họ và tên').fill(name);
  await page.getByLabel('Địa chỉ email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(role === 'RECRUITER' ? '/recruiter$' : '/profile$'));
}

test('toàn bộ hành trình tuyển dụng qua giao diện và HTTP thật', async ({ browser }) => {
  const recruiterContext = await browser.newContext();
  const candidateContext = await browser.newContext();
  const recruiter = await recruiterContext.newPage();
  const candidate = await candidateContext.newPage();
  const runtimeErrors = [];
  recruiter.on('pageerror', (error) => runtimeErrors.push(error.message));
  candidate.on('pageerror', (error) => runtimeErrors.push(error.message));
  try {
    await register(recruiter, 'RECRUITER', 'recruiter@browser.test', 'Nhà tuyển dụng kiểm thử');
    await recruiter.getByRole('link', { name: 'Đăng tin tuyển dụng', exact: true }).click();
    await recruiter.getByLabel('Tên công việc').fill(jobTitle);
    await recruiter.getByLabel('Tên công ty').fill('SmartJob Browser Labs');
    await recruiter.getByLabel('Địa điểm làm việc').fill('Hà Nội');
    await recruiter.getByLabel('Lương tối thiểu').fill('15000000');
    await recruiter.getByLabel('Lương tối đa').fill('25000000');
    await recruiter.getByLabel('Số năm kinh nghiệm tối thiểu').fill('2');
    await recruiter.getByLabel('Kỹ năng yêu cầu').fill('React, Node.js');
    await recruiter
      .getByLabel('Mô tả công việc')
      .fill('Phát triển ứng dụng React và Node.js. Làm việc cùng đội ngũ sản phẩm.');
    await recruiter.getByRole('button', { name: 'Đăng tin tuyển dụng', exact: true }).click();
    await expect(recruiter.getByRole('link', { name: jobTitle, exact: true })).toBeVisible();

    await register(candidate, 'CANDIDATE', 'candidate@browser.test', 'Ứng viên kiểm thử');
    await candidate.getByLabel('Địa điểm mong muốn').fill('Hà Nội');
    await candidate.getByLabel('Số năm kinh nghiệm', { exact: true }).fill('2');
    await candidate.getByLabel('Vị trí mong muốn').fill('Frontend Developer');
    await candidate.getByLabel('Kỹ năng (phân cách bằng dấu phẩy)').fill('React, Node.js');
    await candidate.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(candidate.getByRole('status')).toContainText('Đã cập nhật hồ sơ');
    await visit(candidate, '/recommendations');
    await expect(candidate.locator('.match-tag')).toHaveText('✦ 100% phù hợp');
    await expect(candidate.locator('.match-reasons')).toContainText('Trùng 2/2 kỹ năng');
    await candidate.getByRole('link', { name: jobTitle, exact: true }).click();
    await candidate
      .getByLabel('Lời giới thiệu')
      .fill('Tôi có kinh nghiệm phù hợp và mong muốn tham gia đội ngũ.');
    await candidate.getByRole('button', { name: 'Ứng tuyển ngay' }).click();
    await expect(candidate.locator('.success-note')).toContainText('Đã gửi hồ sơ!');
    await candidate.reload();
    await candidate.getByRole('button', { name: 'Ứng tuyển ngay' }).click();
    await expect(candidate.locator('.toast.error')).toContainText('đã ứng tuyển');
    await visit(candidate, '/applications');
    await expect(candidate.locator('.application-card')).toHaveCount(1);
    await expect(candidate.locator('.application-status')).toContainText('Đã gửi hồ sơ');

    await recruiter.getByRole('link', { name: 'Xem hồ sơ' }).click();
    await expect(recruiter.getByRole('heading', { name: 'Ứng viên kiểm thử' })).toBeVisible();
    await expect(recruiter.locator('.applicant-text')).toContainText('Tôi có kinh nghiệm phù hợp');
    await recruiter.getByLabel('Trạng thái hồ sơ của Ứng viên kiểm thử').selectOption('reviewing');
    await expect(recruiter.locator('.toast')).toContainText('Đã cập nhật trạng thái');
    await candidate.reload();
    await expect(candidate.locator('.application-status')).toContainText('Đang xem xét');

    await visit(recruiter, '/recruiter');
    await recruiter.getByRole('link', { name: `Sửa tin ${jobTitle}` }).click();
    await recruiter.getByLabel('Tên công việc').fill('Frontend Developer — Đã cập nhật');
    await recruiter.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(
      recruiter.getByRole('link', { name: 'Frontend Developer — Đã cập nhật', exact: true }),
    ).toBeVisible();
    await recruiter.getByRole('button', { name: 'Đang tuyển · Đóng tin' }).click();
    await expect(recruiter.getByRole('button', { name: 'Đã đóng · Mở lại' })).toBeVisible();
    await visit(candidate, '/jobs');
    await expect(
      candidate.getByRole('heading', { name: 'Chưa tìm thấy công việc phù hợp' }),
    ).toBeVisible();
    await recruiter.getByRole('button', { name: 'Đã đóng · Mở lại' }).click();
    await expect(recruiter.getByRole('button', { name: 'Đang tuyển · Đóng tin' })).toBeVisible();
    await visit(candidate, '/jobs?q=Frontend&skill=react&salaryMin=20000000');
    await expect(candidate.locator('.job-card')).toHaveCount(1);
    await visit(candidate, '/recruiter');
    await expect(
      candidate.getByRole('heading', { name: 'Trang này dành cho vai trò khác' }),
    ).toBeVisible();
    await candidate.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await visit(candidate, '/profile');
    await expect(candidate).toHaveURL(/\/login$/);
    await candidate.getByLabel('Địa chỉ email').fill('candidate@browser.test');
    await candidate.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await candidate.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(candidate).toHaveURL(/\/profile$/);

    recruiter.once('dialog', (dialog) => dialog.accept());
    await recruiter
      .getByRole('button', { name: 'Xóa tin Frontend Developer — Đã cập nhật', exact: true })
      .click();
    await expect(
      recruiter.getByRole('heading', { name: 'Chào đón những đồng đội đầu tiên' }),
    ).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  } finally {
    await recruiterContext.close();
    await candidateContext.close();
  }
});

test('mobile/tablet/desktop: menu, tìm kiếm, trang 404 và không tràn ngang', async ({ page }) => {
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await visit(page, '/');
    await expect(page.getByRole('heading', { level: 1, name: /Công việc phù hợp/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Tìm việc làm' }).click();
  await expect(page).toHaveURL(/\/jobs$/);
  await page.getByLabel('Từ khóa', { exact: true }).fill('Không có công việc này');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(
    page.getByRole('heading', { name: 'Chưa tìm thấy công việc phù hợp' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Lương tối thiểu VND').fill('30000000');
  await page.getByLabel('Lương tối đa VND').fill('10000000');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.',
  );
  await visit(page, '/duong-dan-khong-ton-tai');
  await expect(page.getByRole('heading', { name: 'Trang bạn tìm không tồn tại' })).toBeVisible();
});
