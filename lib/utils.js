
'use strict';

module.exports = {
  toArray: function (args) {
    return Array.prototype.slice.apply(args);
  },

  quoteRegExp: function(str) {
    return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
  }
};
