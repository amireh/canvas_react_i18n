var fs = require('fs');

var loadFixture = function(fileName) {
  return String(fs.readFileSync(__dirname + '/fixtures/' + fileName ));
};

module.exports = {
  loadFixture: loadFixture
};