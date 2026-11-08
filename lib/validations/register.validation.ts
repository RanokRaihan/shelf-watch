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

export const registerSchema = z.object({
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
  name: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(100, "Name must be 100 characters or fewer"),
  username: z
    .string()
    .trim()
    .min(3, { error: "Username must be at least 3 characters", abort: true })
    .max(30, "Username must be 30 characters or fewer")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Use only letters, numbers, dots, and underscores",
    ),
  email: z.email("Enter a valid email address").or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer"),
  pin: z
    .string()
    .regex(new RegExp(`^\\d{${PIN_LENGTH}}$`), `PIN must be ${PIN_LENGTH} digits`),
});

export type RegisterValues = z.infer<typeof registerSchema>;
