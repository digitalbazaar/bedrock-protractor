/*!
 * Bedrock Protractor Unit Tests module.
 *
 * Copyright (c) 2015-2018 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
import angular from 'angular';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as bedrock from 'bedrock-angular';

let started = false;
let bootstrapped = false;

// unit test runner, to be set when `run` is called
let runTests = null;

// register test route
const module = angular.module('bedrock-protractor-unit', ['bedrock']);
/* @ngInject */
module.config(function($routeProvider) {
  $routeProvider
    .when('/bedrock-protractor-unit', {
      title: 'bedrock-protractor unit tests',
      template: ''
    });
});

// only override start when on the `bedrock-protractor-unit` route
if(window.location.pathname === '/bedrock-protractor-unit') {
  // take control over startup process
  bedrock.setStart(() => {
    started = true;
    if(runTests) {
      // run tests; tests must call `bootstrap`
      runTests();
    }
  });
}

// add attribute to html element for protractor to track; it waits for
// this element to be present before calling `run`
angular.element(document).ready(function() {
  angular.element(document.querySelector('html'))
    .attr('bedrock-protractor-unit', 'true');
});

// export `run` API to run a custom unit test script
//export default function run(root, fn, callback) {
// FIXME: different versions of this module load when importing via
// SystemJS.import vs. import (or for some other reason) -- so this method
// must, for now, be globally exported to function properly
window._bedrock_protractor_unit = function(root, fn, callback) {
  runTests = function() {
    const result = {};
    if(typeof mocha === 'undefined') {
      result.root = {
        title: '',
        error: '`mocha` is not defined in the browser; it must be installed ' +
          'to run unit tests in the browser.'
      };
      return callback(result);
    }

    const reporter = createReporter(result);
    mocha.setup.call(mocha, {ui: 'bdd', reporter: reporter});

    // setup globals
    window.chai = chai;
    chai.use(chaiAsPromised);

    window.expect = chai.expect;
    window.should = chai.should();

    // call custom script, pass function to bootstrap app and return $injector
    eval(fn)(function() {
      bootstrap();
      return angular.element(document.querySelector(root)).data('$injector');
    });

    mocha.run(() => callback(result));
  };

  // if already started, run tests
  if(started) {
    runTests();
  }
};

// bootstrap the angular app, if not already bootstrapped
function bootstrap() {
  if(!bootstrapped) {
    bootstrapped = true;
    bedrock.bootstrap(angular.module('bedrock-protractor-unit.bootstrap', [
      bedrock.rootModule.name, 'bedrock-protractor-unit']));
  }
}

// create the mocha reporter that will track unit test results
function createReporter(result) {
  return function(runner) {
    let parent;
    const stack = [];
    runner.on('suite', function(suite) {
      const child = {type: 'suite', title: suite.title, children: []};
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
      // if there are no `beforeAll` or `beforeEach` hooks, then ensure the
      // angular app is automatically bootstrapped prior to tests running;
      // if there are hooks, ensure the angular app is auto bootstrapped
      // after they are called but prior to test execution
      let hooks = (test.parent['_beforeAll'] || []).concat(
        test.parent['_beforeEach'] || []).length;
      //if(hooks === 0 && !bootstrapped) {
      if(hooks === 0) {
        bootstrap();
      } else {
        runner.on('hook end', function() {
          --hooks;
          if(hooks === 0) {
            bootstrap();
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
