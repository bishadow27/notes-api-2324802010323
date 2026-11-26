require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/user');
const base = process.env.API_URL || 'http://127.0.0.1:3000';
const password = randomUUID() + 'Aa1!';
const suffix = randomUUID();
const emails = [`lab4-a-${suffix}@example.test`, `lab4-b-${suffix}@example.test`];
const userIds = [];
let noteId;
let tokenA;

async function request(path, method = 'GET', body, token) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let result = null;
  if (response.status !== 204) result = await response.json();
  return { status: response.status, body: result };
}
async function main() {
  assert.equal((await request('/notes')).status, 401);
  console.log('PASS GET /notes không token: 401');
  assert.equal((await request('/notes', 'GET', undefined, 'invalid')).status, 401);
  const expired = jwt.sign({ sub: 'expired-test' }, process.env.JWT_SECRET, { expiresIn: -1 });
  assert.equal((await request('/notes', 'GET', undefined, expired)).status, 401);
  console.log('PASS token không hợp lệ và hết hạn: 401');
  for (const email of emails) {
    const registration = await request('/auth/register', 'POST', { email, password });
    assert.equal(registration.status, 201, 'đăng ký người dùng thử');
    userIds.push(registration.body.id);
  }
  const loginA = await request('/auth/login', 'POST', { email: emails[0], password });
  const loginB = await request('/auth/login', 'POST', { email: emails[1], password });
  assert.equal(loginA.status, 200); assert.equal(loginB.status, 200);
  assert.equal((await request('/auth/login', 'POST', { email: emails[0], password: password + 'wrong' })).status, 401);
  tokenA = loginA.body.token;
  assert.equal((await request('/notes', 'GET', undefined, tokenA)).status, 200);
  const note = await request('/notes', 'POST', { title: 'Lab 4 ownership test' }, tokenA);
  assert.equal(note.status, 201); noteId = note.body._id;
  assert.equal((await request(`/notes/${noteId}`, 'GET', undefined, loginB.body.token)).status, 404);
  assert.equal((await request(`/notes/${noteId}`, 'PUT', { title: 'unauthorized' }, loginB.body.token)).status, 404);
  assert.equal((await request(`/notes/${noteId}`, 'DELETE', undefined, loginB.body.token)).status, 404);
  const file = new FormData();
  file.append('file', new Blob(['Lab 4 owner test'], { type: 'text/plain' }), 'test.txt');
  const crossUpload = await fetch(`${base}/notes/${noteId}/attachment`, { method: 'POST', headers: { authorization: `Bearer ${loginB.body.token}` }, body: file });
  assert.equal(crossUpload.status, 404);
  assert.equal((await request('/auth/login', 'POST', { email: { $gt: '' }, password: 'x' })).status, 401);
  console.log('PASS đăng ký, đăng nhập: 201/200');
  console.log('PASS người B GET/PUT/DELETE/upload ghi chú của A: 404');
  console.log('PASS đầu vào NoSQL injection: 401');
}
main().then(() => console.log('Kiểm thử bảo mật hoàn thành.')).catch(err => {
  console.error('FAIL:', err.message); process.exitCode = 1;
}).finally(async () => {
  try {
    if (noteId && tokenA) {
      const deleted = await request(`/notes/${noteId}`, 'DELETE', undefined, tokenA);
      if (deleted.status !== 204) throw new Error('Không xóa được ghi chú thử');
    }
    if (userIds.length) {
      if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<')) throw new Error('Thiếu MONGODB_URI để dọn user thử');
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      await User.deleteMany({ _id: { $in: userIds }, email: { $in: emails } });
      await mongoose.disconnect();
    }
    console.log('Đã dọn dữ liệu kiểm thử được tạo bởi lượt chạy này.');
  } catch (err) {
    console.error('DỌN DỮ LIỆU FAIL:', err.message);
    process.exitCode = 1;
    await mongoose.disconnect().catch(() => {});
  }
});
