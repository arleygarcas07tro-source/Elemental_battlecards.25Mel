'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const AuthService = require('../src/domain/services/AuthService');
const ILogger = require('../src/core/ILogger');
const { ValidationError, UnauthorizedError, ConflictError } = require('../src/core/errors');

class QuietLogger extends ILogger {
  info() {}
  warn() {}
  error() {}
}

function makeDeps() {
  const users = [];
  const pendingRegistrations = [];
  const sentVerificationCodes = [];
  const userRepository = {
    _users: users,
    async findByUsername(username) {
      return users.find((u) => u.username === username) || null;
    },
    async findByEmail(email) {
      return users.find((u) => u.email === email) || null;
    },
    async create(data) {
      const user = { id: users.length + 1, ...data };
      users.push(user);
      return user;
    },
  };
  const passwordHasher = {
    async hash(plain) {
      return `hashed:${plain}`;
    },
    async compare(plain, hashed) {
      return `hashed:${plain}` === hashed;
    },
  };
  const tokenService = {
    async sign(payload) {
      return `token:${payload.user.id}`;
    },
    async verify() {
      return {};
    },
  };
  const pendingRegistrationRepository = {
    _pendingRegistrations: pendingRegistrations,
    async findByEmail(email) {
      return pendingRegistrations.find((registration) => registration.email === email) || null;
    },
    async findByUsername(username) {
      return pendingRegistrations.find((registration) => registration.username === username) || null;
    },
    async create(data) {
      const registration = { id: pendingRegistrations.length + 1, ...data };
      pendingRegistrations.push(registration);
      return registration;
    },
    async updateById(id, data) {
      const registration = pendingRegistrations.find((entry) => entry.id === id);
      if (!registration) return null;
      Object.assign(registration, data);
      return registration;
    },
    async deleteById(id) {
      const index = pendingRegistrations.findIndex((entry) => entry.id === id);
      if (index >= 0) pendingRegistrations.splice(index, 1);
    },
    async deleteExpired(now) {
      for (let index = pendingRegistrations.length - 1; index >= 0; index--) {
        if (new Date(pendingRegistrations[index].expiresAt) <= now) pendingRegistrations.splice(index, 1);
      }
    },
  };
  const emailService = {
    _sentVerificationCodes: sentVerificationCodes,
    async sendVerificationCode(message) {
      sentVerificationCodes.push(message);
    },
  };
  return {
    userRepository,
    pendingRegistrationRepository,
    emailService,
    passwordHasher,
    tokenService,
    sentVerificationCodes,
  };
}

function makeService(deps = makeDeps()) {
  return new AuthService({ ...deps, logger: new QuietLogger() });
}

test('AuthService.register exige todos los campos', async () => {
  const service = makeService();

  await assert.rejects(() => service.register({ username: 'a' }), ValidationError);
});

test('AuthService.register rechaza email duplicado', async () => {
  const deps = makeDeps();
  await deps.userRepository.create({ username: 'a', email: 'a@a.com', password: 'hashed:x' });
  const service = makeService(deps);

  await assert.rejects(
    () => service.register({ username: 'b', email: 'a@a.com', password: 'Secret#123' }),
    ConflictError
  );
});

test('AuthService.register guarda un registro pendiente y envía el código', async () => {
  const deps = makeDeps();
  const service = makeService(deps);

  const result = await service.register({ username: 'a', email: 'a@a.com', password: 'Secret#123' });

  assert.equal(result.requiresVerification, true);
  assert.equal(result.email, 'a@a.com');
  assert.equal(deps.userRepository._users.length, 0);
  assert.equal(deps.pendingRegistrationRepository._pendingRegistrations.length, 1);
  assert.equal(deps.pendingRegistrationRepository._pendingRegistrations[0].password, 'hashed:Secret#123');
  assert.equal(deps.sentVerificationCodes.length, 1);
  assert.match(deps.sentVerificationCodes[0].code, /^\d{6}$/);
});

test('AuthService.verifyRegistration crea la cuenta y elimina el registro pendiente', async () => {
  const deps = makeDeps();
  const service = makeService(deps);
  await service.register({ username: 'a', email: 'a@a.com', password: 'Secret#123' });

  const result = await service.verifyRegistration({
    email: 'a@a.com',
    code: deps.sentVerificationCodes[0].code,
  });

  assert.deepEqual(result.user, { id: 1, username: 'a', email: 'a@a.com' });
  assert.equal(deps.userRepository._users[0].password, 'hashed:Secret#123');
  assert.equal(deps.pendingRegistrationRepository._pendingRegistrations.length, 0);
});

test('AuthService.login exige todos los campos', async () => {
  const service = makeService();

  await assert.rejects(() => service.login({ username: 'a' }), ValidationError);
});

test('AuthService.login rechaza usuario inexistente', async () => {
  const service = makeService();

  await assert.rejects(() => service.login({ username: 'nope', password: 'x' }), UnauthorizedError);
});

test('AuthService.login rechaza password incorrecta', async () => {
  const deps = makeDeps();
  await deps.userRepository.create({ username: 'a', email: 'a@a.com', password: 'hashed:secret' });
  const service = makeService(deps);

  await assert.rejects(() => service.login({ username: 'a', password: 'wrong' }), UnauthorizedError);
});

test('AuthService.login devuelve token y usuario sin password', async () => {
  const deps = makeDeps();
  await deps.userRepository.create({ username: 'a', email: 'a@a.com', password: 'hashed:secret' });
  const service = makeService(deps);

  const result = await service.login({ username: 'a', password: 'secret' });

  assert.equal(result.token, 'token:1');
  assert.deepEqual(result.user, { id: 1, username: 'a', email: 'a@a.com' });
  assert.equal(result.user.password, undefined);
});
