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
// POST /api/scan
// Body: { qrCode, deviceId }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/scan', async (req, res) => {
    try {
        const { qrCode, deviceId } = req.body;
        if (!qrCode)
            return res.status(400).json({ success: false, message: 'QR code is empty.' });

        const parsed = parseQr(qrCode);
        if (!parsed.valid)
            return res.json({ success: false, status: 'INVALID_QR', message: parsed.error });

        const { participantId, passSecret } = parsed;
        const { Entry } = getModels();

        // 1. Record the new entry immediately
        await Entry.create({
            participantId,
            passSecret,
            deviceId: deviceId || 'unknown'
        });

        // 2. Fetch all entries for this participant to show history
        const allEntries = await Entry.find({ participantId }).sort({ createdAt: 1 }).lean();
        const alreadyEntered = allEntries.length > 1;

        // Map history (excluding the current scan which is the last one in the sorted list)
        const history = allEntries.slice(0, -1).map(e => formatTime(e.createdAt));

        return res.json({
            success: true,
            status: 'VERIFIED',
            alreadyEntered: alreadyEntered,
            participantId,
            entryTimes: history,
            message: alreadyEntered
                ? `Verified — seen ${allEntries.length} times total.`
                : `${participantId} — entry confirmed`
        });

    } catch (err) {
        console.error('Scan error:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/entries?deviceId=xxx
// Returns only entries scanned by this device
// ─────────────────────────────────────────────────────────────────────────────
router.get('/entries', async (req, res) => {
    try {
        const { deviceId } = req.query;
        const { Entry } = getModels();

        const filter = deviceId ? { deviceId } : {};
        const entries = await Entry.find(filter).sort({ createdAt: -1 }).lean();
        res.json({ success: true, count: entries.length, entries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
