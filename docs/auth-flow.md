# Shelf Watch: Authentication Flow

This file describes how sign in, sessions and permissions are meant to work in Shelf Watch.
Read it before writing or changing anything related to auth, sessions, devices, invites or roles.
If code and this file disagree, ask before changing either one.

---

## 1. The basic idea

Shelf Watch works like a store register, but on each colleague's own phone.

- **PIN** is for everyday work: scanning products, setting pull dates, marking items pulled.
- **Password** is for manager work: store settings, approving people, removing people, invite links.

There are **no shared store devices**. Every colleague uses their own personal phone. Every device belongs to exactly one user.

A PIN never works on its own. It only works on a phone that has already been trusted for that user (see Device token below). This is what makes a short PIN safe enough: someone on the internet cannot just type a username and guess PINs.

The password is not a separate login. A manager signs in with their PIN like everyone else. When they open a manager page, the app asks for their password and gives them manager access for a short time on top of their PIN session.

---

## 2. The three things we track

### Device token (long-lived)
- Answers: "Is this phone trusted, and who does it belong to?"
- Stored in the `Device` table. Only a hash of the token is saved, never the raw token.
- Sent to the browser in an httpOnly cookie named `sw_device`.
- Lasts about 90 days, renewed each time the phone is used (`lastSeenAt` is updated).
- A device only counts if it has `approvedAt` set and `revokedAt` empty.

### Session (short-lived)
- Answers: "Who is using the app right now, and are they still active?"
- Stored in the `Session` table. The row id is the hash of the cookie token.
- Sent to the browser in an httpOnly cookie named `sw_session`.
- Created when the user enters a correct PIN.
- Ends when:
  - the user has been idle for **30 minutes** (`lastActiveAt` is too old), or
  - it reaches the absolute limit of about **10 hours** (`expiresAt`, roughly one shift), or
  - the user locks or logs out, or
  - a manager disables the user or revokes the device.
- An ended session is deleted from the database, not just marked.

### Manager access (very short-lived)
- Answers: "Has this manager confirmed their password recently?"
- Stored as `managerUntil` on the `Session` row, not on the User.
- Set to now + **15 minutes** after a correct password.
- Nothing has to happen when it runs out. The next manager check compares the time, fails, and asks for the password again.
- Because it lives on the session, locking or ending the session also ends manager access.

### Why database sessions and not JWT
The database row is the truth. When a manager removes a person or a lost phone, we delete their session rows and they are out on their very next request. A JWT would stay valid until it expires.

---

## 3. How every request is checked

There is one helper (in `lib/auth.ts`) that every protected page and every server action uses. Roughly:

1. Read the `sw_session` cookie and hash it.
2. Find the Session row, including its user and device.
3. Reject and send to `/unlock` if any of these is true:
   - no row found
   - `expiresAt` has passed
   - `lastActiveAt` is more than 30 minutes ago (delete the row)
   - the device is revoked or not approved
   - the user status is not ACTIVE
4. If `lastActiveAt` is more than about 1 minute old, update it. (Do not write on every single request.)
5. Return the user, device and session.

A second helper, for manager-only things, does the above and then also checks:

- the user role is MANAGER, and
- `managerUntil` is in the future.

If the role is right but the time ran out, send to the password screen. If the role is wrong, refuse.

### Important rules
- **Every server action in `/actions` must call the auth helper itself.** Server actions can be called directly, so protecting the page is not enough.
- **The store id always comes from the session**, never from form input or URL params.
- **Role is read from the database on every request**, so a demotion takes effect right away.
- Do not depend on Next.js middleware for the real check. Middleware can at most send people with no cookie to `/unlock`.

### Idle time on the phone
A home screen app coming back from the background often shows the old page without reloading. To handle this, the client listens for the app becoming visible again and refreshes, so the server check runs and an expired session goes straight to `/unlock`.

---

## 4. User flows

### 4.1 Manager creates a store
1. Opens the landing page, taps Register.
2. Enters name, username, phone, email, password, store name and timezone.
3. The store is created. This person becomes the MANAGER and is ACTIVE right away.
4. They set a PIN for everyday work.
5. Their phone becomes a trusted, approved device (`sw_device` is set) and a session starts.

### 4.2 Manager creates the join link / QR
1. Opens Settings. The app asks for the password, which gives manager access.
2. Taps "Create join link". A `StoreInvite` row is created (token hash, expiry) and a QR code is shown.
3. The manager can print it or show it on screen.
4. "Rotate link" revokes the old invite and creates a new one. Old QR codes stop working.

