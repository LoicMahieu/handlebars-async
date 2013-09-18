
'use strict';

var Waiter = require('./waiter');
var utils = require('./utils');

var obscurate = function (id) {
  return '__!hbs-async!__' + id + '__!hbs-async!__';
};

var regId = function (id) {
  return new RegExp(utils.quoteRegExp(obscurate(id)));
};

var findId = function (str, id) {
  return str.match(regId(id));
};

var replaceId = function (str, id, content) {
  return str.replace(regId(id), content);
};

module.exports = function (Handlebars) {
  var _registerHelper = Handlebars.registerHelper;
  var _compile = Handlebars.compile;

  var waiter = new Waiter();

  Handlebars.registerHelper = function (name, fn) {
    var _fn = fn;
    fn = function () {
      var isAsync = false;
      var waiterId;

      var context = this || {};

      context.async = function () {
        isAsync = true;

        var wait = waiter.create();
        waiterId = wait.id;
        return wait.done;
      };

      var res = _fn.apply(context, arguments);

      if (isAsync) {
        return obscurate(waiterId);
      } else {
        return res;
      }
    };

    return _registerHelper.call(Handlebars, name, fn);
  };

  Handlebars.registerAsyncHelper = function (name, fn) {
    var _fn = fn;
    fn = function () {
      var wait = waiter.create();
      var waiterId = wait.id;
      var args = utils.toArray(arguments);
      args.push(wait.done);

      _fn.apply(this, args);

      return obscurate(waiterId);
    };

    return _registerHelper.call(Handlebars, name, fn);
  };

  Handlebars.compile = function () {
    var compiled = _compile.apply(Handlebars, arguments);
    
    return function (context, options) {
      var args = utils.toArray(arguments);
      var callback = args.pop();
      var res = compiled.apply(Handlebars, args);

      if (typeof res !== 'string') {
        return callback(null, res);
      }

      waiter.done(function (err, replacements) {
        if (err) {
          return callback(err);
        }

        for (var id in replacements) {
          if (replacements.hasOwnProperty(id) && findId(res, id)) {
            res = replaceId(res, id, replacements[id][1]);
            waiter.remove(id);
          }
        }

        callback(null, res);
      });
    };
  };

  return Handlebars;
};
