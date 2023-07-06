var { uploadToS6 } = require('../index');

(async function go() {
  try {
    await uploadToS6({});
    console.log('Uploaded.');
  } catch (error) {
    console.error('Error while uploading:', error);
  }
})();
