"use server";

import { joinStore } from "@/lib/auth/join";
import { createAction } from "@/lib/core/safe-action";
import { joinSchema } from "@/lib/validations/join.validation";

// Guest-only: `joinStore` calls `assertGuest()` itself.
export const joinAction = createAction(joinSchema, (values) => joinStore(values));
