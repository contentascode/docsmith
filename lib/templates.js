var fs = require('fs-extra');
var path = require('path');

var templates_path  = path.join(path.dirname(fs.realpathSync(__filename)),'../templates')

function init() {
  if (true) {
    try {
      fs.copy(path.join( templates_path, 'init/'), '.', function (err) {
        if (err) return console.error(err)
      }) // copies file 

    } catch (e) {
      console.log(e);
    }  
  }
}

module.exports.path = templates_path
module.exports.init = init
