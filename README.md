# bedrock-protractor

A [bedrock][] module that integrates the [protractor][] test framework for
AngularJS applications with [bedrock][].

## Requirements

- npm v3+

## Quick Examples

```
npm install bedrock-protractor
```

```js
var bedrock = require('bedrock');
var cfg = bedrock.config.protractor.config;

// add protractor tests for your module/project to your config file
cfg.suites['bedrock-foo'] = '/foo/test/tests/**/*.js';

// add a script to run to define helper functions prior to tests
cfg.params.config.onPrepare.push('/foo/test/helpers/bar.js';
```

To run tests on the command line:

```
node myproject.js test --framework protractor
```

## Setup

1. For debian-based systems (eg: Ubuntu), install openjdk-7-jdk.

## Configuration

For more documentation on configuration, see [config.js](./lib/config.js).


[bedrock]: https://github.com/digitalbazaar/bedrock
[protractor]: https://github.com/angular/protractor
