import "server-only";

import { z } from "zod";

import { AppError } from "@/lib/core/errors";
import { db } from "@/lib/db";
import { emptyToNull, productDisplayName } from "@/lib/products/products";
import { dayToDbDate, dbDateToDay, todayIn } from "@/lib/pulls/pull-dates";
import {
  pullItemFieldsSchema,
  type CreatePullItemValues,
} from "@/lib/validations/scan.validation";

export type PendingPullItem = { id: string; expiryDate: string | null; pullDate: string };

export type PullItemActor = { storeId: string; userId: string; timezone: string };

export async function listPendingPullItems(
  storeId: string,
  gtin: string,
): Promise<PendingPullItem[]> {
  const rows = await db.pullItem.findMany({
    where: { storeId, gtin, status: "PENDING" },
    orderBy: [{ pullDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, expiryDate: true, pullDate: true },
  });
  return rows.map((row) => ({
    id: row.id,
    expiryDate: row.expiryDate ? dbDateToDay(row.expiryDate) : null,
    pullDate: dbDateToDay(row.pullDate),
  }));
}

/** Saves a pending pull item and writes the location back to the store's product. */
export async function createPullItem(
  actor: PullItemActor,
  input: CreatePullItemValues,
): Promise<{ productName: string }> {
  const parsed = pullItemFieldsSchema(todayIn(actor.timezone)).safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION",
      "Check the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }
  const values = parsed.data;
  const expiryDate = values.expiryDate === "" ? null : dayToDbDate(values.expiryDate);
  const pullDate = dayToDbDate(values.pullDate);

  return db.$transaction(async (tx) => {
    const storeProduct = await tx.storeProduct.findUnique({
      where: { storeId_gtin: { storeId: actor.storeId, gtin: input.gtin } },
      select: { id: true, name: true, product: { select: { name: true } } },
    });
    if (!storeProduct) {
      throw new AppError("NOT_FOUND", "We couldn't find this product. Scan it again.");
    }

    const duplicate = await tx.pullItem.findFirst({
      where: { storeId: actor.storeId, gtin: input.gtin, status: "PENDING", expiryDate, pullDate },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppError("CONFLICT", "This product already has a pull item with these dates.", {
        pullDate: ["This product already has a pull item with these dates"],
      });
    }

    const productName = productDisplayName(storeProduct.name, storeProduct.product.name);
    await tx.pullItem.create({
      data: {
        storeId: actor.storeId,
        gtin: input.gtin,
        productName,
        expiryDate,
        pullDate,
        createdById: actor.userId,
        events: { create: { userId: actor.userId, action: "CREATED" } },
      },
    });
    await tx.storeProduct.update({
      where: { id: storeProduct.id },
      data: {
        aisle: emptyToNull(values.aisle),
        section: emptyToNull(values.section),
        shelf: emptyToNull(values.shelf),
      },
    });
    return { productName };
  });
}
