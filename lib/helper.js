/*
 * Copyright (c) 2012-2016 Digital Bazaar, Inc. All rights reserved.
 */
var EventEmitter = require('events').EventEmitter;
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var fs = require('fs');
var protractor = global.protractor;
var util = require('util');
var _ = require('lodash');

global.should = chai.should();
chai.use(chaiAsPromised);

global.expect = chai.expect;

Object.defineProperty(
  protractor.promise.Promise.prototype,
  'should',
  Object.getOwnPropertyDescriptor(Object.prototype, 'should')
);

var browser = global.browser;
var by = global.by;

function Helper() {
  EventEmitter.call(this);

  this.config = browser.params.config;
  this.browser = browser;
  this.baseUrl = browser.baseUrl;
  this.MAX_TIMEOUT = browser.params.config.maxTimeout;
}
util.inherits(Helper, EventEmitter);

var api = global.bedrock = new Helper();
module.exports = api;

// expose mocha to helper, overwrite `mocha.run` to allow unit tests
// to be executed client side and results reported back
var realPathMocha = fs.realpathSync(require.resolve('mocha'));
var Mocha = require(realPathMocha);
var originalMochaRun = Mocha.prototype.run;
Mocha.prototype.run = function() {
  api.mocha = this;
  api.suite = null;

  // update runner to integrate browser-mocha results
  var runner = api.runner = originalMochaRun.apply(this, arguments);

  // track current suite
  runner.on('suite', function(suite) {
    api.suite = suite;
  });

  // handle running a suite that is integrated with in-browser tests
  var runSuite = runner.runSuite;
  runner.runSuite = function(suite) {
    if(!suite.testInBrowser) {
      return runSuite.apply(runner, arguments);
    }

    // run tests in browser, then run suite
    var args = Array.prototype.slice.call(arguments);
    suite.testInBrowser().then(function(result) {
      processResult(suite, result);
      return runSuite.apply(runner, args);
    });
  };

  function processResult(suite, node) {
    if(!node) {
      return;
    }
    if(node.type === 'suite') {
      var newSuite = new Mocha.Suite(node.title);
      suite.addSuite(newSuite);
      return node.children.forEach(function(child) {
        processResult(newSuite, child);
      });
    }
    if(node.pass) {
      return suite.addTest(new Mocha.Test(node.title, function() {}));
    }
    return suite.addTest(new Mocha.Test(node.title, function() {
      throw new Error(node.error);
    }));
  }

  return api.runner;
};

// called by onPrepare in config script
Helper.prototype.init = function() {
  var self = this;
  if(self.config.hideBrowser) {
    // move window out of way (currently no way to minimize)
    browser.driver.manage().window().setPosition(-2000, 0);
  }
  self.emit('init');
  var deferred = protractor.promise.defer();
  deferred.fulfill();
  return deferred.promise;
};

// gets a URL that returns an AngularJS page and waits for it to bootstrap
Helper.prototype.get = function(url, options) {
  var self = this;
  var fullUrl = url;
  if(url.indexOf('http') !== 0) {
    fullUrl = self.baseUrl + url;
  }
  options = options || {};
  if(!('waitForAngular' in options)) {
    options.waitForAngular = true;
  }
  browser.driver.get(fullUrl);
  if(options.waitForAngular) {
    return self.waitForAngular();
  }
  if(options.waitForUnit) {
    return self.waitForUnit();
  }
  return self.waitForUrl(url);
};

// runs a script in the browser's context
// pass fn($injector) for a sync script, fn($injector, callback) for async
Helper.prototype.run = function(fn) {
  fn = fn.toString();
  var isAsync = (fn.split('\n')[0].indexOf(',') !== -1);
  var execute = isAsync ? browser.executeAsyncScript : browser.executeScript;
  return execute(
    "var $injector = angular.element('" + browser.rootEl + "')" +
      ".data('$injector');" +
    "var callback = arguments[arguments.length - 1];" +
    'return (' + fn + ')($injector, callback);');
};

