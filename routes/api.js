const express = require('express');
const router = express.Router();
const { getModels } = require('../db');

// ── QR parser ──────────────────────────────────────────────────────────────
// Format: "INVENTO:inv00002:53bd8fa1d92bcb29919b6893d3e0e376"
function parseQr(raw) {
    const parts = (raw || '').trim().split(':');
    if (parts.length !== 3 || parts[0] !== 'INVENTO')
        return { valid: false, error: 'Invalid QR — not an INVENTO pass.' };
    const [, participantId, passSecret] = parts;
    if (!participantId || !/^inv[a-z0-9]+$/i.test(participantId))
        return { valid: false, error: 'Invalid participant ID in QR.' };
    if (!passSecret)
        return { valid: false, error: 'Missing pass secret in QR.' };
    return { valid: true, participantId, passSecret };
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/scan  —  Parse QR, check duplicate, save to DB in one shot
// ─────────────────────────────────────────────────────────────────────────────
router.post('/scan', async (req, res) => {
    try {
        const { qrCode } = req.body;
        if (!qrCode)
            return res.status(400).json({ success: false, message: 'QR code is empty.' });

        // 1. Parse
        const parsed = parseQr(qrCode);
        if (!parsed.valid)
            return res.json({ success: false, status: 'INVALID_QR', message: parsed.error });

        const { participantId, passSecret } = parsed;
        const { Entry } = getModels();

        // 2. Duplicate check
        const alreadyEntered = await Entry.findOne({ participantId }).lean();
        if (alreadyEntered) {
            return res.json({
                success: false,
                status: 'DUPLICATE',
                message: `Already checked in at ${formatTime(alreadyEntered.createdAt)}.`,
                participantId,
            });
        }

        // 3. Save to DB
        await Entry.create({ participantId, passSecret });

        return res.json({
            success: true,
            status: 'ENTERED',
            participantId,
            message: `${participantId} — entry confirmed ✅`,
        });

    } catch (err) {
        console.error('Scan error:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/entries — Full entry log (newest first)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/entries', async (req, res) => {
    try {
        const { Entry } = getModels();
        const entries = await Entry.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, count: entries.length, entries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
