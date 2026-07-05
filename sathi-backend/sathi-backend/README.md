# Sathi Backend (MVP)

Backend API for Sathi — a verified local helper/guide hiring platform.
This is a working starter backend, not the finished product. It's built
so a developer can extend it, or so you can test the real flow with a
small group of real users before investing more money.

## What this does

- Someone applies to become a helper and uploads an ID photo + selfie
- Their application sits in a **pending queue**
- You (admin) log in, review the documents, and **approve or reject**
- Only approved ("verified") helpers are visible to customers
- Customers can browse verified helpers and **request a booking**

## What this does NOT do yet (on purpose, for an MVP)

- No automatic ID-authenticity checking or face-match — a human (you or
  your staff) reviews the actual document/selfie images and decides.
  This is completely normal for an MVP; automated KYC (e-KYC) services
  can be added later once you have volume that justifies the cost.
- No payments — booking requests are recorded, but no money moves
  through this system yet.
- No SMS/notifications — search for `TODO` comments in the code for
  exactly where these should be added.
- Files are stored on the local disk of the server, not cloud storage.
  Fine for testing, not for real ID documents in production — see
  "Before you go live" below.

## Requirements

- Node.js version 18 or later installed on your computer or server
- No database server needed — data is stored in JSON files under `data/`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the example environment file and edit it
cp .env.example .env
```

Open `.env` and set:
- `JWT_SECRET` — any long random string (this signs admin login sessions)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — the login you'll use to approve helpers

```bash
# 3. Start the server
npm start
```

You should see: `Sathi backend running on http://localhost:4000`

## Testing it works

Check the server is alive:
```bash
curl http://localhost:4000/api/health
```

## API Reference

### Public — anyone can call these

**Apply to become a helper**
```
POST /api/helpers/apply
Content-Type: multipart/form-data

Fields: name, phone, city, serviceType
Files:  idDocument, selfie
```

**Browse verified helpers**
```
GET /api/helpers?city=Pokhara
```
(city and serviceType filters are both optional)

**View one verified helper**
```
GET /api/helpers/:id
```

**Request a booking**
```
POST /api/bookings
Content-Type: application/json

{
  "helperId": "...",
  "customerName": "John Traveler",
  "customerPhone": "9800000000",
  "date": "2026-07-12",
  "duration": "Full day",
  "notes": "Show us around Phewa Lake"
}
```

**Check a booking's status**
```
GET /api/bookings/:id
```

### Admin only — require login first

**Log in**
```
POST /api/auth/admin/login
Content-Type: application/json

{ "username": "admin", "password": "your_password" }
```
Returns a `token`. Send it on every admin request below as a header:
```
Authorization: Bearer <token>
```

**See who's waiting for review**
```
GET /api/helpers/admin/queue
```

**Approve a helper** (makes them visible to customers immediately)
```
POST /api/helpers/admin/:id/approve
```

**Reject a helper**
```
POST /api/helpers/admin/:id/reject
Content-Type: application/json

{ "reason": "ID photo was blurry, please resubmit" }
```

**See every helper, any status**
```
GET /api/helpers/admin/all
```

**See every booking**
```
GET /api/bookings/admin/all
```

**Update a booking's status**
```
POST /api/bookings/:id/status
Content-Type: application/json

{ "status": "confirmed" }
```
(valid values: `requested`, `confirmed`, `completed`, `cancelled`)

## Connecting the frontend prototype to this backend

The HTML prototype shown earlier stores everything in memory in the
browser. To connect it to this real backend, replace its JavaScript
functions with calls to these API endpoints using `fetch()`. For
example, the "Approve" button would call:

```js
fetch(`http://localhost:4000/api/helpers/admin/${helperId}/approve`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

A developer can do this fairly quickly since every screen in the
prototype maps directly to one of the endpoints above.

## Before you go live (important)

1. **Move ID documents to encrypted cloud storage** (e.g. AWS S3 with
   private access, Cloudflare R2) instead of the local `uploads/`
   folder. These are sensitive personal documents.
2. **Move from JSON files to a real database** (Postgres or MySQL) once
   you have real users — `db.js` is written so only that one file needs
   to change, not the rest of the app.
3. **Use HTTPS** in production — never send ID photos over plain HTTP.
4. **Add rate limiting** on `/api/helpers/apply` so someone can't spam
   fake applications.
5. **Add a way for admins to actually view the uploaded document images**
   securely (an authenticated "view document" endpoint) — deliberately
   left out of this MVP since it needs care around who can see them.
6. **Talk to a lawyer about Nepal's data protection requirements** for
   storing citizenship/ID documents before handling real users' data.
7. Consider Nepal-based payment gateways (eSewa, Khalti) when you're
   ready to add real payments for bookings.

## Project structure

```
sathi-backend/
  server.js           - starts the app, wires everything together
  db.js                - data storage (JSON files for now)
  routes/
    auth.js             - admin login
    helpers.js          - apply / browse / admin approve-reject
    bookings.js         - create booking / admin manage
  middleware/
    auth.js             - checks admin login token
    upload.js           - handles ID/selfie file uploads
  data/                 - JSON "database" files (created automatically)
  uploads/              - uploaded ID/selfie files (created automatically)
```