/**
 * selectWindow Focus the browser to the index window.
 *
 * @param  index the index of the window. E.g., 0=browser, 1=FBpopup
 * @return webdriver.promise.Promise
 */
Helper.prototype.selectWindow = function(index) {
  // wait for handles[index] to exist
  browser.wait(function() {
    return browser.getAllWindowHandles().then(function(handles) {
      /**
       * Assume that handles.length >= 1 and index >=0.
       * So when calling selectWindow(index) return
       * true if handles contains that window.
       */
      if(handles.length > index) {
        return true;
      }
    });
  }, 30000);
  // the requested window exists

  // switch to the window
  return browser.getAllWindowHandles().then(function(handles) {
    return browser.switchTo().window(handles[index]);
  });
};

// FIXME: deprecate, use `.unit` instead
// runs tests in the browser
Helper.prototype.testInBrowser = function(title, fn) {
  this.unit(title, function(bootstrap) {
    fn(bootstrap());
  });
};

// runs unit tests in the browser
Helper.prototype.unit = function(title, fn) {
  var self = this;
  var suite = Mocha.Suite.create(self.mocha.suite, title);

  // add a special call to run the suite's tests in the browser and
  // compile a report that can be processed to add tests and results
  // to the local mocha instance
  var added = false;
  suite.testInBrowser = function() {
    if(added) {
      suite.tests = [];
    }
    return self.get('/bedrock-protractor-unit', {
      waitForAngular: false,
      waitForUnit: true
    }).then(function() {
      fn = fn.toString();
      return browser.executeAsyncScript(
        "var callback = arguments[arguments.length - 1];" +
        "var unit = require('bedrock-protractor-unit');" +
        "unit.run('" + browser.rootEl + "', " + fn + ", callback);");
    }).then(function(result) {
      return result.root;
    });
  };

  /* Note: In order for mocha to execute a test suite, it must report that it
  has at least one test. For suites that are integrated with the browser,
  their tests won't be added until the suite is executing, so the suite will
  be skipped. To avoid this, we add a dummy test to the suite (w/o emitting
  any events) and remove it once it executes. */
  if(suite.tests.length === 0) {
    added = true;
    var test = new Mocha.Test('dummy', function() {});
    test.parent = suite;
    test.ctx = suite.ctx;
    suite.tests.push(test);
  }
};

// waits for AngularJS to be bootstrapped
Helper.prototype.waitForAngular = function() {
  var self = this;
  return browser.driver.wait(function() {
    return browser.driver.isElementPresent(
      by.css(browser.rootEl + '[ng-app]'));
  }, self.MAX_TIMEOUT, 'should wait for angular');
};

// waits for bedrock-protractor-unit to be loaded
Helper.prototype.waitForUnit = function() {
  var self = this;
  return browser.driver.wait(function() {
    return browser.driver.isElementPresent(
      by.css('html[bedrock-protractor-unit]'));
  }, self.MAX_TIMEOUT, 'should wait for unit test loader');
};

// waits for an element to be displayed
Helper.prototype.waitForElementToShow = function(el) {
  var self = this;
  return browser.wait(function() {
    return el.isDisplayed();
  }, self.MAX_TIMEOUT, 'should wait for element to show');
};

// waits for an attribute to meet a certain criteria
Helper.prototype.waitForAttribute = function(el, attr, fn) {
  var self = this;
  return browser.wait(function() {
    return el.getAttribute(attr).then(function(value) {
      return fn(value);
    });
  }, self.MAX_TIMEOUT, 'should wait for attribute: ' + attr);
};

// waits for a particular URL to load (via a URL value or a function that takes
// the current URL to compare against and returns true for success)
Helper.prototype.waitForUrl = function(url) {
  var self = this;
  var filter;
  if(typeof url === 'function') {
    filter = url;
  } else {
    if(url.indexOf('http') !== 0) {
      url = this.baseUrl + url;
    }
    filter = function(currentUrl) {
      return currentUrl === url;
    };
  }
  return browser.driver.wait(function() {
    return browser.driver.getCurrentUrl().then(filter);
  }, self.MAX_TIMEOUT, 'should wait for url: ' + url);
};

