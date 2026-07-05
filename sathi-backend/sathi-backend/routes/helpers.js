// routes/helpers.js
// Covers three things:
//  1. Public: someone applying to become a helper (with ID + selfie upload)
//  2. Public: customers browsing VERIFIED helpers only
//  3. Admin:  reviewing the pending queue and approving/rejecting

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const upload = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Fields that should NEVER be sent to the public (customer-facing) API,
// because they are private identity documents or contact details used
// only during verification.
function toPublicHelper(helper) {
  const { idDocumentPath, selfiePath, phone, rejectionReason, ...publicFields } = helper;
  return publicFields;
}

// ---------------------------------------------------------------------
// POST /api/helpers/apply
// A person applies to become a helper. Multipart form with two files:
// idDocument and selfie, plus text fields: name, phone, city, serviceType.
// ---------------------------------------------------------------------
router.post(
  '/apply',
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  (req, res) => {
    const { name, phone, city, serviceType } = req.body;

    if (!name || !phone || !city || !serviceType) {
      return res.status(400).json({
        error: 'name, phone, city, and serviceType are all required.',
      });
    }

    if (!req.files || !req.files.idDocument || !req.files.selfie) {
      return res.status(400).json({
        error: 'Both idDocument and selfie files are required.',
      });
    }

    const helper = {
      id: uuidv4(),
      name,
      phone,
      city,
      serviceType,
      tags: [],
      status: 'pending', // pending -> verified | rejected
      idDocumentPath: req.files.idDocument[0].filename,
      selfiePath: req.files.selfie[0].filename,
      rejectionReason: null,
      appliedAt: new Date().toISOString(),
      verifiedAt: null,
    };

    db.insertHelper(helper);

    res.status(201).json({
      message: 'Application received. We will review your documents shortly.',
      applicationId: helper.id,
      status: helper.status,
    });
  }
);

// ---------------------------------------------------------------------
// GET /api/helpers?city=Pokhara
// Public: list only VERIFIED helpers. Never exposes documents/phone.
// ---------------------------------------------------------------------
router.get('/', (req, res) => {
  const { city, serviceType } = req.query;
  let helpers = db.getAllHelpers().filter(h => h.status === 'verified');

  if (city) {
    helpers = helpers.filter(h => h.city.toLowerCase() === city.toLowerCase());
  }
  if (serviceType) {
    helpers = helpers.filter(h => h.serviceType.toLowerCase() === serviceType.toLowerCase());
  }

  res.json({ count: helpers.length, helpers: helpers.map(toPublicHelper) });
});

// ---------------------------------------------------------------------
// GET /api/helpers/:id
// Public: single verified helper's public profile.
// ---------------------------------------------------------------------
router.get('/:id', (req, res) => {
  const helper = db.getHelperById(req.params.id);
  if (!helper || helper.status !== 'verified') {
    return res.status(404).json({ error: 'Helper not found.' });
  }
  res.json(toPublicHelper(helper));
});

// ---------------------------------------------------------------------
// ADMIN ROUTES BELOW - all require a valid admin token
// ---------------------------------------------------------------------

// GET /api/helpers/admin/queue  - everyone still pending review
router.get('/admin/queue', requireAdmin, (req, res) => {
  const pending = db.getAllHelpers().filter(h => h.status === 'pending');
  res.json({ count: pending.length, queue: pending });
});

// GET /api/helpers/admin/all  - every helper, any status (for admin dashboard)
router.get('/admin/all', requireAdmin, (req, res) => {
  res.json({ helpers: db.getAllHelpers() });
});

// POST /api/helpers/admin/:id/approve
router.post('/admin/:id/approve', requireAdmin, (req, res) => {
  const helper = db.getHelperById(req.params.id);
  if (!helper) return res.status(404).json({ error: 'Helper not found.' });

  const updated = db.updateHelper(helper.id, {
    status: 'verified',
    verifiedAt: new Date().toISOString(),
    rejectionReason: null,
  });

  // TODO: send the helper an SMS/notification here that they're approved.
  res.json({ message: 'Helper approved and now visible to customers.', helper: updated });
});

// POST /api/helpers/admin/:id/reject   body: { reason: "..." }
router.post('/admin/:id/reject', requireAdmin, (req, res) => {
  const helper = db.getHelperById(req.params.id);
  if (!helper) return res.status(404).json({ error: 'Helper not found.' });

  const updated = db.updateHelper(helper.id, {
    status: 'rejected',
    rejectionReason: req.body.reason || 'Not specified',
  });

  // TODO: send the helper an SMS/notification here explaining why.
  res.json({ message: 'Helper rejected.', helper: updated });
});

module.exports = router;
