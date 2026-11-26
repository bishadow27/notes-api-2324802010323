const express = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const Note = require('../models/note');
const { bucket } = require('../storage');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

// READ: list the newest 50 notes; optionally filter by tag.
router.get('/', async (req, res) => {
  const filter = { owner: req.user.sub };
  if (req.query.tag) filter.tags = String(req.query.tag);
  const notes = await Note.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json(notes);
});

// READ: get one note.
router.get('/:id', async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user.sub });
  if (!note) return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  res.json(note);
});

// CREATE.
router.post('/', async (req, res) => {
  const { title, content, tags } = req.body ?? {};
  const note = await Note.create({ title, content, tags, owner: req.user.sub });
  res.status(201).json(note);
});

// UPDATE: partial updates are accepted.
router.put('/:id', async (req, res) => {
  const { title, content, tags } = req.body ?? {};
  const update = {};

  if (title !== undefined) update.title = title;
  if (content !== undefined) update.content = content;
  if (tags !== undefined) update.tags = tags;

  const note = await Note.findOneAndUpdate({ _id: req.params.id, owner: req.user.sub }, update, {
    new: true,
    runValidators: true
  });

  if (!note) return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  res.json(note);
});

// DELETE.
router.delete('/:id', async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.sub });
  if (!note) return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  res.status(204).end();
});

// Upload an attachment to Supabase Storage and save only its public URL in MongoDB.
router.post('/:id/attachment', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Thiếu tệp ở trường "file"' });
  }

  const note = await Note.findOne({ _id: req.params.id, owner: req.user.sub });
  if (!note) return res.status(404).json({ error: 'Không tìm thấy ghi chú' });

  const safeName = String(req.file.originalname || 'attachment')
    .normalize('NFD')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .slice(0, 100) || 'attachment';

  const path = String(note._id) + '/' + randomUUID() + '-' + safeName;
  const storage = bucket();

  const { error } = await storage.upload(path, req.file.buffer, {
    contentType: req.file.mimetype || 'application/octet-stream',
    upsert: false
  });

  if (error) throw error;

  note.attachmentUrl = storage.getPublicUrl(path).data.publicUrl;

  try {
    await note.save();
  } catch (err) {
    // Try to remove an uploaded object if saving the MongoDB document fails.
    const cleanup = await storage.remove([path]);
    if (cleanup.error) console.error('Không xóa được tệp vừa tải:', cleanup.error);
    throw err;
  }

  res.json(note);
});

module.exports = router;
