
'use strict';

module.exports = {
  toArray: function (args) {
    return Array.prototype.slice.apply(args);
  },

  quoteRegExp: function (str) {
    return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
  },

  copy: function (obj) {
    if (null === obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }
};
