/**
 * seed.js — Populate the registration replica DB with sample data for testing.
 * Run: npm run seed
 *
 * ⚠️  This is for TESTING only. In production, the registration DB is your
 *     actual event registration system's MongoDB — you just point REGISTRATION_DB_URI
 *     at it and this script is never needed.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const registrationSchema = require('./models/Registration');

const SAMPLE_PARTICIPANTS = [
    {
        qrCode: 'QR-001',
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
        phone: '9876543210',
        paymentStatus: 'paid',
        ticketType: 'General',
        college: 'IIT Bombay',
    },
    {
        qrCode: 'QR-002',
        name: 'Priya Mehta',
        email: 'priya@example.com',
        phone: '9123456789',
        paymentStatus: 'paid',
        ticketType: 'VIP',
        college: 'NIT Trichy',
    },
    {
        qrCode: 'QR-003',
        name: 'Rohan Patel',
        email: 'rohan@example.com',
        phone: '9000000001',
        paymentStatus: 'unpaid',
        ticketType: 'General',
        college: 'BITS Pilani',
    },
    {
        qrCode: 'QR-004',
        name: 'Sneha Rao',
        email: 'sneha@example.com',
        phone: '9000000002',
        paymentStatus: 'paid',
        ticketType: 'Workshop',
        college: 'VIT Vellore',
    },
    {
        qrCode: 'QR-005',
        name: 'Karthik Nair',
        email: 'karthik@example.com',
        phone: '9000000003',
        paymentStatus: 'pending',
        ticketType: 'General',
        college: 'Anna University',
    },
];

(async () => {
    try {
        const conn = await mongoose.createConnection(process.env.REGISTRATION_DB_URI).asPromise();
        const Registration = conn.model('Registration', registrationSchema, 'registrations');

        // Clear existing seed data (only those with QR-00x codes)
        await Registration.deleteMany({ qrCode: { $in: SAMPLE_PARTICIPANTS.map(p => p.qrCode) } });

        // Insert fresh
        const inserted = await Registration.insertMany(SAMPLE_PARTICIPANTS);
        console.log(`✅  Seeded ${inserted.length} sample participants into: ${process.env.REGISTRATION_DB_URI}`);
        console.log('\nTest QR codes:');
        SAMPLE_PARTICIPANTS.forEach(p =>
            console.log(`  ${p.qrCode}  →  ${p.name}  (${p.paymentStatus})`)
        );

        await conn.close();
        process.exit(0);
    } catch (err) {
        console.error('❌  Seed failed:', err.message);
        process.exit(1);
    }
})();
