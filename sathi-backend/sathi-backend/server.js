// server.js
// Entry point for the Sathi backend API.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const helperRoutes = require('./routes/helpers');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check - useful when deploying, to confirm the server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/helpers', helperRoutes);
app.use('/api/bookings', bookingRoutes);

// NOTE: uploaded documents are intentionally NOT served as static public
// files here, since they are sensitive ID/selfie images. An admin-only
// "view document" endpoint should be added before going live, rather
// than exposing the uploads folder directly.

// Central error handler (e.g. catches multer file-type/size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Sathi backend running on http://localhost:${PORT}`);
});
