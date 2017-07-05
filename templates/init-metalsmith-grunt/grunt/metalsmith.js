var config = require('../metalsmith.json')
module.exports = {
  "content": {
    "options": config,
    "src": "code",
    "dest": "_site"
  }
}
