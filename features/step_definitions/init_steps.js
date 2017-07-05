module.exports = function() {
  const createOutputStream = require('create-output-stream');
  const path = require('path');

  // if /tmp/some does not exist, it is created

  this.Given(/^I create a "([^"]*)" file with "([^"]*)"$/, function(file, content, callback) {
    const world = this;
    const file_abs_path = path.join(world.tmpDir, 'proj', file);
    const ws = createOutputStream(file_abs_path);

    ws.write(content);
    callback();
  });
};
