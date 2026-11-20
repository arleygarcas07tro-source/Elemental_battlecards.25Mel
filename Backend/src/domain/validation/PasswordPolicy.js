'use strict';

class PasswordPolicy {
  static getMissingRequirements(password = '') {
    const value = String(password);
    const requirements = [
      { isMet: () => [...value].length >= 8, label: 'mínimo 8 caracteres' },
      { isMet: () => /\p{Lu}/u.test(value), label: 'una letra mayúscula' },
      { isMet: () => /\p{Ll}/u.test(value), label: 'una letra minúscula' },
      { isMet: () => /[^\p{L}\p{N}\s]/u.test(value), label: 'un carácter especial (símbolo)' },
    ];

    return requirements
      .filter(({ isMet }) => !isMet())
      .map(({ label }) => label);
  }
}

module.exports = PasswordPolicy;
