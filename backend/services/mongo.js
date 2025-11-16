// backend/services/mongo.js
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

module.exports = {
  async connect() {
    if (!uri) throw new Error('MONGODB_URI not set in .env');
    if (mongoose.connection.readyState === 1) return;
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🗄️  Connected to MongoDB');
  },
};
