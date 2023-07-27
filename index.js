/* global process */
require('dotenv').config();
var playwright = require('playwright');

// const nsInMS = 1e9 / 1000;

const defaultBrowserType = 'firefox';

async function uploadToS6({ browserType = defaultBrowserType }) {
  var browser = await playwright[browserType].launch({ headless: false });
  var page = await browser.newPage();
  await getToArtistStudio({ page });
  await getToDesignUploader({ page });
  await uploadImage({
    page,
    title: 'Hill ' + ~~(Math.random() * 100),
    filepath: process.env.testFilepath,
  });
  await publishDesign({ page });

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
  await passwordBox.fill(process.env.password);

  await getRidOfSignInWithGoogle({ page });

  var loginSubmit = await page.locator('form[name="login"] > button');
  await loginSubmit.click();
  await page.screenshot({ path: 'post-login.png', fullPage: true });
}

async function getToDesignUploader({ page }) {
  await getRidOfSignInWithGoogle({ page });

  var addDesignButton = await page
    .getByRole('button')
    .filter({ hasText: 'Add New Design' });
  await addDesignButton.waitFor();
  await addDesignButton.click();
  await page.screenshot({ path: 'post-login.png', fullPage: true });
}

async function uploadImage({ page, title, filepath }) {
  var titleInput = await page.getByPlaceholder('Design Title');
  await titleInput.waitFor();
  await titleInput.fill(title);

  var fileSelectButton = await page.locator('[qa-id="selectFile"]');
  await fileSelectButton.waitFor();
  var fileChooserPromise = page.waitForEvent('filechooser');
  await fileSelectButton.click();

  var fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filepath);

  await clickWhenReady({
    page,
    selector: 'button[qa-id="continue"]',
    tries: 5,
    isOk: elementIsNotFauxDisabled,
  });
  await clickWhenReady({
    page,
    selector: 'input[type=checkbox][name=copyrightApproved]',
  });
  await clickWhenReady({
    page,
    selector: 'input[type=radio][qa-id=matureContentFalse]',
  });
  // var notMatureRadioButton = await page.getByLabel('No');
  // await notMatureRadioButton.waitFor();
  // await notMatureRadioButton.click();

  await clickWhenReady({
    page,
    role: 'button',
    filter: { name: /^Continue/ },
    tries: 5,
    isOk: elementIsNotFauxDisabled,
  });
}

async function publishDesign({ page }) {
  await clickWhenReady({
    page,
    role: 'checkbox',
    filter: { hasText: 'Select All' },
  });
  await clickWhenReady({ page, role: 'button', filter: { hasText: 'Enable' } });
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

async function clickWhenReady({
  page,
  role,
  filter,
  selector,
  isOk,
  tries = 1,
  secondsBetweenTries = 1,
}) {
  var locator;
  var tryCount = 0;
  do {
    if (tryCount > 0) {
      await stall(secondsBetweenTries);
    }
    if (selector) {
      locator = await page.locator(selector);
    } else {
      locator = await page.getByRole(role, filter);
    }
    await locator.waitFor();
    tryCount++;
  } while (
    tryCount < tries &&
    typeof isOk === 'function' &&
    (await isOk(locator))
  );

  await locator.click();
  return locator;
}

async function elementIsNotFauxDisabled(locator) {
  const classString = await locator.getAttribute('class');
  return classString.includes('Disabled');
}

module.exports = { uploadToS6 };
