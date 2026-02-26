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

        // Check all previous entries for this participant
        const prevEntries = await Entry.find({ participantId }).sort({ createdAt: 1 }).lean();

        if (prevEntries.length > 0) {
            // Already entered — still show VERIFIED but include full entry history
            return res.json({
                success: true,
                status: 'VERIFIED',
                alreadyEntered: true,
                participantId,
                entryTimes: prevEntries.map(e => formatTime(e.createdAt)),
                message: `Verified — checked in ${prevEntries.length} time(s) previously.`,
            });
        }

        // First entry — save to DB
        await Entry.create({ participantId, passSecret, deviceId: deviceId || 'unknown' });

        return res.json({
            success: true,
            status: 'VERIFIED',
            alreadyEntered: false,
            participantId,
            entryTimes: [],
            message: `${participantId} — entry confirmed`,
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
