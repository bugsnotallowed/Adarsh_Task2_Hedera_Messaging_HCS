// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongo = require('./services/mongo');

const hederaRoutes = require('./routes/hederaRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/hedera', hederaRoutes);

const PORT = process.env.PORT || 5000;

mongo.connect().catch((err) => {
  console.warn('⚠ Could not connect to MongoDB at startup:', err.message);
  // we continue: connect() will be attempted lazily elsewhere
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
