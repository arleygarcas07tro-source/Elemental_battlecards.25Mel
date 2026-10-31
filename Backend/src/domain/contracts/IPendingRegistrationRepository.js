'use strict';

const assertContract = require('../../core/assertContract');

const METHODS = ['findByEmail', 'findByUsername', 'create', 'updateById', 'deleteById', 'deleteExpired'];

class IPendingRegistrationRepository {
  static get METHODS() {
    return METHODS;
  }

  static assert(implementation) {
    assertContract(implementation, METHODS, 'IPendingRegistrationRepository');
  }
}

module.exports = IPendingRegistrationRepository;
