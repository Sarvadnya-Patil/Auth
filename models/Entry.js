const mongoose = require('mongoose');

// Stores every confirmed concert entry
const entrySchema = new mongoose.Schema(
    {
        participantId: { type: String, required: true, unique: true }, // e.g. "inv00002"
        passSecret: { type: String },   // from the QR — stored for audit
        enteredAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = entrySchema;
