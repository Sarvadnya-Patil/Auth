const mongoose = require('mongoose');
const entrySchema = require('./models/Entry');

let Entry;

async function connectDatabases() {
    const opts = { serverSelectionTimeoutMS: 5000 };

    const entryConn = await mongoose.createConnection(
        process.env.ENTRY_DB_URI, opts
    ).asPromise();
    console.log('✅  Entry DB connected:', process.env.ENTRY_DB_URI);

    Entry = entryConn.model('Entry', entrySchema, 'entries');
    return { Entry };
}

function getModels() {
    if (!Entry)
        throw new Error('DB not connected yet. Call connectDatabases() first.');
    return { Entry };
}

module.exports = { connectDatabases, getModels };
