'use strict';

module.exports = {
  getLibraryInstance: function(options = {}) {
    return new StellarPaymentWatcher(options);
  },
};
