/* global process */
require('dotenv').config();
var playwright = require('playwright');

// const nsInMS = 1e9 / 1000;

const defaultBrowserType = 'firefox';

async function uploadToS6({ browserType = defaultBrowserType }) {
  var browser = await playwright[browserType].launch({ headless: false });
  var page = await browser.newPage();
  await getToArtistStudio({ page });

  await stall(5);
  browser.close();
}

async function getToArtistStudio({ page }) {
  await page.goto('https://society6.com/artist-studio');
  var loginButton = await page.getByRole('button', {
    name: 'Log in / Sign up',
  });
  await loginButton.waitFor();
  console.log('loginButton count', await loginButton.count());
  await loginButton.click();

  await getRidOfSignInWithGoogle({ page });

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
  await passwordBox.click();

  await getRidOfSignInWithGoogle({ page });
  passwordBox.fill(process.env.password);

  await getRidOfSignInWithGoogle({ page });

  var loginSubmit = await page.locator('form[name="login"] > button');
  await loginSubmit.click();
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
}

async function getRidOfSignInWithGoogle({ page }) {
  try {
    var obscuringContainer = await page.locator('#credential_picker_container');
    await obscuringContainer.waitFor({ timeout: 5000 });

    if ((await obscuringContainer.count()) > 0) {
      await obscuringContainer.evaluate((node) =>
        // node.parentNode.removeChild(node)
        node.setAttribute('style', 'z-index: -1')
      );
    } else {
      console.log('No Sign In With Google popover found.');
    }
  } catch (error) {
    console.error(
      'Error while waiting for sign in with Google. Maybe they got rid of it? Hooray.',
      error
    );
  }
}

async function stall(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

module.exports = { uploadToS6 };
