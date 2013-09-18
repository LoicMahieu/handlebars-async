
var Handlebars = require('handlebars');
var handlebarsAsync = require('..');
var chai = require('chai');
var expect = chai.expect;

describe('Handlebars Async', function () {
  var hbs;

  beforeEach(function (done) {
    hbs = handlebarsAsync(Handlebars.create());
    done();
  });

  it('Can wrap Handlebars instance', function (done) {
    expect(hbs.registerHelper).to.be.a('function');
    expect(hbs.registerAsyncHelper).to.be.a('function');
    expect(hbs.compile).to.be.a('function');

    done();
  });

  it('Can register a classic helper', function (done) {
    hbs.registerHelper('classicHelper', function (arg1, options) {
      return arg1.toUpperCase() + '-' + options.hash.arg2;
    });

    var tpl = hbs.compile('{{classicHelper "value" arg2="value2"}}');

    tpl(function (err, content) {
      expect(content).to.be.equal("VALUE-value2");
      done();
    });
  });

  it('Can register a async helper via registerAsyncHelper', function (done) {
    hbs.registerAsyncHelper('asyncHelper', function (arg1, options, callback) {
      process.nextTick(function () {
        return callback(null, arg1.toUpperCase() + '-' + options.hash.arg2);
      });
    });

    var tpl = hbs.compile('{{asyncHelper "value" arg2="value2"}}');

    tpl(function (err, content) {
      expect(content).to.be.equal("VALUE-value2");
      done();
    });
  });

  it('Can register a async helper via registerHelper', function (done) {
    hbs.registerHelper('asyncHelper', function (arg1, options) {
      var callback = this.async();
      process.nextTick(function () {
        return callback(null, arg1.toUpperCase() + '-' + options.hash.arg2);
      });
    });

    var tpl = hbs.compile('{{asyncHelper "value" arg2="value2"}}');

    tpl(function (err, content) {
      expect(content).to.be.equal("VALUE-value2");
      done();
    });
  });

  it('Can register a async helper with a partial', function (done) {
    hbs.registerHelper('asyncHelper', function (arg1, options) {
      var callback = this.async();
      process.nextTick(function () {
        return callback(null, arg1.toUpperCase() + '-' + options.hash.arg2);
      });
    });

    hbs.registerPartial('partials/thePartial', 'Hello Iam a partial');

    var tpl = hbs.compile('{{asyncHelper "value" arg2="value2"}}{{> "partials/thePartial"}}');

    tpl(function (err, content) {
      expect(content).to.be.equal("VALUE-value2Hello Iam a partial");
      done();
    });
  });

});
