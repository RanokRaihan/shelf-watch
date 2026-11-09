import { z } from "zod";

import {
  nameSchema,
  phoneSchema,
  pinSchema,
  usernameSchema,
} from "@/lib/validations/register.validation";

// Join links are 32 random bytes in base64url (43 characters); anything far
// longer can't be one.
export const joinTokenSchema = z.string().min(1).max(128);

const joinFields = z.object({
  // From the URL. The server looks the store up from it; the form never sends
  // a store id.
  token: joinTokenSchema,
  name: nameSchema,
  username: usernameSchema,
  phone: phoneSchema,
  pin: pinSchema,
  confirmPin: z.string().min(1, "Confirm your PIN"),
});

// Same pattern as registerSchema: the `when` lets the mismatch show in the
// same submit as other errors. Also checked on the server.
export const joinSchema = joinFields.refine(
  (values) => values.pin === values.confirmPin,
  {
    error: "PINs don't match",
    path: ["confirmPin"],
    when: (payload) =>
      joinFields.pick({ pin: true, confirmPin: true }).safeParse(payload.value)
        .success,
  },
);

export type JoinValues = z.infer<typeof joinSchema>;