// waits for a client-side script to return true
// eg: can check angular.element('.foo').scope().model.bar against some value
Helper.prototype.waitForScript = function(fn) {
  var self = this;
  return browser.wait(function() {
    return self.run(fn);
  }, self.MAX_TIMEOUT, 'should wait for script to return true');
};

// waits for a model animation to complete
Helper.prototype.waitForModalTransition = function() {
  var self = this;
  return browser.wait(function() {
    return browser.driver.findElements(by.css(
      '.stackable.ng-animate,.stackable-content.ng-animate,' +
      '.stackable-popover-content.ng-animate'))
      .then(function(result) {
        return result.length === 0;
      });
  }, self.MAX_TIMEOUT, 'should wait for modal to transition');
};

// gets a random alphabetical string
Helper.prototype.randomString = function(length) {
  var idx_A = 'A'.charCodeAt(0);
  var idx_a = 'a'.charCodeAt(0) - 26;
  length = length || 10;
  var rval = '';
  while(rval.length < length) {
    var code = Math.floor(Math.random() * 52);
    code += (code < 26) ? idx_A : idx_a;
    rval += String.fromCharCode(code);
  }
  return rval;
};

// uses AngularJS to format a date
Helper.prototype.formatDate = function(date, format) {
  return this.run(['function($injector, callback) {',
    'var filter = $injector.get("dateFilter");',
    'var date = new Date("' + date + '");',
    'var format = "' + format + '";',
    'return callback(filter(date, format));',
  '}'].join(''));
};

// performs a simple equality-based query on an array of items
Helper.prototype.find = function(items, query) {
  return Array.prototype.filter.call(items, _.matches(query));
};

// performs a simple equality-based query on an array of items
Helper.prototype.findOne = function(items, query) {
  items = this.find(items, query);
  if(items.length > 0) {
    return items[0];
  }
  return null;
};

// gets data from a loaded angular service
// pass service name or path (dot-delimited) to specific data
Helper.prototype.getServiceData = function(service) {
  return global.element(by.tagName(browser.rootEl)).evaluate(
    'app.services.' + service);
};

// find a row in a repeater by evaluating an expression in its scope
// and checking its value via the given function
Helper.prototype.findRowByEval = function(repeater, expr, fn, parent) {
  parent = parent || global.element(by.css('document'));
  var match = null;
  if(typeof fn !== 'function') {
    var y = fn;
    fn = function(x) {return x === y;};
  }
  return parent.all(by.repeater(repeater))
    .map(function(row, index) {
      return row.evaluate(expr).then(fn).then(function(result) {
        if(result) {
          match = index;
        }
      });
    })
    .then(function() {
      if(match === null) {
        return null;
      }
      return parent.element(by.repeater(repeater).row(match));
    });
};

// escape JSON to be transferred to browser
Helper.prototype.escapeJson = function(json) {
  return json
    .replace(/\\n/g, '\\\\n')
    .replace(/\\r/g, '\\\\r')
    .replace(/\"/g, "\\\"")
    .replace(/'/g, "\\'");
};

// clones 'x' via JSON serialization/deserialization
Helper.prototype.clone = function(x) {
  return JSON.parse(JSON.stringify(x));
};

api.on('init', function() {
  // locate elements by controller
  by.addLocator('controller', function(value, parent) {
    var using = parent || document;
    var query = "ng-controller^='" + value + "']";
    query = '[' + query + ', [data-' + query;
    return using.querySelectorAll(query);
  });

  // locate elements via an attribute value
  by.addLocator('attribute', function(attr, value, parent) {
    if(value && value.querySelectorAll) {
      parent = value;
      value = undefined;
    }
    var using = parent || document;
    var query = attr;
    if(value !== undefined) {
      query += "='" + value + "'";
    }
    query += ']';
    query = '[' + query + ', [data-' + query;
    return using.querySelectorAll(query);
  });
});
