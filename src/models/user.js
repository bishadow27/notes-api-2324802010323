const { Schema, model } = require('mongoose');
const schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });
module.exports = model('User', schema);
