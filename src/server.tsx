import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { chromium } from '@playwright/test';
import crypto from 'node:crypto';
import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();

app.use('/static/*', serveStatic());

app.get('/', (c) =>
  c.html(
    <main>
      <form action="/convert" method="POST">
        <input type="url" name="url" required />
        <button type="submit">Submit</button>
      </form>
    </main>,
  ),
);

app.post('/convert', async (c) => {
  const url = (await c.req.formData()).get('url');
  if (typeof url !== 'string') {
    return c.text('Invalid url', 400);
  }

  const screenshotId = crypto.randomUUID();

  const browser = await chromium.launch();
  await Promise.all([
    browser.newPage({ colorScheme: 'light' }).then(async (page) => {
      await page.goto(url);
      await page.waitForURL(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: `static/${screenshotId}/light/desktop.png` });

      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({ path: `static/${screenshotId}/light/mobile.png` });
    }),
    browser.newPage({ colorScheme: 'dark' }).then(async (page) => {
      await page.goto(url);
      await page.waitForURL(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: `static/${screenshotId}/dark/desktop.png` });

      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({ path: `static/${screenshotId}/dark/mobile.png` });
    }),
  ]);

  return c.redirect(`/result/${screenshotId}`);
});

app.get('/result/:id', async (c) => {
  const id = c.req.param('id');

  return c.html(
    <main>
      <h1>Result</h1>
      <h2>Light Mode</h2>
      <div style="display: flex; gap: 12px;">
        <img src={`/static/${id}/light/desktop.png`} style="max-width: 800px; height: 450px;" />
        <img src={`/static/${id}/light/mobile.png`} style="max-width: 400px;" />
      </div>
      <h2>Dark Mode</h2>
      <div style="display: flex; gap: 12px;">
        <img src={`/static/${id}/dark/desktop.png`} style="max-width: 800px; height: 450px;" />
        <img src={`/static/${id}/dark/mobile.png`} style="max-width: 400px;" />
      </div>
    </main>,
  );
});

serve(app);
