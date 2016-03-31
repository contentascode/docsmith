var fs = require('fs-extra');
var path = require('path');
var npmi = require('npmi');

var templates_path  = path.join(path.dirname(fs.realpathSync(__filename)),'../templates')

function init(template) {
  if ((template != "jekyll") && (template != "metalsmith")) {
    console.log('Error: Template not recognised.')
    process.exit(1, "")
  }
  try {
    fs.copy(path.join( templates_path, 'init-' + template), '.', { filter: function(f) { return (path.basename(f) != ".git") } }, function (err) {
      if (err) return console.error(err)
      npmi({ path: '.' }, function(err, result) {
        if (err) {
          console.log('Installation failed.');
        } else {
          console.log('')
          console.log('Content as Code project directory initialised with ' + template + ' template.')
          console.log('')
          console.log('You can find out about your current configuration with:')
          console.log('')
          console.log('content status')
          console.log('')
        }
      });        
    }) // copies file 

  } catch (e) {
    console.log(e);
  }  
}

module.exports.path = templates_path
module.exports.init = init
