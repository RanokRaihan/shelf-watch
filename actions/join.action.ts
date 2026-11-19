"use server";

import { joinStore, rejoinStore } from "@/lib/auth/join";
import { createAction } from "@/lib/core/safe-action";
import { joinSchema, rejoinSchema } from "@/lib/validations/join.validation";

// Guest-only: `joinStore` calls `assertGuest()` itself.
export const joinAction = createAction(joinSchema, (values) => joinStore(values));

// Guest-only: `rejoinStore` calls `assertGuest()` itself.
export const rejoinAction = createAction(rejoinSchema, (values) => rejoinStore(values));
