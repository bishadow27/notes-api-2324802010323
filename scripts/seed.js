require('dotenv').config();

const mongoose = require('mongoose');
const Note = require('../src/models/note');

const TAGS = ['cloud', 'docker', 'nosql', 'security', 'devops', 'java', 'web'];

async function main() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI');

    await mongoose.connect(process.env.MONGODB_URI);
    await Note.createIndexes();

    // Delete only previous demo records. Other notes are preserved.
    const removed = await Note.deleteMany({ owner: 'seed' });

    const docs = Array.from({ length: 2000 }, (_, i) => ({
      title: 'Ghi chú mẫu ' + (i + 1),
      content: 'Dữ liệu thử nghiệm',
      tags: [TAGS[i % 7], TAGS[(i * 3) % 7]],
      owner: 'seed'
    }));

    await Note.insertMany(docs);

    console.log('Đã xóa ' + removed.deletedCount + ' ghi chú seed cũ');
    console.log('Đã chèn ' + docs.length + ' ghi chú mẫu');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Seed thất bại:', err.message);
  process.exitCode = 1;
});
