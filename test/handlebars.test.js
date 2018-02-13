
var Handlebars = require('handlebars');
var handlebarsAsync = require('..');
var chai = require('chai');
var expect = chai.expect;
var fs = require('fs');

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

    hbs.registerPartial('partials/thePartial', 'bar');

    var tpl = hbs.compile('{{asyncHelper "value" arg2="value2"}}{{> "partials/thePartial"}}');

    tpl(function (err, content) {
      expect(content).to.be.equal("VALUE-value2bar");
      done();
    });
  });

  it('Can register a async helper with a partial in a partial', function (done) {
    hbs.registerHelper('asyncHelper', function (arg1, options) {
      var callback = this.async();
      process.nextTick(function () {
        return callback(null, arg1.toUpperCase() + '-' + options.hash.arg2);
      });
    });

    hbs.registerPartial('partials/thePartial', 'bar{{> "partials/thePartial2"}}');
    hbs.registerPartial('partials/thePartial2', 'foo');

    var tpl = hbs.compile('{{asyncHelper "value" arg2="value2"}}{{> "partials/thePartial"}}');

    tpl(function (err, content) {
      expect(content).to.be.equal("VALUE-value2barfoo");
      done();
    });
  });

  it('Can register a render this mega template!', function (done) {
    hbs.registerHelper('asyncHelper1', function (arg1, options) {
      var callback = this.async();
      process.nextTick(function () {
        return callback(null, "<h1 class='" + options.hash.arg2 + "'>" + arg1 + "</h1>");
      });
    });
    hbs.registerHelper('asyncHelper2', function (arg1, options) {
      var callback = this.async();
      process.nextTick(function () {
        return callback(null, "<h2 class='" + options.hash.arg2 + "'>" + arg1 + "</h2>");
      });
    });
    hbs.registerHelper('asyncHelper3', function (arg1, options) {
      var callback = this.async();
      return callback(null, "<h3 class='" + options.hash.arg2 + "'>" + arg1 + "</h3>");
    });
    hbs.registerAsyncHelper('asyncHelper4', function (arg1, options, callback) {
      return callback(null, "<h4 class='" + options.hash.arg2 + "'>" + arg1 + "</h4>");
    });

    hbs.registerHelper('classicHelper', function (arg1, options) {
      return arg1.toUpperCase() + '-' + options.hash.arg2;
    });

    hbs.registerHelper('classicHelper2', function (arg1, options) {
      if (arg1 == 'yes') {
        return options.fn({
          newContext: 'yes!'
        });
      } else {
        return options.inverse({
          newContext2: true
        });
      }
    })

    var fixtures = __dirname + '/fixtures';
    var tpl = hbs.compile(fs.readFileSync(fixtures + '/mega_template.hbs').toString());

    hbs.registerPartial('partials/partial1', fs.readFileSync(fixtures + '/partials/partial1.hbs').toString());
    hbs.registerPartial('partials/partial2', fs.readFileSync(fixtures + '/partials/partial2.hbs').toString());
    hbs.registerPartial('partials/partial3', fs.readFileSync(fixtures + '/partials/partial3.hbs').toString());

    tpl({
      arg1: 'value1',
      arg2: 'value2',
      arg3: 'value3',
      arg4: 'value4',
      arg5: 'value5'
    }, function (err, content) {
      fs.writeFileSync('test.html', content);
      expect(content).to.be.equal(fs.readFileSync(fixtures + '/expected.html').toString());
      done();
    });
  });

  it('Can register a classic helper with conditionnal with async helper', function (done) {
    hbs.registerHelper('classicHelper', function (arg1, options) {
      if (arg1 == 'yes') {
        return options.fn({
          newContext: 'yes!'
        });
      } else {
        return options.inverse({
          newContext2: 'no!'
        });
      }
    });

    hbs.registerHelper('asyncHelper', function (arg1, options) {
      var callback = this.async();
      process.nextTick(function () {
        return callback(null, arg1.toUpperCase());
      });
    });

    var tpl = hbs.compile('{{#classicHelper value1}}Yes!{{asyncHelper newContext}}{{/classicHelper}}');

    tpl({
      value1: 'yes'
    }, function (err, content) {
      expect(content).to.be.equal("Yes!YES!");
      done();
    });
  });

  it('Can register a classic helper with conditionnal with async helper', function (done) {
    hbs.registerHelper('classicHelper', function (arg1, options) {
      if (arg1 == 'yes') {
        return options.fn({
          newContext: 'yes!'
        });
      } else {
        return options.inverse({
          newContext2: 'no!'
        });
      }
    });

    hbs.registerHelper('asyncHelper', function (arg1, options) {
      var callback = this.async();
      process.nextTick(function () {
        return callback(null, arg1.toUpperCase());
      });
    });

    var tpl = hbs.compile('{{#classicHelper value1}}Yes!{{asyncHelper newContext}}{{/classicHelper}}');

    tpl({
      value1: 'yes'
    }, function (err, content) {
      expect(content).to.be.equal("Yes!YES!");
      done();
    });
  });

  it('Can register a classic helper with each', function (done) {
    hbs.registerHelper('classicHelper', function (arg1, options) {
      if (arg1 == 'yes') {
        return 'yes!';
      } else {
        return 'no!';
      }
    });

    var tpl = hbs.compile('{{#each arr}}{{classicHelper .}}{{/each}}');

    tpl({
      arr: ['yes', 'no']
    }, function (err, content) {
      expect(content).to.be.equal("yes!no!");
      done();
    });
  });

  it('Can register a async helper with each', function (done) {
    hbs.registerHelper('asyncHelper', function (arg1, options) {
      var callback = this.async();
      process.nextTick(function () {
        return callback(null, arg1.toUpperCase());
      });
    });

    var tpl = hbs.compile('{{#each arr}}{{asyncHelper .}}{{/each}}');

    tpl({
      arr: ['yes', 'no']
    }, function (err, content) {
      expect(content).to.be.equal("YESNO");
      done();
    });
  });

});