### 4.3 Colleague joins
1. Scans the store QR. It opens the join page in the browser.
2. Enters name, username, phone and PIN (entered twice).
3. A User is created with status **PENDING** and role ASSOCIATE.
4. A Device is created for this phone, tied to the new user, with `approvedAt` empty. `sw_device` is set.
5. The screen says "Waiting for manager approval."
6. The manager sees the request and taps Approve (needs manager access). This sets the user to ACTIVE and sets `approvedAt` on the device.
7. Next time the colleague opens the app, they see the PIN screen.

Approval exists because the QR is universal. Without it, anyone with a photo of the QR, or someone who used to work there, could join.

### 4.4 Everyday use
1. Colleague opens the app. The device token is valid, so the PIN screen shows their name already.
2. Enters PIN. The server checks it and creates a session.
3. They scan products and set dates.
4. After 30 minutes idle, the session ends. Next time they only need the PIN again.

### 4.5 Manager action
1. Manager is using the app normally with their PIN.
2. Taps Settings, Approve, Remove, Reset PIN, or anything else manager-only.
3. If `managerUntil` is empty or in the past, they see the password screen.
4. Correct password sets `managerUntil` to now + 15 minutes, and they go back to where they were.
5. After 15 minutes they are still signed in, just without manager access.

### 4.6 Forgot PIN
1. Colleague asks the manager.
2. Manager taps "Reset PIN" on that person (needs manager access).
3. Next time the colleague opens the app on their trusted phone, they are asked to set a new PIN. The trusted device proves who they are, so no temporary PIN is needed.

### 4.7 New phone
1. Colleague scans the store QR on the new phone and enters their existing username and PIN.
2. A new Device is created for their user with `approvedAt` empty.
3. Manager approves the new device.
4. The old phone can be revoked from the manager's device list.

### 4.8 Forgot password (manager)
Standard email reset link. This needs an email sending service set up before launch.

### 4.9 Removing a person
1. Manager taps Remove on a user (needs manager access).
2. User status becomes DISABLED.
3. In the same database transaction, all their sessions are deleted and all their devices are revoked.
4. They are locked out on their next request.

### 4.10 Revoking a lost phone
1. Manager (or the user, later) revokes one device.
2. In the same transaction, `revokedAt` is set and every session on that device is deleted.
3. Setting `revokedAt` alone is not enough, because existing sessions would keep working until they time out.

### 4.11 Promoting someone
1. Manager promotes a user (needs manager access).
2. Before the new role takes effect, that user must add an email and password.
3. Reason: members join with only username, phone and PIN. A manager without a password would be able to do manager things with just a PIN.

---

## 5. Brute force protection

### PIN
- Wrong PIN attempts are counted on the server (`failedPinAttempts` on User). Never trust a count kept in the browser.
- After 5 wrong tries, lock that user with `lockedUntil`. The lock gets longer each time: about 1 minute, then 5, then 15.
- A correct PIN resets the count.

### Password
- Same idea with `failedPasswordAttempts` and `passwordLockedUntil`.

### Storing secrets
- PINs and passwords are stored only as hashes (bcrypt or argon2).
- Session tokens, device tokens and invite tokens are stored only as hashes (sha256 is fine since they are long random values).

---

## 6. Cookies

- `sw_device`: httpOnly, Secure, SameSite=Lax, about 90 days, renewed on use.
- `sw_session`: httpOnly, Secure, SameSite=Lax, max age matches the session's absolute limit.
- Cookies only carry random keys. The database decides if they are valid.

---

## 7. Known issues and open questions

- **iOS home screen and cookies.** On iPhone, an app added to the home screen may not share cookies with Safari. A colleague who joins in Safari through the QR and then adds the app to the home screen may open it with no device token. Test this on a real iPhone. A possible fix: after joining, Safari shows a short one-time link code (valid about 10 minutes), and the home screen app asks for it on first open if it has no device token.
- **Offline.** PIN checks need a network connection. For version 1, show a clear "No connection" message. Offline unlock is a later feature.
- **MODERATOR role.** What a moderator can do is not decided yet. If moderators can do anything that needs manager access, they also need an email and password, and the manager check must include them.
- **Phone number.** Required on every user and unique. Stored as E.164 (for example `+12155551234`). Used for the daily morning text to the manager.
- **Username** is unique across the whole app, not per store.
