require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/stores',   require('./routes/stores'));
app.use('/api/products', require('./routes/products'));

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '📡 StoreRadar API is running', version: '1.0.0' });
});

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong on the server' });
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 StoreRadar server running on http://localhost:${PORT}`);
});
