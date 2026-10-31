'use strict';

const assertContract = require('../../core/assertContract');

const METHODS = ['getState', 'purchase', 'equipBackground', 'consumePower'];

class IShopRepository {
  static get METHODS() { return METHODS; }
  static assert(implementation) {
    assertContract(implementation, METHODS, 'IShopRepository');
  }
}

module.exports = IShopRepository;
