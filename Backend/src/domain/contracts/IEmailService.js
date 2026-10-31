'use strict';

const assertContract = require('../../core/assertContract');

const METHODS = ['sendVerificationCode'];

class IEmailService {
  static get METHODS() {
    return METHODS;
  }

  static assert(implementation) {
    assertContract(implementation, METHODS, 'IEmailService');
  }
}

module.exports = IEmailService;
