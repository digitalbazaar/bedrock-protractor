# bedrock-protractor ChangeLog

## 3.1.3 - 2016-07-20

### Changed
- Replace deprecated `GLOBAL` with `global`.

## 3.1.2 - 2016-07-07

### Fixed
- Ensure correct version of mocha is patched to allow in-browser unit
  unit tests to run.
- Fix race condition when loading in-browser unit test runner.

## 3.1.1 - 2016-06-17

### Fixed
- Update protractor binary path.

## 3.1.0 - 2016-06-17

### Changed
- Update protractor dependency from 2.x to 3.x.

### Added
Add selectWindow helper.

## 3.0.1 - 2016-03-15

### Changed
- Update bedrock dependencies.

## 3.0.0 - 2016-03-03

### Changed
- Update package dependencies for npm v3 compatibility.

## 2.3.0 - 2015-12-06

### Added
- `bedrock.unit(bootstrap)` method to replace `bedrock.testInBrowser`. This new
  call executes mocha unit tests in the browser, but ensures that the angular
  application is not bootstrapped until a test begins or until the first test
  executes or until requested by the test author.

## 2.2.0 - 2015-10-21

### Added
- Make `chai`, `expect`, and `should` globally available in
  any in-browser tests.

## 2.1.1 - 2015-07-08

### Changed
- Provide tighter integration with browser-based mocha. Now browser-based
  tests should properly nest into the parent test suite.

## 2.1.0 - 2015-06-12

### Added
- `bedrock.testInBrowser()` feature to allow running mocha tests directly in
  the browser. `mocha` must be available in the environment (ie: install it
  via bower).

## 2.0.0 - 2015-05-07

### Added
- `--protractor-chrome-binary` option to more easily test different
  chrome/chromium versions.
- `--protractor-firefox-binary` option to more easily test different
  chrome/chromium versions.
- `--protractor-troubleshoot` option to help debug protractor issues.

### Changed
- **BREAKING**: Use protractor `2.x`.
- Use `directConnect` mode for chrome and firefox.

## 1.0.0 - 2015-04-08

## 0.1.0 (up to early 2015)

- See git history for changes.
