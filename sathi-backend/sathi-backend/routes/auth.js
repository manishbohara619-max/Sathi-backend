// routes/auth.js
// Admin login. This is intentionally simple for the MVP: one admin
// account read from environment variables. Before you have more than
// one admin/staff member, replace this with a real "admins" table
// with hashed passwords per person.

const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });

  res.json({ token, expiresIn: '12h' });
});

module.exports = router;
