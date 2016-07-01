/*!
 * Bedrock Protractor Unit Tests module.
 *
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular', 'chai', 'chai-as-promised', 'bedrock-angular', 'requirejs/events'],
  function(angular, chai, chaiAsPromised, brAngular, events) {

'use strict';

var started = false;

// disable bedrock-angular auto-start (all code in this `define` block
// this will always execute before `bedrock-requirejs.ready` event is
// emitted -- which is the event that will auto-start brAngular unless
// we configure it otherwise here)
if(window.location.pathname === '/bedrock-protractor-unit') {
  brAngular.config.autostart = false;
} else {
  started = true;
}

// unit test runner, to be set when `api.run` is called
var runTests = null;

// track when unit tests are ready to run
var ready = false;
events.on('bedrock-requirejs.ready', function() {
  ready = true;
  if(runTests) {
    // `runTests` already set, run it
    runTests();
  }
});

// add attribute to html element for protractor to track
angular.element(document).ready(function() {
  angular.element('html').attr('bedrock-protractor-unit', 'true');
});

// register test route
var module = angular.module('bedrock-protractor-unit', []);
/* @ngInject */
module.config(function($routeProvider) {
  $routeProvider
    .when('/bedrock-protractor-unit', {
      title: 'bedrock-protractor unit tests',
      template: ''
    });
});

// export `run` API
var api = {};
api.run = run;
return api;

// run a custom unit test script
function run(root, fn, callback) {
  runTests = function() {
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
  };
  // if already ready, run tests
  if(ready) {
    runTests();
  }
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
