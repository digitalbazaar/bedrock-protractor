/*
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */
var bedrock = require('bedrock');
var config = bedrock.config;
var path = require('path');

require('bedrock-express');
require('bedrock-views');
require('../lib/test');

bedrock.start();
