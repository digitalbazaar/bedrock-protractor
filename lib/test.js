/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */
var bedrock = require('bedrock');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var temp = require('temp');

// load config defaults
require('./config');

bedrock.events.on('bedrock-cli.test.configure', function(command) {
  command
    .option(
      '--protractor-test <files>',
      'A set of comma-delimited protractor test files to run.')
    .option(
      '--protractor-suite <files>',
      'A protractor test suite to run.');
});

bedrock.events.on('bedrock.tests.run', function(state, callback) {
  if(bedrock.test.shouldRunFramework('protractor')) {
    return run(state, callback);
  }
  callback();
});

function run(state, callback) {
  var command = bedrock.config.cli.command;
  if(!command.protractorSuite &&
    !command.protractorTest &&
    !bedrock.config.protractor.config.specs &&
    Object.keys(bedrock.config.protractor.config.suites).length === 0) {
    // no tests to run
    console.log('No protractor tests to run.');
    // print eol
    console.log();
    return callback();
  }

  // generate the protractor config
  var configFile = generateProtractorConfig();

  // run protractor
  var browser = bedrock.config.protractor.config.capabilities.browserName;
  console.log('Running tests via Protractor...');
  console.log('Server: ' + bedrock.config.server.baseUri);
  console.log('Browser: ' + browser);
  console.log('Bootstrap config: ' + configFile);
  var cmd = path.resolve(
    __dirname, '..', 'node_modules', '.bin', 'protractor');
  var args = ['--baseUrl', bedrock.config.server.baseUri];
  if(command.protractorSuite) {
    console.log('Suite: ' + command.protractorSuite);
    args.push('--suite');
    args.push(command.protractorSuite);
  }
  if(command.protractorTest) {
    console.log('Tests: ' + command.protractorTest);
    args.push('--specs');
    args.push(command.protractorTest);
  }
  args.push(configFile);
  // print eol
  console.log();
  var protractor = spawn(cmd, args);
  protractor.stderr.pipe(process.stderr);
  protractor.stdout.pipe(process.stdout);
  protractor.on('error', function(err) {
    console.log('Error', err);
  });
  protractor.on('close', function(code) {
    if(code) {
      state.pass = false;
      console.log('Protractor tests failed.');
      return callback();
    }
    console.log('All protractor tests passed.');
    callback();
  });
}

function generateProtractorConfig() {
  // write config file for protractor to load via a new process
  var config = bedrock.config.protractor.config;

  // clean up temp files at exit
  temp.track();

  var info = temp.openSync('bedrock-protractor.');
  var data = new Buffer(
    'exports.config = ' + JSON.stringify(config, null, 2) + ';\n', 'utf8');
  fs.writeSync(info.fd, data, 0, data.length, 0);
  fs.closeSync(info.fd);

  return info.path;
}
