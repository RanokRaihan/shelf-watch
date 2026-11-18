import { z } from "zod";

// The store comes from the session, never from here.
export const markPullItemSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(["PULLED", "SKIPPED"]),
});

export const undoPullItemSchema = z.object({
  id: z.string().min(1).max(64),
});
