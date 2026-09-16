const { test, expect } = require('@playwright/test');

async function fillBrief(page) {
  await page.locator('#name').fill('Иван');
  await page.locator('#phone').fill('+7 (777) 123-45-67');
  await page.locator('#brief').fill('Нужен каталог оборудования.');
}

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('.project-card')).toHaveCount(2);
    await expect(page.locator('.service-card')).toHaveCount(8);
    const overflowing = await page.locator('main *').evaluateAll((elements) => elements.filter((el) => {
      if (el.classList.contains('hero-ambient')) return false;
      const box = el.getBoundingClientRect();
      return box.width && (box.right > innerWidth + 1 || box.left < -1);
    }).map((el) => el.className));
    expect(overflowing).toEqual([]);
    expect(errors).toEqual([]);
    if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/site-${width}.png`, fullPage: true });
  });
}

test('mobile navigation closes on Escape, selection and desktop resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('.menu-toggle');
  await toggle.click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('#mobile-menu a[href="#projects"]').click();
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#mobile-menu')).toBeHidden();
});

test('form validates and downloads without claiming submission', async ({ page }) => {
  await page.goto('/');
  const submit = page.locator('button[type="submit"]');
  await submit.click();
  await expect(page.locator('#name')).toBeFocused();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(3);
  await fillBrief(page);
  await page.locator('#phone').fill('abcdefghij');
  await submit.click();
  await expect(page.locator('#phone')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#phone').fill('+7 777 1234567');
  const downloadPromise = page.waitForEvent('download');
  await submit.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('gk-development-project.txt');
  const { readFile } = require('node:fs/promises');
  expect(await readFile(await download.path(), 'utf8')).toContain('Нужен каталог оборудования.');
  await expect(page.locator('.form-status')).toContainText('Заявка не отправлена');
  await expect(page.locator('[data-whatsapp]')).toBeHidden();
});

for (const status of [200, 500]) {
  test(`API response ${status}`, async ({ page }) => {
    await page.route('**/config/contact.js', (route) => route.fulfill({
      contentType: 'application/javascript', body: "window.CONTACT_CONFIG={formEndpoint:'/api/contact'};",
    }));
    let payload;
    await page.route('**/api/contact', async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status, body: '{}' });
    });
    await page.goto('/');
    await fillBrief(page);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.form-status')).toContainText(status === 200 ? 'Заявка отправлена' : 'Не удалось подтвердить');
    expect(payload.name).toBe('Иван');
    await expect(page.locator('#brief')).toHaveValue(status === 200 ? '' : 'Нужен каталог оборудования.');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
}

test('WhatsApp handoff includes the brief', async ({ page, context }) => {
  await context.route('https://wa.me/**', (route) => route.fulfill({ body: 'WhatsApp' }));
  await page.route('**/config/contact.js', (route) => route.fulfill({
    contentType: 'application/javascript', body: "window.CONTACT_CONFIG={whatsappNumber:'77771234567'};",
  }));
  await page.goto('/');
  await fillBrief(page);
  await expect(page.locator('[data-whatsapp]')).toHaveAttribute('href', 'https://wa.me/77771234567');
  const popupPromise = page.waitForEvent('popup');
  await page.locator('button[type="submit"]').click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(new URL(popup.url()).searchParams.get('text')).toContain('Нужен каталог оборудования.');
});

test('content remains available without JavaScript', async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto('http://127.0.0.1:8080');
  await expect(page.locator('.project-card').first()).toBeVisible();
  await expect(page.locator('.team-card')).toHaveCount(2);
  await expect(page.locator('.noscript-note')).toBeVisible();
  await page.close();
});
