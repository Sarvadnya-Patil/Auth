const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
    try {
        console.log('Connecting to:', process.env.ENTRY_DB_URI);
        await mongoose.connect(process.env.ENTRY_DB_URI);
        console.log('Connected!');

        const collection = mongoose.connection.collection('entries');

        console.log('Fetching indexes...');
        const indexes = await collection.listIndexes().toArray();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        const hasUniqueId = indexes.find(idx => idx.name === 'participantId_1');
        if (hasUniqueId) {
            console.log('Dropping index participantId_1...');
            try {
                await collection.dropIndex('participantId_1');
                console.log('Index dropped successfully!');
            } catch (e) {
                console.log('Error during dropIndex:', e.message);
            }
        } else {
            console.log('Unique index participantId_1 not found.');
        }

        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

dropIndex();
