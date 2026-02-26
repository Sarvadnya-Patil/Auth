require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDatabases } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', require('./routes/api'));

// Serve index.html for any non-API route (SPA fallback)
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
    try {
        await connectDatabases();
        app.listen(PORT, () => {
            console.log(`\n🚀  Event Auth Server running at http://localhost:${PORT}`);
            console.log(`    Open this URL in your browser to start scanning.\n`);
        });
    } catch (err) {
        console.error('❌  Failed to start server:', err.message);
        process.exit(1);
    }
})();
