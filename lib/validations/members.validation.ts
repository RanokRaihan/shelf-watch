import { z } from "zod";

// The member a manager acts on. The store comes from the session, never from
// here; `lib/members.ts` scopes every lookup by it.
export const memberActionSchema = z.object({
  userId: z.string().min(1).max(64),
});

// One phone of that member, for signing out or revoking it.
export const memberDeviceActionSchema = memberActionSchema.extend({
  deviceId: z.string().min(1).max(64),
});
