/*
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */

module.exports = function(bedrock) {
  bedrock.config.protractor.config.multiCapabilities.push({
    browserName: 'firefox',
    version: '47.0',
    platform: 'OS X 10.11',
    build: '1.1.13',
    tags: ['1.1.13'],
    name: 'bedrock-issuer',
    shardTestFiles: false,
    maxInstances: 1
  });
};
