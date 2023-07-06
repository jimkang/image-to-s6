/* global process */

var playwright = require('playwright');

const nsInMS = 1e9 / 1000;

const defaultBrowserType = 'firefox';

async function uploadToS6({ browserType = defaultBrowserType }) {
  var browser = await playwright[browserType].launch({ headless: false });
  var page = await browser.newPage();
  await page.goto('https://society6.com/');
  var loginButton = await page.locator(
    '[role="button"][aria-label="join or login"]'
  );
  await loginButton.waitFor();
  console.log('loginButton count', await loginButton.count());
  await loginButton.click();

  // Wait for the Google junk to appear.
  // Why doesn't the `waitFor` below suffice? I don't know.
  await stall(5);

  var obscuringContainer = await page.locator('#credential_picker_container');
  try {
    await obscuringContainer.waitFor();
    await obscuringContainer.evaluate((node) =>
      node.parentNode.removeChild(node)
    );
  } catch (error) {
    console.error(
      'Error while waiting for sign in with Google. Maybe they got rid of it? Hooray.',
      error
    );
  }

  var overlay = await page.locator('#overlay');
  await overlay.waitFor();
  await overlay.evaluate((node) => node.parentNode.removeChild(node));

  await page.locator('form[name="login"]').waitFor();
  var emailBox = await page.getByPlaceholder('Email');
  await emailBox.waitFor();

  await emailBox.click();
  await emailBox.fill(process.env.email);
  var passwordBox = await page.getByPlaceholder('Password');
  await passwordBox.waitFor();
  // Click here in case the "sign in with Google" dialog has taken focus.
  await passwordBox.click();
  passwordBox.fill(process.env.password);
  var loginSubmit = await page.locator('form[name="login"] > button');
  await loginSubmit.click();
  await page.screenshot({ path: 'screenshot.png', fullPage: true });

  await stall(5);
  browser.close();
}

async function stall(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

module.exports = { uploadToS6 };
