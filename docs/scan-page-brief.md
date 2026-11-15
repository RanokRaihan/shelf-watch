# Scan Page Flow

Make a plan for this flow and show it to me before writing code.

## Flow

1. **Scan** the barcode (already implemented). Normalize it to a GTIN and validate the check digit.
   - Invalid: show "Couldn't read that barcode" with **Rescan** and **Type the number**.
2. **Look up our database** (`Product` by GTIN).
   - Found: do not call the API. Create the `StoreProduct` for this store if it doesn't exist yet. Then:
     - The product has pending pull items in this store: go to **already tracked**.
     - No pending pull items: go to the **date entry form**.
   - Not found: go to step 3.
3. **Third-party API lookup.** Implement the free Open Food Facts API now. Put it behind a provider interface so more APIs can be added later. Show a loading state and use a timeout of about 5 seconds. Nothing is saved in this step.
   - Match: go to the **product form**, prefilled with the API data.
   - No match: go to the **product form**, empty.
   - Error or timeout: show **Retry** and **Enter manually** (empty product form).
4. **Product form:** the user checks or enters the details and saves. This creates the `Product` and the `StoreProduct`. Then go to the **date entry form**.
   - This flow only creates products, never edits them. If the `Product` already exists when saving (another user saved the same barcode first), keep the existing row unchanged and continue with it.
5. **Date entry form:** save the pull item, show a success toast, and go back to the scanner for the next item.

**Already tracked** is its own screen. It shows the product name, brand, size and barcode number, plus a list of the pending pull items (expiry date and pull date for each). It has two buttons:

- **Cancel**: back to the scanner.
- **Add another date**: go to the **date entry form**.

Every screen after the scan has Cancel or Rescan, which goes back to the scanner.

## Page structure

- One page at `/scan`. Switch screens with conditional rendering, not separate routes.
- Keep the current step in a reducer: `scanning → looking-up → already-tracked / product-form → date-form → scanning`. Each screen is its own component.
- Camera handling:
  - During the scan → form → scan loop, keep the camera stream on so the next scan is instant.
  - Always pause barcode detection while any other screen is open. Only run it on the scanning step.
  - Stop the camera stream fully when:
    - the page is hidden (app switched, screen locked)
    - a screen has been open for about 60 seconds with no user activity
    - the user leaves `/scan`
  - Restart the stream when the user comes back to the scanning step.
- Phone back button: push a history entry on each step change (`?step=date-form`). On `popstate`, go back one step instead of leaving `/scan`.
- Refreshing the page loses state and returns to scanning. That's fine; don't persist it.
- Layout: either swap the whole screen, or show the screens in a shadcn `Drawer` over the paused camera. Recommend one in your plan.

## UI

- Build everything with shadcn, including the forms. Use the shadcn basic date picker.
- Mark every required field with `*`. Label every optional field "(optional)".

**Product form:**

- Barcode number shown read-only at the top, so the user can check it against the package.
- Product name *
- Brand (optional)
- Size (optional), placeholder like "12 fl oz"
- Image (optional): if the API gave one, show a preview with a Remove option.
- When prefilled from the API, show a short note: "Check these details before saving."

**Date entry form:**

- At the top: product name, brand, size and barcode number.
- Fields in this order:
  1. Expiry date (optional)
  2. Offset choice. Shows only when an expiry date is entered. Options: 1 week, 2 weeks, 1 month, 2 months. Selecting one fills the pull date as expiry minus the offset. Use calendar math for months.
  3. Pull date *
  4. Location (optional): aisle, section, shelf. Collapsed by default, prefilled from `StoreProduct`. Saving the form writes them back to `StoreProduct`.
- Preselect the offset that matches the item's or store's lead days, if it matches one of the four options.
- If the expiry date changes, recalculate the pull date. If the user edits the pull date by hand, clear the offset.

## Validation

Validate every user input in a way that makes sense for that field. Run the same rules on the client (inline errors) and in the server action (never trust the client).

**Dates:**

- Every date must be today or later. "Today" means today in the store's timezone.
- Pull date is required. It must be on or before the expiry date, when there is one.
- If the offset gives a pull date before today, set the pull date to today and show a note saying so.
- Reject dates unreasonably far out (for example more than 5 years ahead) to catch typos.
- Block an exact duplicate: same product, same expiry date and pull date, still pending.

**Barcode:**

- Digits only, valid length for its format, valid check digit.

**Text fields:**

- Trim spaces. Required fields can't be empty or only spaces.
- Set sensible max lengths (for example name 100, brand 60, size 30, aisle/section/shelf 20).
- Product name can't be only digits (catches a barcode pasted into the name field).

## Code quality

- Keep components small, and give each one a single job. Split a file when it gets hard to read.
- Use clear names for variables, functions and components. Avoid short or vague names like `data`, `res`, `tmp`.
- Don't repeat logic. Put shared code (GTIN normalization, date math, validation rules) in one place and reuse it.
- Keep business logic out of UI components. Components show things and handle input; the logic lives in plain functions and server actions.
- Use strict TypeScript types. No `any`.
- Handle every error state. Don't fail silently, and show the user a clear message.
- Follow the existing project structure, naming and patterns. Don't add new libraries unless they are really needed; ask first.
- Write comments only where the code can't explain itself (the why, not the what).
- Remove unused code, imports and console logs before finishing.
