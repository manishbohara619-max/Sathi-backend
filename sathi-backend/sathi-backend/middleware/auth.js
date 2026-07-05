// middleware/auth.js
// Protects admin-only routes. The admin app must log in first via
// POST /api/auth/admin/login to get a token, then send it on every
// admin request as:  Authorization: Bearer <token>

const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing admin token. Log in via /api/auth/admin/login first.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized as admin.' });
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = { requireAdmin };
