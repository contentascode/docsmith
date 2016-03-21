module.exports = function () {

var fs = require('fs-extra')
var path = require('path')

// if /tmp/some does not exist, it is created

  this.Given(/^I create a "([^"]*)" file with "([^"]*)"$/, function (file, content, callback) {
    var world = this;
    var file_abs_path = path.join(world.tmpDir, "proj", file);
    var ws = fs.createOutputStream(file_abs_path)
    
    ws.write(content)
    callback();
  });

}