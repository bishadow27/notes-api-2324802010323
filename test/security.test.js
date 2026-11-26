const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const server = app.listen(0);
after(() => server.close());

test('notes requires a bearer token', async () => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/notes`);
  assert.equal(response.status, 401);
});

test('object credentials cannot log in and request 21 is rate limited', async () => {
  const url = `http://127.0.0.1:${server.address().port}/auth/login`;
  for (let i = 1; i <= 21; i++) {
    const response = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: { $gt: '' }, password: 'x' })
    });
    assert.equal(response.status, i <= 20 ? 401 : 429, `Auth request ${i}`);
    if (i === 1 || i === 20 || i === 21) console.log(`Auth request ${i}: ${response.status}`);
  }
});
