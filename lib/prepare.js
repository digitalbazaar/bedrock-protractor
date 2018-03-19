/*
 * Copyright (c) 2012-2016 Digital Bazaar, Inc. All rights reserved.
 */
const helper = require('./helper');

module.exports = function() {
  // load any other scripts
  helper.config.onPrepare.forEach(function(file) {
    require(file);
  });

  // initialize
  return helper.init();
};
