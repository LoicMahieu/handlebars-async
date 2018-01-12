
'use strict';

var uuid = require('uuid');

function Waiter () {
  this._waiting = [];
  this._resolved = {};
  this._onResolved = [];
  this._firstErr = null;
}

Waiter.prototype.create = function () {
  var self = this;
  var id;

  while((id = uuid.v1()) && this._waiting.indexOf(id) >= 0);

  this._waiting.push(id);

  return {
    id: id,
    done: function (err) {
      self._waiting.splice(self._waiting.indexOf(id), 1);
      self._resolved[id] = arguments;
      self._firstErr = self._firstErr || err;

      if (self._waiting.length <= 0 && self._onResolved.length > 0) {
        process.nextTick(function () {
          self._onResolved.forEach(function (fn) {
            fn.call(self, self._firstErr, self._resolved);
          });
          self._onResolved = [];
        });
      }
    }
  };
};

Waiter.prototype.remove = function (id) {
  delete this._resolved[id];
};

Waiter.prototype.done = function (cb) {
  if (this._waiting.length <= 0) {
    cb.apply(this, this._resolved);
  } else {
    this._onResolved.push(cb);
  }
};

module.exports = Waiter;
