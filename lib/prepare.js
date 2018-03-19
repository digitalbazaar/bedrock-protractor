/*
 * Copyright (c) 2012-2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const helper = require('./helper');

module.exports = function() {
  // load any other scripts
  helper.config.onPrepare.forEach(function(file) {
    require(file);
  });

  // initialize
  return helper.init();
};
