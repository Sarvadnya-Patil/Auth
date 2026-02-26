const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
    {
        participantId: { type: String, required: true },
        passSecret: { type: String },
        deviceId: { type: String, index: true }, // which device scanned this
    },
    { timestamps: true }
);

module.exports = entrySchema;
