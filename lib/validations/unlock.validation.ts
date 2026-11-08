import { z } from "zod";

import { PIN_LENGTH } from "@/lib/validations/register.validation";

export const unlockSchema = z.object({
  pin: z
    .string()
    .regex(new RegExp(`^\\d{${PIN_LENGTH}}$`), `Enter your ${PIN_LENGTH}-digit PIN`),
});

export type UnlockValues = z.infer<typeof unlockSchema>;
