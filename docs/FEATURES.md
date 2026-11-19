# ShelfWatch: where the app stands

A quick snapshot as of 2026-11-17. For how things work, see `docs/auth-flow.md` and `docs/decisions.md`.

## Built

- Create a store and manager account [`/register`]
- Join a store from the wall QR or link, then wait for approval [`/join/[token]`, `/pending`]
- Show, print and rotate the store's join link and QR [`/manage/members/invite`]
- Unlock with a 4-digit PIN, with lockout after wrong tries [`/unlock`]
- Manager sign-in with password on a new browser [`/sign-in`]
- Member login on a new phone (or after losing the device cookie) with username + PIN from the store QR; other phones are logged out [`/join/[token]`]
- Manager access by password for 15 minutes, plus Lock [`/manage/login`]
- Log out (keeps the phone trusted) [user menu]
- Approve, reject and remove members [`/manage/members`]
- See a member's active sessions, sign one out, revoke a lost phone [`/manage/members/[id]`]
- Scan a barcode with the camera, or type the number [`/scan`]
- Look up the product (our database first, then Open Food Facts) and save it [`/scan`]
- Set a pull date with quick offsets (1 week to 2 months) and shelf location [`/scan`]
- Today, Previous (overdue) and Upcoming pull lists with counts [`/pulls`, `/pulls/previous`, `/pulls/upcoming`]
- Mark an item Pulled or Skipped, with Undo [`/pulls`]
- Landing page and light/dark mode [`/`]

## Partially built

- Manager overview [`/manage`]: placeholder welcome text only; the dashboard isn't built.
- Forgot PIN [`/unlock`]: tells people to ask their manager, but managers have no Reset PIN button yet.
- Forgot password [`/manage/login`]: shows "coming soon"; no reset flow exists.
- Product lookup [`/scan`]: only Open Food Facts; UPCitemdb is in the schema but has no provider.
- Moderator role: exists in the database, but what moderators can do is undecided and nothing uses it.

## Not built yet

### Must Have

- Reset PIN (planned): without it, a colleague who forgets their PIN is locked out for good.
- Password reset by email (planned): a manager who forgets their password loses all manager access.
- Rate limiting (planned): the join form is open to spam until this exists.

### Should Have

- Store settings: name, timezone, default lead days (planned): timezone drives every pull list and can't be changed after signup.
- Edit or delete a pull item (suggested): today a wrong date can only be skipped, not fixed.
- Restore a removed member (planned): removing someone by mistake can't be undone.
- Promote someone to manager (planned): a store has only its founding manager.
- "No connection" message (planned): the PIN check needs the network, and staff should see why it fails.
- Installable app with a home-screen icon (planned, PWA manifest): makes daily opening on a phone one tap.

### Could Have

- Manager dashboard with store stats (planned): useful once there's real data to show.
- Notifications for due items (planned, on hold until Ranok says so): the lists work without them.
- Analytics and reports (planned, on hold until Ranok says so): only matters after real use.
- Let people revoke their own lost phone (planned, "later" in auth-flow): managers can already do it.
- Offline PIN unlock (planned, "later" in auth-flow): a nice-to-have for dead zones in the back room.
- Filter or sort the pull list by aisle (suggested): faster shelf walks in big stores; aisle is already saved.
- Printable pull list (suggested): some teams walk the floor with paper.
