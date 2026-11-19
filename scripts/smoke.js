const assert = require('node:assert/strict');

const base = process.env.API_URL || 'http://localhost:3000';

async function request(path, options = {}, expectedStatus = 200) {
  const response = await fetch(base + path, options);
  const body = response.status === 204 ? null : await response.json();

  assert.equal(
    response.status,
    expectedStatus,
    path + ': cần HTTP ' + expectedStatus + ', nhận ' + response.status + ': ' + JSON.stringify(body)
  );

  return body;
}

async function main() {
  await request('/', {}, 200);

  let id;

  try {
    const created = await request('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Bài 3 - kiểm thử',
        content: 'MongoDB Atlas và Supabase Storage',
        tags: ['cloud', 'nosql']
      })
    }, 201);

    id = created._id;
    assert.ok(id, 'POST phải trả về _id');
    console.log('PASS POST /notes -> 201');

    const found = await request('/notes/' + id);
    assert.equal(found.title, 'Bài 3 - kiểm thử');
    await request('/notes?tag=nosql');
    console.log('PASS GET /notes và GET /notes/:id -> 200');

    const updated = await request('/notes/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Ghi chú đã cập nhật' })
    }, 200);

    assert.equal(updated.title, 'Ghi chú đã cập nhật');
    console.log('PASS PUT /notes/:id -> 200');

    const form = new FormData();
    form.append('file', new Blob(['Tệp thử nghiệm\n'], { type: 'text/plain' }), 'note.txt');

    const attached = await request('/notes/' + id + '/attachment', {
      method: 'POST',
      body: form
    }, 200);

    assert.ok(attached.attachmentUrl, 'API phải trả về attachmentUrl');

    const fileResponse = await fetch(attached.attachmentUrl);
    assert.equal(fileResponse.status, 200, 'Public URL phải mở được');
    console.log('PASS upload attachment -> 200; public URL -> 200');
    console.log('Attachment URL:', attached.attachmentUrl);

    await request('/notes/invalid-object-id', {}, 400);

    await request('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Thiếu title' })
    }, 400);

    console.log('PASS lỗi dữ liệu -> 400');
  } finally {
    if (id) {
      await request('/notes/' + id, { method: 'DELETE' }, 204);
      await request('/notes/' + id, {}, 404);
      console.log('PASS DELETE -> 204; GET sau khi xóa -> 404');
    }
  }

  console.log('Tất cả kiểm thử API đã PASS.');
}

main().catch((err) => {
  console.error('SMOKE TEST FAIL:', err.message);
  process.exitCode = 1;
});
