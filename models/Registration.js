const mongoose = require('mongoose');

// Matches the actual registration collection schema
const registrationSchema = new mongoose.Schema(
  {
    _id: { type: String },           // e.g. "inv00002"
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    gender: { type: String },
    clgName: { type: String },           // college name

    // Pass type drives concert access:
    //   "G"   → NOT allowed (general pass, no concert entry)
    //   "A"   → Allowed at unofficial area only
    //   "AAA" → Allowed fully inside the concert (official)
    passType: { type: String },

    passSecret: { type: String },         // often encoded in the QR code

    payment: { type: Boolean },       // true / false
    pendingDues: { type: Number },

    isPresent: { type: Boolean },
    isOfficial: { type: Boolean },
    onboardingCompleted: { type: Boolean },
    emailVerified: { type: Boolean },
    firebaseUid: { type: String },
    role: { type: String },
    registeredEvents: [{ type: String }],
    profilePhoto: { type: String },
  },
  {
    strict: false,      // allow unknown extra fields
    timestamps: true,
    _id: false,         // _id is a custom string, not ObjectId
  }
);

module.exports = registrationSchema;
