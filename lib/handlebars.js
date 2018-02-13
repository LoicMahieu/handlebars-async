
'use strict';

var Waiter = require('./waiter');
var utils = require('./utils');
var _ = require('lodash');

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

var bindAsync = function (fn, _waiter) {
  return function (context, options) {
    var waiter = _waiter;
    var isAsync = false;
    var waiterId;

    var helperContext = this || {};
    if (typeof helperContext !== 'object') {
      helperContext = {};
    }

    helperContext.async = function () {
      isAsync = true;

      var wait = waiter.create();
      waiterId = wait.id;
      return wait.done;
    };

    if (options.fn) {
      var _fn = options.fn;
      options.fn = function (_context) {
        _context = utils.copy(_context);
        _context._async_waiter = function () {
          return waiter;
        };
        return _fn.call(this, _context);
      };
    }

    if (options.inverse) {
      var _inverse = options.inverse;
      options.inverse = function (_context) {
        _context = utils.copy(_context);
        _context._async_waiter = function () {
          return waiter;
        };
        return _inverse.call(this, _context);
      };
    }

    var res = fn.apply(helperContext, arguments);

    if (isAsync) {
      return obscurate(waiterId);
    } else {
      return res;
    }
  };
};

module.exports = function (Handlebars) {
  var _registerHelper = Handlebars.registerHelper;
  var _compile = Handlebars.compile;
  var _vm_invokePartial = Handlebars.VM.invokePartial;
  var _vm_program = Handlebars.VM.program;

  /*Handlebars.registerHelper = function (name, fn) {
    return _registerHelper.call(Handlebars, name, bindAsync(fn));
  };*/

  Handlebars.registerAsyncHelper = function (name, fn) {
    return _registerHelper.call(Handlebars, name, function () {
      var args = utils.toArray(arguments);
      args.push(this.async());
      fn.apply(this, args);
    });
    /*
    var _fn = fn;
    fn = function () {
      var wait = this._async_waiter().create();
      var args = utils.toArray(arguments);
      args.push(wait.done);

      _fn.apply(this, args);

      return obscurate(wait.id);
    };

    return _registerHelper.call(Handlebars, name, fn);*/
  };

  Handlebars.compile = function () {
    var compiled = _compile.apply(Handlebars, arguments);
    
    return function (context, options, callback) {
      if (typeof context == 'function') {
        callback = context;
        context = {};
      }
      if (typeof options == 'function') {
        callback = options;
        options = {};
      }

      var waiter = new Waiter();

      options = options || {};
      options.helpers = options.helpers || {};
      options.helpers = _.extend({}, options.helpers, Handlebars.helpers);

      for (var helper in options.helpers) {
        if (options.helpers.hasOwnProperty(helper)) {
          options.helpers[helper] = bindAsync(options.helpers[helper], waiter);
        }
      }

      options.helpers._async_waiter = function () { return waiter; };

      var res = compiled.call(Handlebars, context, options);

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

  Handlebars.VM.invokePartial = function (partial, name, context, helpers, partials, data) {
    var wait;
    var options = { helpers: helpers, partials: partials, data: data };

    if(partial === undefined) {
      throw new Handlebars.Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      wait = helpers._async_waiter().create();
      partial(context, wait.done);
      return obscurate(wait.id);
    } else if (!Handlebars.compile) {
      throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    } else {
      wait = helpers._async_waiter().create();

      partials[name] = Handlebars.compile(partial, {data: data !== undefined});
      partials[name](context, options, wait.done);

      return obscurate(wait.id);
    }
  };

  Handlebars.VM.program =  function(i, fn, data) {
    var program = function(context, options) {
      options = options || {};

      return fn(context, options.data || data);
    };
    program.program = i;
    program.depth = 0;
    return program;
  };

  return Handlebars;
};
