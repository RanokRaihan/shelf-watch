import { z } from "zod";

export const signInSchema = z.object({
  // Username or email. Both are stored lowercase, so lowercase here to match.
  identifier: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your username or email")
    .max(254, "That's too long for a username or email"),
  // 72 is bcrypt's limit, matching signup.
  password: z
    .string()
    .min(1, "Enter your password")
    .max(72, "Password must be 72 characters or fewer"),
});

export type SignInValues = z.infer<typeof signInSchema>;
