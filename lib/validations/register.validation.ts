import { z } from "zod";

export const DEFAULT_TIMEZONE = "America/New_York";

export const TIMEZONES = [
  { value: DEFAULT_TIMEZONE, label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Mountain, no DST (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
];

export const PIN_LENGTH = 4;

// Usernames are stored lowercase, so the unique index on `User.username` makes
// duplicates case-insensitive ("Bob" and "bob" clash). Reuse this for sign-in
// so lookups match.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or fewer")
  // `*`, not `+`: an empty value only gets the min-length message. Don't use
  // `abort: true` instead; it stops the confirm-password check in registerSchema.
  .regex(/^[a-z0-9_.]*$/, "Use only letters, numbers, dots, and underscores");

// US numbers only for now (matching the US-only timezone list). Accepts
// common formats like "(215) 555-1234", "215.555.1234" or "+1 215 555 1234"
// and outputs E.164 ("+12155551234"), the format stored in `User.phone`.
// Reuse this wherever a phone number is entered so lookups match.
const US_E164 = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Enter your phone number")
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return value;
  })
  .pipe(z.string().regex(US_E164, "Enter a valid US phone number"));

// A person's display name. Shared with the join form.
export const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(100, "Name must be 100 characters or fewer");

// Everyday PIN (docs/auth-flow.md 1). Shared with the join form.
export const pinSchema = z
  .string()
  .regex(new RegExp(`^\\d{${PIN_LENGTH}}$`), `PIN must be ${PIN_LENGTH} digits`);

const registerFields = z.object({
  // Store
  storeName: z
    .string()
    .trim()
    .min(1, "Enter your store name")
    .max(100, "Store name must be 100 characters or fewer"),
  location: z
    .string()
    .trim()
    .max(200, "Location must be 200 characters or fewer"),
  timezone: z.enum(
    TIMEZONES.map((timezone) => timezone.value),
    "Choose a timezone",
  ),

  // User
  name: nameSchema,
  username: usernameSchema,
  // Optional in the schema (associates), but required for the manager.
  // Lowercased so the unique index on `User.email` is case-insensitive.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email")
    .pipe(z.email("Enter a valid email address")),
  phone: phoneSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer"),
  confirmPassword: z.string().min(1, "Confirm your password"),
  pin: pinSchema,
  confirmPin: z.string().min(1, "Confirm your PIN"),
});

// Also checked on the server, since the action validates with this schema.
// Each `when` lets its check run even when other fields fail, so the mismatch
// shows in the same submit.
export const registerSchema = registerFields
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
    when: (payload) =>
      registerFields
        .pick({ password: true, confirmPassword: true })
        .safeParse(payload.value).success,
  })
  .refine((values) => values.pin === values.confirmPin, {
    error: "PINs don't match",
    path: ["confirmPin"],
    when: (payload) =>
      registerFields
        .pick({ pin: true, confirmPin: true })
        .safeParse(payload.value).success,
  });

export type RegisterValues = z.infer<typeof registerSchema>;
