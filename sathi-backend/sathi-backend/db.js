// db.js
// -----------------------------------------------------------------------
// Simple file-based data store for the Sathi MVP.
//
// This uses two JSON files on disk (data/helpers.json and data/bookings.json)
// instead of a real database. That's intentional for an MVP:
//   - Zero setup (no database server to install/configure)
//   - Easy for any developer to read and understand
//
// WHEN TO REPLACE THIS:
// Once you have real users and more than one server instance, swap this
// file for a real database (Postgres, MySQL, MongoDB). The rest of the app
// (routes/) only calls the functions exported here, so replacing this file
// is the *only* thing that needs to change - no route code should need to
// change if you keep the same function names and shapes.
// -----------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const HELPERS_FILE = path.join(DATA_DIR, 'helpers.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

ensureFile(HELPERS_FILE, []);
ensureFile(BOOKINGS_FILE, []);

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------- Helpers table ----------

function getAllHelpers() {
  return readJSON(HELPERS_FILE);
}

function saveAllHelpers(helpers) {
  writeJSON(HELPERS_FILE, helpers);
}

function getHelperById(id) {
  return getAllHelpers().find(h => h.id === id) || null;
}

function insertHelper(helper) {
  const helpers = getAllHelpers();
  helpers.push(helper);
  saveAllHelpers(helpers);
  return helper;
}

function updateHelper(id, updates) {
  const helpers = getAllHelpers();
  const idx = helpers.findIndex(h => h.id === id);
  if (idx === -1) return null;
  helpers[idx] = { ...helpers[idx], ...updates };
  saveAllHelpers(helpers);
  return helpers[idx];
}

// ---------- Bookings table ----------

function getAllBookings() {
  return readJSON(BOOKINGS_FILE);
}

function saveAllBookings(bookings) {
  writeJSON(BOOKINGS_FILE, bookings);
}

function getBookingById(id) {
  return getAllBookings().find(b => b.id === id) || null;
}

function insertBooking(booking) {
  const bookings = getAllBookings();
  bookings.push(booking);
  saveAllBookings(bookings);
  return booking;
}

function updateBooking(id, updates) {
  const bookings = getAllBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...updates };
  saveAllBookings(bookings);
  return bookings[idx];
}

module.exports = {
  getAllHelpers,
  getHelperById,
  insertHelper,
  updateHelper,
  getAllBookings,
  getBookingById,
  insertBooking,
  updateBooking,
};
