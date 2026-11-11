"use server";

import { ok } from "@/lib/core/action-result";
import {
  approveMember,
  endMemberSession,
  rejectMember,
  removeMember,
  revokeMemberDevice,
} from "@/lib/store/members";
import { createAction } from "@/lib/core/safe-action";
import { requireManager } from "@/lib/auth/session";
import {
  memberActionSchema,
  memberDeviceActionSchema,
} from "@/lib/validations/members.validation";

// Manager-only member actions. `requireManager()` runs first (no session goes
// to `/unlock`, expired manager access to `/manage/login`; `createAction`
// rethrows the redirect). The store comes from the session, never the client.
async function actor() {
  const { user, device } = await requireManager();
  return { storeId: user.storeId, userId: user.id, deviceId: device.id };
}

export const approveMemberAction = createAction(memberActionSchema, async ({ userId }) => {
  const { name } = await approveMember(await actor(), userId);
  return ok({ name }, `${name} can now unlock with their PIN.`);
});

export const rejectMemberAction = createAction(memberActionSchema, async ({ userId }) => {
  const { name } = await rejectMember(await actor(), userId);
  return ok({ name }, `${name}'s request was rejected.`);
});

export const removeMemberAction = createAction(memberActionSchema, async ({ userId }) => {
  const { name } = await removeMember(await actor(), userId);
  return ok({ name }, `${name} was removed and signed out.`);
});

export const endMemberSessionAction = createAction(
  memberDeviceActionSchema,
  async ({ userId, deviceId }) => {
    const { name, deviceLabel } = await endMemberSession(await actor(), userId, deviceId);
    return ok({ name }, `${name} was signed out of ${deviceLabel ?? "their phone"}.`);
  },
);

export const revokeMemberDeviceAction = createAction(
  memberDeviceActionSchema,
  async ({ userId, deviceId }) => {
    const { name, deviceLabel } = await revokeMemberDevice(await actor(), userId, deviceId);
    return ok({ name }, `${deviceLabel ?? "Phone"} was revoked. ${name} is signed out on it.`);
  },
);
