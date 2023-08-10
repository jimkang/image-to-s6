/* global process */

var { uploadToS6 } = require('../index');
var fs = require('fs');

(async function go() {
  if (process.argv.length < 3) {
    console.error(
      'Usage: node tools/run-upload.js <JSON file with basenames and variants lists>'
    );
    process.exit();
  }
  try {
    var { basenames, variants } = JSON.parse(
      fs.readFileSync(process.argv[2], { encoding: 'utf8' })
    );
    await uploadToS6({ basenames, variants });

    console.log('Uploaded.');
  } catch (error) {
    console.error('Error while uploading:', error);
  }
})();
