var bedrock = GLOBAL.bedrock;
var expect = GLOBAL.expect;
var should = GLOBAL.should;
var describe = GLOBAL.describe;
var it = GLOBAL.it;

describe('bedrock-protractor', function() {
  beforeEach(function() {
    bedrock.get('/');
    bedrock.waitForAngular();
  });

  it('should check assertion using chai should', function() {
    var testLink = element(by.linkText('Terms of Service'));
    testLink.isPresent().should.eventually.be.true;
  });

  it('should check assertion using chai expect', function() {
    var testLink = element(by.linkText('Terms of Service'));
    expect(testLink.isPresent()).to.eventually.be.true;
  });

  it('should navigate to another page via a link', function() {
    var testLink = element(by.linkText('Terms of Service'));
    testLink.isPresent().should.eventually.be.true;
    testLink.click();
    bedrock.waitForUrl('/legal#tos');
    bedrock.waitForAngular();
    var emailLink = element(by.linkText('support@digitalbazaar.com'));
    emailLink.isPresent().should.eventually.be.true;
  });
});
