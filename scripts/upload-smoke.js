require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const User = require('../src/models/user');
const base = process.env.API_URL || 'http://127.0.0.1:3000';
const email = `lab4-upload-${randomUUID()}@example.test`;
const password = randomUUID() + 'Aa1!';
const content = 'Lab 4 authenticated upload evidence';
let id, noteId, token;

async function json(path, method, body, bearer) {
  const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(bearer ? { authorization: `Bearer ${bearer}` } : {}) }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const registration = await json('/auth/register', 'POST', { email, password });
  assert.equal(registration.status, 201); id = registration.body.id;
  const login = await json('/auth/login', 'POST', { email, password });
  assert.equal(login.status, 200); token = login.body.token;
  const note = await json('/notes', 'POST', { title: 'Lab 4 upload verification' }, token);
  assert.equal(note.status, 201); noteId = note.body._id;
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), 'lab04-evidence.txt');
  const upload = await fetch(`${base}/notes/${noteId}/attachment`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form });
  assert.equal(upload.status, 200, 'Upload');
  const result = await upload.json();
  assert.ok(result.attachmentUrl);
  const file = await fetch(result.attachmentUrl);
  assert.equal(file.status, 200, 'Public URL');
  assert.equal(await file.text(), content);
  console.log('PASS authenticated owner upload: HTTP 200');
  console.log('PASS attachmentUrl: HTTP 200; file content verified');
  console.log('Public attachment URL:', result.attachmentUrl);
  console.log('The uploaded test file remains in the public attachments bucket for evidence.');
}

main().catch(err => { console.error('FAIL:', err.message); process.exitCode = 1; }).finally(async () => {
  try {
    if (noteId && token) {
      const res = await fetch(`${base}/notes/${noteId}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
      assert.equal(res.status, 204, 'Delete test note');
    }
    if (id) {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      await User.deleteOne({ _id: id, email });
      await mongoose.disconnect();
    }
    console.log('Temporary test account and note removed.');
  } catch (err) {
    console.error('Cleanup failed:', err.message); process.exitCode = 1;
    await mongoose.disconnect().catch(() => {});
  }
});
