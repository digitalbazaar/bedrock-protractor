/*!
 * Bedrock Protractor Unit Tests module.
 *
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular', 'chai', 'chai-as-promised', 'bedrock-angular'], function(
  angular, chai, chaiAsPromised, brAngular) {

'use strict';

var started = false;

if(getQueryParam('bedrock-protractor-unit') === 'true') {
  brAngular.config.autostart = false;
} else {
  started = true;
}

// add attribute to html element for protractor to track
angular.element(document).ready(function() {
  angular.element('html').attr('bedrock-protractor-unit', 'true');
});

// export `run` API
var api = {};
api.run = run;
return api;

// get a URL query param by name
function getQueryParam(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

// run a custom unit test script
function run(root, fn, callback) {
  var result = {};
  if(typeof mocha === 'undefined') {
    result.root = {
      title: '',
      error: '`mocha` is not defined in the browser; it must be installed ' +
        'to run unit tests in the browser.'
    };
    return callback(result);
  }

  var reporter = createReporter(result);
  mocha.setup.call(mocha, {ui: 'bdd', reporter: reporter});

  // setup globals
  window.chai = chai;
  chai.use(chaiAsPromised);

  window.expect = chai.expect;
  window.should = chai.should();

  // call custom script, pass function to bootstrap app and return $injector
  eval(fn)(function() {
    bootstrap();
    return angular.element(root).data('$injector');
  });

  mocha.run(function() {
    callback(result);
  });
}

// bootstrap the angular app
function bootstrap() {
  if(!started) {
    brAngular.start();
    started = true;
  }
}

// create the mocha reporter that will track unit test results
function createReporter(result) {
  return function(runner) {
    var parent;
    var stack = [];
    runner.on('suite', function(suite) {
      var child = {type: 'suite', title: suite.title, children: []};
      if(parent) {
        stack.push(suite);
        parent.children.push(child);
      } else {
        result.root = child;
        child.root = true;
      }
      parent = child;
    });
    runner.once('test', function(test) {
      // ensure app is started after beforeEach/beforeAll hooks run
      // but prior to test execution
      var hooks = (test.parent['_beforeAll'] || []).concat(
        test.parent['_beforeEach'] || []).length;
      if(hooks === 0 && !started) {
        brAngular.start();
        started = true;
      } else {
        runner.on('hook end', function() {
          --hooks;
          if(hooks === 0 && !started) {
            brAngular.start();
            started = true;
          }
        });
      }
    });
    runner.on('suite end', function() {
      parent = stack.pop();
    });
    runner.on('pass', function(test) {
      parent.children.push({type: 'test', title: test.title, pass: true});
    });
    runner.on('fail', function(test, err) {
      parent.children.push(
        {type: 'test', title: test.title, pass: false, error: err.message});
    });
  };
}

});
