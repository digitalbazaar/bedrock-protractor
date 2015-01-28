// run helper onPrepare
var helper = require('./helper');

// load any other scripts
helper.config.onPrepare.forEach(function(file) {
  require(file);
});

// initialize
helper.init();
