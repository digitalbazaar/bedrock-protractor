/*
 * Bedrock Protractor Module Configuration
 *
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */
var config = require('bedrock').config;
var path = require('path');
require('bedrock-server');

// add protractor as available test framework
config.test.frameworks.push('protractor');

config.protractor = {};
config.protractor.options = {};
config.protractor.config = {
  // The location of the selenium standalone server .jar file, relative
  // to the location of this config. If no other method of starting selenium
  // is found, this will default to
  // node_modules/protractor/selenium/selenium-server...
  seleniumServerJar: null,

  // The port to start the selenium server on, or null if the server should
  // find its own unused port.
  seleniumPort: null,

  // Chromedriver location is used to help the selenium standalone server
  // find chromedriver. This will be passed to the selenium jar as
  // the system property webdriver.chrome.driver. If null, selenium will
  // attempt to find chromedriver using PATH.
  // Not needed with directConnect enabled.
  //chromeDriver: path.join(
  //  __dirname, '../node_modules/protractor/selenium/chromedriver'),

  // If true, only chromedriver will be started, not a standalone selenium.
  // Tests for browsers other than chrome will not run.
  chromeOnly: false,

  // Additional command line options to pass to selenium. For example,
  // if you need to change the browser timeout, use
  // seleniumArgs: ['-browserTimeout=60'],
  seleniumArgs: [],

  // The timeout for each script run on the browser. This should be longer
  // than the maximum time your application needs to stabilize between tasks.
  allScriptsTimeout: 11000,

  // Boolean. If true, Protractor will connect directly to the browser Drivers
  // at the locations specified by chromeDriver and firefoxPath. Only Chrome
  // and Firefox are supported for direct connect.
  directConnect: true,

  // ----- What tests to run -----
  //
  // Spec patterns are relative to the location of this config.
  /*specs: [
  ],*/

  // Patterns to exclude.
  exclude: [],

  // Alternatively, suites may be used. When run without a commad line parameter,
  // all suites will run. If run with --suite=smoke, only the patterns matched
  // by that suite will run.
  suites: {},

  // ----- Capabilities to be passed to the webdriver instance ----
  //
  // For a full list of available capabilities, see
  // https://code.google.com/p/selenium/wiki/DesiredCapabilities
  // and
  // https://code.google.com/p/selenium/source/browse/javascript/webdriver/capabilities.js
  capabilities: {
    browserName: 'chrome',

    //'chromeOptions': {
    //  'args': ['no-startup-window']
    //},

    // Local PhantomJS binary path.
    'phantomjs.binary.path': path.join(
      __dirname, '../node_modules/.bin/phantomjs'),

    // Command line arugments to pass to phantomjs.
    // Can be ommitted if no arguments need to be passed.
    // Acceptable cli arguments: https://github.com/ariya/phantomjs/wiki/API-Reference#wiki-command-line-options
    'phantomjs.cli.args': [
      '--debug=true',
      '--ignore-ssl-errors=true',
      // log options not currently passed on; default is "phantomjsdriver.log"
      '--webdriver-logfile=/tmp/bedrock-protractor.phantomjs.log',
      '--webdriver-loglevel=DEBUG'
    ]
  },

  // If you would like to run more than one instance of webdriver on the same
  // tests, use multiCapabilities, which takes an array of capabilities.
  // If this is specified, capabilities will be ignored.
  multiCapabilities: [],

  // ----- More information for your tests ----
  //
  // Selector for the element housing the angular app - this defaults to
  // body, but is necessary if ng-app is on a descendant of <body>
  rootElement: 'html',

  // A callback function called once protractor is ready and available, and
  // before the specs are executed; it must specify a full-path filename with
  // the code to execute.
  onPrepare: path.join(__dirname, 'prepare.js'),

  // The params object will be passed directly to the protractor instance,
  // and can be accessed from your test. It is an arbitrary object and can
  // contain anything you may need in your test.
  // This can be changed via the command line as:
  //   --params.login.user 'Joe'
  params: {
    config: {
      // a list of scripts (full-path filenames) to load during onPrepare
      onPrepare: [],
      maxTimeout: 11000
    }
  },

  // ----- The test framework -----
  //
  framework: 'mocha',

  // ----- Options to be passed to mocha -----
  //
  // See the full list at http://visionmedia.github.io/mocha/
  mochaOpts: {
    bail: true,
    ignoreLeaks: false,
    reporter: 'spec',
    timeout: 60000,
    ui: 'bdd',
    useColors: true
  }
};
