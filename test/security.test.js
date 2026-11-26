const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const server = app.listen(0);
after(() => server.close());

test('notes requires a bearer token', async () => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/notes`);
  assert.equal(response.status, 401);
});

test('object credentials cannot log in', async () => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: { $gt: '' }, password: 'x' })
  });
  assert.equal(response.status, 401);
});

test('rate limit rejects the 21st auth request', async () => {
  let response;
  // One prior auth request has already consumed the first slot.
  for (let i = 0; i < 20; i++) {
    response = await fetch(`http://127.0.0.1:${server.address().port}/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: { $gt: '' }, password: 'x' })
    });
  }
  assert.equal(response.status, 429);
});
