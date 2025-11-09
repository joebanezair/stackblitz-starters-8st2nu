const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  readByOwner: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
