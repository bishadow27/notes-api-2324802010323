require('dotenv').config();

const mongoose = require('mongoose');
const Note = require('../src/models/note');

function executionStats(result) {
  const value = Array.isArray(result) ? result[0] : result;
  if (!value || !value.executionStats) {
    throw new Error('Không đọc được executionStats từ explain()');
  }
  return value.executionStats;
}

async function main() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI');

    await mongoose.connect(process.env.MONGODB_URI);
    // createIndexes creates declared indexes without dropping other indexes.
    await Note.createIndexes();

    const filter = { tags: 'docker' };

    const scan = executionStats(
      await Note.find(filter)
        .hint({ $natural: 1 })
        .explain('executionStats')
    );

    const indexed = executionStats(
      await Note.find(filter)
        .hint({ tags: 1 })
        .explain('executionStats')
    );

    console.table({
      'Quét toàn bộ (COLLSCAN)': {
        docsExamined: scan.totalDocsExamined,
        returned: scan.nReturned,
        ms: scan.executionTimeMillis
      },
      'Dùng chỉ mục (IXSCAN)': {
        docsExamined: indexed.totalDocsExamined,
        returned: indexed.nReturned,
        ms: indexed.executionTimeMillis
      }
    });

    if (indexed.totalDocsExamined > 0) {
      const ratio = scan.totalDocsExamined / indexed.totalDocsExamined;
      console.log('Giảm số tài liệu phải kiểm tra: ' + ratio.toFixed(2) + ' lần');
    } else {
      console.log('Không thể tính tỉ số vì docsExamined của truy vấn có chỉ mục bằng 0');
    }

    console.log('Ưu tiên so sánh docsExamined; thời gian ms trên 2.000 tài liệu có thể dao động.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Explain thất bại:', err.message);
  process.exitCode = 1;
});
