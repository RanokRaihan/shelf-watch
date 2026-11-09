import { z } from "zod";

// The member a manager acts on. The store comes from the session, never from
// here; `lib/members.ts` scopes every lookup by it.
export const memberActionSchema = z.object({
  userId: z.string().min(1).max(64),
});
